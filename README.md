# Red Hat Casino

A five-reel slot machine for events. Players submit their name and email, spin, and have a chance to win a golf ball or hat prize. An admin dashboard tracks spins, remaining prize inventory, and live odds.

## Features

- Vegas-style 5-reel slot machine UI with Red Hat branding
- Default prize odds: 30/700 per spin for golf ball, 30/700 for hat (editable in admin)
- Hard caps: 30 golf ball winners and 30 hat winners
- One live spin per email per period (resets at 12:00 AM and 12:00 PM daily)
- All spin history and captured emails are retained — only the per-period limit resets
- PostgreSQL logging for every spin
- Admin dashboard with login, odds editor, spin stats, and recent spin log
- Test spin emails (unlimited spins; wins not counted toward inventory)
- Mobile-friendly layout tuned for iPhone 15 Pro and similar devices

## Quick start

1. Copy the environment file and set credentials:

```bash
cp .env.example .env
```

2. Start the stack:

```bash
docker compose up --build
```

3. Open the casino:

- App: [http://localhost:5555](http://localhost:5555)
- Admin: [http://localhost:5555/admin/stats](http://localhost:5555/admin/stats)

Default admin credentials come from `.env` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`).

## Configuration

| Variable | Description |
| --- | --- |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin login credentials |
| `ADMIN_SESSION_SECRET` | Session signing secret |
| `TEST_SPIN_EMAILS` | Comma-separated emails with unlimited test spins |
| `TIMEZONE` | Timezone for twice-daily spin resets (default: `America/Chicago`) |
| `GOLF_BALL_MAX` / `HAT_MAX` | Prize inventory caps (env defaults) |
| `GOLF_BALL_ODDS` / `HAT_ODDS` / `TOTAL_ODDS_WEIGHT` | Initial odds seed (overridden by admin after first save) |

Spin odds are stored in the `casino_settings` table and can be changed live from the admin dashboard without redeploying.

## Player rules

- Enter first name, last name, and email, then pull to spin.
- Each email gets one live spin per 12-hour window (midnight and noon in `TIMEZONE`).
- If a player is out of spins for the current period, they see: **"Oh no! Your out of spins!"**
- Test emails can spin unlimited times; wins are not counted toward prize inventory.

## Admin

Sign in at `/admin/login` to access:

- **Spin odds** — adjust golf ball odds, hat odds, and total weight
- **Spin period reset** — view current period start and next reset time
- **Stats** — total spins, winners, prize inventory remaining
- **Recent spins** — last 50 spins with test/live flag

## Local development

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start Postgres separately, then:
export POSTGRES_HOST=localhost
uvicorn app.main:app --reload --port 5555
```

## API

`POST /api/spin`

```json
{
  "first_name": "Pat",
  "last_name": "Player",
  "email": "pat@example.com"
}
```

Returns reel symbols, win status, and a player-facing message.

## Stack

- Python / FastAPI
- Jinja2 templates
- PostgreSQL
- Docker Compose (port **5555**)
