import os
import httpx
from dotenv import load_dotenv

load_dotenv()

PUSHOVER_API_TOKEN = os.getenv("PUSHOVER_API_TOKEN")
PUSHOVER_USER_KEY = os.getenv("PUSHOVER_USER_KEY")

PUSHOVER_URL = "https://api.pushover.net/1/messages.json"


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


async def notify(message: str, title: str = "Surf Notifier"):
    try:
        result = await send_pushover(message, title)
        return {"pushover": result}
    except Exception as e:
        return {"pushover_error": str(e)}