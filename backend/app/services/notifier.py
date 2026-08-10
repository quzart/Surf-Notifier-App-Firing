import os
import json
import httpx
from dotenv import load_dotenv
from pywebpush import webpush, WebPushException

load_dotenv()

PUSHOVER_API_TOKEN = os.getenv("PUSHOVER_API_TOKEN")
PUSHOVER_USER_KEY = os.getenv("PUSHOVER_USER_KEY")

PUSHOVER_URL = "https://api.pushover.net/1/messages.json"

VAPID_PRIVATE_KEY_PATH = "private_key.pem"
VAPID_CLAIMS = {"sub": "mailto:you@example.com"}


async def send_pushover(message: str, title: str = "Surf Notifier"):
    if not PUSHOVER_API_TOKEN or not PUSHOVER_USER_KEY:
        raise RuntimeError("Pushover credentials are not set in .env")

    payload = {
        "token": PUSHOVER_API_TOKEN,
        "user": PUSHOVER_USER_KEY,
        "title": title,
        "message": message,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(PUSHOVER_URL, data=payload)
        response.raise_for_status()
        return response.json()


def send_web_push(subscription, message: str, title: str = "Surf Notifier"):
    payload = json.dumps({"title": title, "body": message})

    webpush(
        subscription_info={
            "endpoint": subscription.endpoint,
            "keys": {
                "p256dh": subscription.p256dh,
                "auth": subscription.auth,
            },
        },
        data=payload,
        vapid_private_key=VAPID_PRIVATE_KEY_PATH,
        vapid_claims=VAPID_CLAIMS.copy(),
    )


async def notify_user(db, user_id, message: str, title: str = "Surf Notifier"):
    from app import models

    subscriptions = (
        db.query(models.PushSubscription)
        .filter(models.PushSubscription.user_id == user_id)
        .all()
    )

    results = []
    for sub in subscriptions:
        try:
            send_web_push(sub, message, title)
            results.append({"endpoint": sub.endpoint, "status": "sent"})
        except WebPushException as e:
            results.append({"endpoint": sub.endpoint, "status": "failed", "error": str(e)})
            if e.response is not None and e.response.status_code in (404, 410):
                db.delete(sub)
                db.commit()

    return results


async def notify(message: str, title: str = "Surf Notifier"):
    try:
        result = await send_pushover(message, title)
        return {"pushover": result}
    except Exception as e:
        return {"pushover_error": str(e)}