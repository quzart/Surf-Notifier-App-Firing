from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/push", tags=["push"])


@router.post("/subscribe")
def subscribe(
    sub: schemas.PushSubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    existing = (
        db.query(models.PushSubscription)
        .filter(models.PushSubscription.endpoint == sub.endpoint)
        .first()
    )

    if existing:
        existing.user_id = current_user.id
        existing.p256dh = sub.keys.p256dh
        existing.auth = sub.keys.auth
        db.commit()
        return {"detail": "Subscription updated"}

    db_sub = models.PushSubscription(
        user_id=current_user.id,
        endpoint=sub.endpoint,
        p256dh=sub.keys.p256dh,
        auth=sub.keys.auth,
    )
    db.add(db_sub)
    db.commit()
    return {"detail": "Subscription created"}


@router.delete("/unsubscribe")
def unsubscribe(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db.query(models.PushSubscription).filter(
        models.PushSubscription.user_id == current_user.id
    ).delete()
    db.commit()
    return {"detail": "Unsubscribed"}