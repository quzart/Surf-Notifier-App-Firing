from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.evaluation import evaluate_spot

router = APIRouter(prefix="/spots", tags=["spots"])


@router.post("/", response_model=schemas.SpotOut)
def create_spot(
    spot: schemas.SpotCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_spot = models.Spot(**spot.model_dump(), user_id=current_user.id)
    db.add(db_spot)
    db.commit()
    db.refresh(db_spot)
    return db_spot


@router.get("/", response_model=list[schemas.SpotOut])
def list_spots(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Spot).filter(models.Spot.user_id == current_user.id).all()


@router.get("/{spot_id}", response_model=schemas.SpotOut)
def get_spot(
    spot_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    spot = (
        db.query(models.Spot)
        .filter(models.Spot.id == spot_id, models.Spot.user_id == current_user.id)
        .first()
    )
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    return spot


@router.put("/{spot_id}", response_model=schemas.SpotOut)
def update_spot(
    spot_id: int,
    updated: schemas.SpotCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    spot = (
        db.query(models.Spot)
        .filter(models.Spot.id == spot_id, models.Spot.user_id == current_user.id)
        .first()
    )
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    for field, value in updated.model_dump().items():
        setattr(spot, field, value)
    db.commit()
    db.refresh(spot)
    return spot


@router.delete("/{spot_id}")
def delete_spot(
    spot_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    spot = (
        db.query(models.Spot)
        .filter(models.Spot.id == spot_id, models.Spot.user_id == current_user.id)
        .first()
    )
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    db.delete(spot)
    db.commit()
    return {"detail": "Spot deleted"}


@router.get("/{spot_id}/check")
async def check_spot(
    spot_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    spot = (
        db.query(models.Spot)
        .filter(models.Spot.id == spot_id, models.Spot.user_id == current_user.id)
        .first()
    )
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    preferences = db.query(models.Preference).filter(models.Preference.spot_id == spot_id).all()
    return await evaluate_spot(spot, preferences)