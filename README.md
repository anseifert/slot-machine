# Red Hat Casino

A five-reel slot machine for events. Players submit their name and email, spin once, and have a chance to win a golf ball or hat prize. An admin dashboard tracks spins and remaining prize inventory.

## Features

- Classic 5-reel slot machine UI styled with the Red Hat color palette
- Prize odds: 30/700 per spin for golf ball, 30/700 for hat
- Hard caps: 30 golf ball winners and 30 hat winners
- One spin per email address
- PostgreSQL logging for every spin
- Read-only admin stats page with simple login

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
- Admin stats: [http://localhost:5555/admin/stats](http://localhost:5555/admin/stats)

Default admin credentials come from `.env` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`).

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
