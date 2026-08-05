import httpx
from math import radians, sin, cos, sqrt, atan2
from datetime import datetime, timedelta

NOAA_STATIONS_URL = "https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions"
NOAA_TIDE_URL = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter"
MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"

MAX_STATION_DISTANCE_MILES = 10


def haversine_miles(lat1, lon1, lat2, lon2):
    R = 3958.8  # Earth radius in miles
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


async def find_nearest_noaa_station(latitude: float, longitude: float):
    async with httpx.AsyncClient() as client:
        response = await client.get(NOAA_STATIONS_URL)
        response.raise_for_status()
        stations = response.json()["stations"]

    nearest = None
    nearest_distance = None

    for station in stations:
        distance = haversine_miles(latitude, longitude, station["lat"], station["lng"])
        if nearest_distance is None or distance < nearest_distance:
            nearest = station
            nearest_distance = distance

    if nearest_distance is not None and nearest_distance <= MAX_STATION_DISTANCE_MILES:
        return {"station_id": nearest["id"], "distance_miles": nearest_distance}

    return None


async def get_noaa_tide_predictions(station_id: str):
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y%m%d")
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y%m%d")

    params = {
        "product": "predictions",
        "application": "surf_notifier",
        "begin_date": yesterday,
        "end_date": tomorrow,
        "datum": "MLLW",
        "station": station_id,
        "time_zone": "lst_ldt",
        "units": "english",
        "interval": "hilo",
        "format": "json",
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(NOAA_TIDE_URL, params=params)
        response.raise_for_status()
        data = response.json()

    return [
        {
            "time": datetime.strptime(p["t"], "%Y-%m-%d %H:%M"),
            "height": float(p["v"]),
            "type": "high" if p["type"] == "H" else "low",
        }
        for p in data.get("predictions", [])
    ]


def determine_stage_from_hilo(events: list, now: datetime = None):
    now = now or datetime.now()

    upcoming = [e for e in events if e["time"] >= now]
    past = [e for e in events if e["time"] < now]

    if not upcoming or not past:
        return None

    last_event = past[-1]
    next_event = upcoming[0]

    if abs((now - last_event["time"]).total_seconds()) < 900:
        return last_event["type"]

    return "rising" if last_event["type"] == "low" else "falling"


async def get_openmeteo_tide(latitude: float, longitude: float):
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "sea_level_height_msl",
        "timezone": "auto",
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(MARINE_URL, params=params)
        response.raise_for_status()
        data = response.json()

    times = data["hourly"]["time"]
    heights = data["hourly"]["sea_level_height_msl"]

    now_str = datetime.now().strftime("%Y-%m-%dT%H:00")
    index = times.index(now_str) if now_str in times else 0

    current_height = heights[index]
    previous_height = heights[max(index - 1, 0)]

    stage = "rising" if current_height > previous_height else "falling"
    return {"height": current_height, "stage": stage}


async def get_tide_conditions(latitude: float, longitude: float):
    station = await find_nearest_noaa_station(latitude, longitude)

    if station:
        events = await get_noaa_tide_predictions(station["station_id"])
        stage = determine_stage_from_hilo(events)
        return {
            "source": "noaa",
            "station_id": station["station_id"],
            "distance_miles": round(station["distance_miles"], 1),
            "stage": stage,
        }

    fallback = await get_openmeteo_tide(latitude, longitude)
    return {
        "source": "open-meteo",
        "station_id": None,
        "distance_miles": None,
        "stage": fallback["stage"],
        "height": fallback["height"],
    }