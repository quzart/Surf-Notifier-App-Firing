import asyncio

from app.services.conditions import get_marine_conditions, get_wind_conditions, get_current_hour_value
from app.services.tide import get_tide_conditions
from app.services.matching import check_match


async def evaluate_spot(spot, db_preferences):
    marine, wind, tide = await asyncio.gather(
        get_marine_conditions(spot.latitude, spot.longitude),
        get_wind_conditions(spot.latitude, spot.longitude),
        get_tide_conditions(spot.latitude, spot.longitude),
    )

    conditions = {
        "wave_period": get_current_hour_value(marine, "wave_period"),
        "wind_speed": get_current_hour_value(wind, "wind_speed_10m"),
        "wind_direction": get_current_hour_value(wind, "wind_direction_10m"),
        "tide_stage": tide["stage"],
    }

    results = []
    for preference in db_preferences:
        result = check_match(preference, conditions)
        results.append({"preference_id": preference.id, **result})

    return {
        "conditions": conditions,
        "tide_source": tide["source"],
        "results": results,
    }