# Surf Notifier App (Firing)

A personal surf conditions app: add your favorite surf spots, set the wave, wind, and tide conditions you actually want, and get notified on your phone when a spot is worth checking. Powered entirely by free public data sources.

## Why this exists

Commercial surf forecast apps are either paid or don't cover lesser known/secret spots well. This project uses free public ocean data (Open-Meteo, NOAA) combined with a strict, spot specific matching system including offshore/onshore wind calculated relative to each spot's actual coastline orientation to tell you when your spot is worth the drive.

## Features

- **Add any spot, anywhere** — search by place name or click directly on a map, no coordinates required
- **Offshore-aware wind matching** — point from your spot toward the ocean on the map once, and every wind preference is automatically evaluated as offshore / cross-shore / onshore for that specific spot's coastline
- **Plain-language conditions** — wave height shown in feet with a surf-size label ("waist high," "head high"), wind classified by type, not just raw numbers
- **Strict matching** — a spot only counts as a match when every condition you set is met
- **Free data, hybrid tide sourcing** — wave and wind from Open-Meteo; tide from the nearest NOAA station when one's close enough, falling back to Open-Meteo's tide model for remote spots NOAA doesn't cover
- **Push notifications, no paid service** — installable as a Progressive Web App with native Web Push, works on iPhone (16.4+) with zero subscription cost
- **Multi-user** — each account has its own spots, preferences, and notifications
- **Dark mode**

## Tech stack

**Backend:** FastAPI, SQLAlchemy, SQLite, Alembic (migrations), APScheduler (background polling), JWT auth (python-jose + passlib/bcrypt), pywebpush (Web Push notifications)

**Frontend:** React + Vite, Leaflet (maps), plain CSS (no framework)

**Data sources:** Open-Meteo (marine, weather, geocoding — all free, no API key), NOAA CO-OPS (tide predictions)

## Project structure

surf-notifier/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt
│   ├── alembic/                 # database migrations
│   ├── app/
│   │   ├── database.py          # SQLAlchemy engine/session
│   │   ├── models.py            # User, Spot, Preference, PushSubscription, NotificationLog
│   │   ├── schemas.py           # Pydantic request/response shapes
│   │   ├── auth.py              # password hashing, JWT creation/verification
│   │   ├── routes/
│   │   │   ├── auth.py          # register / login
│   │   │   ├── spots.py         # spot CRUD + live conditions check
│   │   │   ├── preferences.py   # preference CRUD (one per spot)
│   │   │   └── push.py          # push subscription management
│   │   └── services/
│   │       ├── conditions.py    # Open-Meteo wave/wind fetching
│   │       ├── tide.py          # NOAA + Open-Meteo hybrid tide resolution
│   │       ├── matching.py      # strict-AND preference matching
│   │       ├── descriptions.py  # plain-language condition labels
│   │       ├── evaluation.py    # ties conditions + matching together
│   │       ├── notifier.py      # Web Push delivery
│   │       └── scheduler.py     # hourly polling + cooldown-aware notifications
│   └── private_key.pem          # VAPID private key (not committed)
└── frontend/
    ├── public/
    │   └── service-worker.js    # handles incoming push events
    └── src/
        ├── api.js               # all backend HTTP calls
        ├── push.js              # browser Push API integration
        ├── App.jsx
        └── components/
            ├── AuthForm.jsx
            ├── SpotForm.jsx      # search + map-based spot creation
            ├── SpotList.jsx
            ├── PreferenceForm.jsx
            ├── ConditionsCheck.jsx
            └── PushSettings.jsx

## Setup

### Backend

cd backend
python -m venv venv
source venv/bin/activate   # venv\Scripts\Activate.ps1 on Windows
pip install -r requirements.txt

Generate your VAPID keys (for Web Push):

vapid --gen

This creates `private_key.pem` and `public_key.pem` — keep both out of version control.

Create `.env` in `backend/`:

JWT_SECRET_KEY=your_generated_secret
PUSHOVER_API_TOKEN=            # optional, only if using Pushover alongside Web Push
PUSHOVER_USER_KEY=

Generate a secret key:

python -c "import secrets; print(secrets.token_hex(32))"

Apply database migrations:

alembic upgrade head

Run the server:

uvicorn main:app --reload

API docs available at `http://127.0.0.1:8000/docs`.

### Frontend

cd frontend
npm install

Create `.env` in `frontend/` with your VAPID **public** key (printed when you extract it — see below):

VITE_VAPID_PUBLIC_KEY=your_public_key_here

Run:

npm run dev

Visit `http://localhost:5173`.

## Database migrations

Schema changes are managed with Alembic — no manual database resets needed:

alembic revision --autogenerate -m "describe your change"
alembic upgrade head

## Notifications on iPhone

Web Push on iOS requires the site to be added to your home screen first:
1. Open the app in Safari
2. Share → Add to Home Screen
3. Open it from the home screen icon (not Safari directly)
4. Tap "Enable Notifications" inside the app

## Known limitations

- Wave height/period come from a global open-ocean model, not a spot-tuned forecast — treat wave height as directional rather than precise; wave period and wind are the more reliable signals
- Tide accuracy depends on proximity to a NOAA station; remote spots fall back to a lower-precision model
- No email verification or password reset flow yet

## Roadmap

- Pre-fill the preference form with existing values when editing
- Personal calibration — compare app output against real sessions to refine thresholds per spot
- Deployment (currently local-only)

## License

Personal project — not currently licensed for reuse.
