from pydantic import BaseModel
from typing import Optional


class PreferenceBase(BaseModel):
    period_min: Optional[float] = None
    period_max: Optional[float] = None
    wind_speed_max: Optional[float] = None
    wind_direction_min: Optional[float] = None
    wind_direction_max: Optional[float] = None
    tide_stage: Optional[str] = None


class PreferenceCreate(PreferenceBase):
    pass


class PreferenceOut(PreferenceBase):
    id: int
    spot_id: int

    class Config:
        from_attributes = True


class SpotBase(BaseModel):
    name: str
    latitude: float
    longitude: float
    facing_direction: Optional[float] = None


class SpotCreate(SpotBase):
    pass


class SpotOut(SpotBase):
    id: int
    marine_grid_lat: Optional[float] = None
    marine_grid_lon: Optional[float] = None
    tide_station_id: Optional[str] = None
    preferences: list[PreferenceOut] = []

    class Config:
        from_attributes = True