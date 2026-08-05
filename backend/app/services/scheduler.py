from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.database import SessionLocal
from app import models
from app.services.evaluation import evaluate_spot
from app.services.notifier import notify

COOLDOWN_HOURS = 6


def was_recently_notified(db, preference_id, cooldown_hours=COOLDOWN_HOURS):
    log = (
        db.query(models.NotificationLog)
        .filter(models.NotificationLog.preference_id == preference_id)
        .order_by(models.NotificationLog.notified_at.desc())
        .first()
    )
    if not log:
        return False

    notified_at = log.notified_at.replace(tzinfo=None) if log.notified_at.tzinfo else log.notified_at
    elapsed = datetime.utcnow() - notified_at
    return elapsed < timedelta(hours=cooldown_hours)


async def poll_all_spots():
    db = SessionLocal()
    try:
        spots = db.query(models.Spot).all()

        for spot in spots:
            preferences = db.query(models.Preference).filter(models.Preference.spot_id == spot.id).all()
            if not preferences:
                continue

            evaluation = await evaluate_spot(spot, preferences)

            for result in evaluation["results"]:
                if not result["match"]:
                    continue

                preference_id = result["preference_id"]
                if was_recently_notified(db, preference_id):
                    continue

                conditions = evaluation["conditions"]
                message = (
                    f"{spot.name} is matching your conditions! "
                    f"Period: {conditions['wave_period']}s, "
                    f"Wind: {conditions['wind_speed']} @ {conditions['wind_direction']}°, "
                    f"Tide: {conditions['tide_stage']}"
                )
                await notify(message, title=f"Surf Alert: {spot.name}")

                log = models.NotificationLog(preference_id=preference_id)
                db.add(log)
                db.commit()
    finally:
        db.close()


scheduler = AsyncIOScheduler()


def start_scheduler():
    scheduler.add_job(poll_all_spots, "interval", hours=1, id="poll_all_spots", replace_existing=True)
    scheduler.start()


def stop_scheduler():
    scheduler.shutdown()