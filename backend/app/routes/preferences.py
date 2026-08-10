from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/spots/{spot_id}/preferences", tags=["preferences"])


def get_owned_spot(spot_id: int, db: Session, current_user: models.User):
    spot = (
        db.query(models.Spot)
        .filter(models.Spot.id == spot_id, models.Spot.user_id == current_user.id)
        .first()
    )
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    return spot


@router.post("/", response_model=schemas.PreferenceOut)
def create_preference(
    spot_id: int,
    pref: schemas.PreferenceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    get_owned_spot(spot_id, db, current_user)

    existing = db.query(models.Preference).filter(models.Preference.spot_id == spot_id).first()

    if existing:
        for field, value in pref.model_dump().items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing

    db_pref = models.Preference(**pref.model_dump(), spot_id=spot_id)
    db.add(db_pref)
    db.commit()
    db.refresh(db_pref)
    return db_pref


@router.get("/", response_model=list[schemas.PreferenceOut])
def list_preferences(
    spot_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    get_owned_spot(spot_id, db, current_user)
    return db.query(models.Preference).filter(models.Preference.spot_id == spot_id).all()


@router.put("/{preference_id}", response_model=schemas.PreferenceOut)
def update_preference(
    spot_id: int,
    preference_id: int,
    updated: schemas.PreferenceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    get_owned_spot(spot_id, db, current_user)

    pref = (
        db.query(models.Preference)
        .filter(models.Preference.id == preference_id, models.Preference.spot_id == spot_id)
        .first()
    )
    if not pref:
        raise HTTPException(status_code=404, detail="Preference not found")

    for field, value in updated.model_dump().items():
        setattr(pref, field, value)
    db.commit()
    db.refresh(pref)
    return pref


@router.delete("/{preference_id}")
def delete_preference(
    spot_id: int,
    preference_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    get_owned_spot(spot_id, db, current_user)

    pref = (
        db.query(models.Preference)
        .filter(models.Preference.id == preference_id, models.Preference.spot_id == spot_id)
        .first()
    )
    if not pref:
        raise HTTPException(status_code=404, detail="Preference not found")

    db.delete(pref)
    db.commit()
    return {"detail": "Preference deleted"}