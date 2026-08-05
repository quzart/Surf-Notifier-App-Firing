import httpx

MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"
WEATHER_URL = "https://api.open-meteo.com/v1/forecast"


async def get_marine_conditions(latitude: float, longitude: float):
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "wave_height,wave_period,wave_direction",
        "timezone": "auto",
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(MARINE_URL, params=params)
        response.raise_for_status()
        return response.json()


async def get_wind_conditions(latitude: float, longitude: float):
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "wind_speed_10m,wind_direction_10m",
        "timezone": "auto",
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(WEATHER_URL, params=params)
        response.raise_for_status()
        return response.json()


def get_current_hour_value(hourly_data: dict, field: str):
    from datetime import datetime

    times = hourly_data["hourly"]["time"]
    values = hourly_data["hourly"][field]

    now = datetime.now().strftime("%Y-%m-%dT%H:00")
    if now in times:
        index = times.index(now)
        return values[index]

    return values[0]