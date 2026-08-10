from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)

    spots = relationship("Spot", back_populates="owner", cascade="all, delete-orphan")


class Spot(Base):
    __tablename__ = "spots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    facing_direction = Column(Float, nullable=True)

    marine_grid_lat = Column(Float, nullable=True)
    marine_grid_lon = Column(Float, nullable=True)
    tide_station_id = Column(String, nullable=True)

    owner = relationship("User", back_populates="spots")
    preferences = relationship(
        "Preference", back_populates="spot", cascade="all, delete-orphan"
    )


class Preference(Base):
    __tablename__ = "preferences"

    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id"), nullable=False)

    period_min = Column(Float, nullable=True)
    period_max = Column(Float, nullable=True)

    wind_speed_max = Column(Float, nullable=True)
    wind_direction_min = Column(Float, nullable=True)
    wind_direction_max = Column(Float, nullable=True)

    tide_stage = Column(String, nullable=True)

    spot = relationship("Spot", back_populates="preferences")
    notification_logs = relationship(
        "NotificationLog", back_populates="preference", cascade="all, delete-orphan"
    )


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)
    preference_id = Column(Integer, ForeignKey("preferences.id"), nullable=False)
    notified_at = Column(DateTime(timezone=True), server_default=func.now())

    preference = relationship("Preference", back_populates="notification_logs")