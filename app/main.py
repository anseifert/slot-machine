from pathlib import Path

from fastapi import Depends, FastAPI, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import SESSION_COOKIE, create_session_token, require_admin, verify_credentials
from app.config import get_settings
from app.database import get_db, init_db, migrate_db
from app.game import FILLER_SYMBOLS, PRIZE_SYMBOLS
from app.models import Spin
from app.schemas import SpinRequest
from app.services import SpinError, count_prize_wins, perform_spin

BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

app = FastAPI(title="Red Hat Casino")
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    migrate_db()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/", response_class=HTMLResponse)
def index(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "symbols": PRIZE_SYMBOLS + FILLER_SYMBOLS,
        },
    )


@app.post("/api/spin")
def api_spin(payload: SpinRequest, db: Session = Depends(get_db)) -> dict:
    try:
        result = perform_spin(db, payload)
    except SpinError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return result.model_dump()


@app.get("/admin/login", response_class=HTMLResponse)
def admin_login_page(request: Request) -> HTMLResponse:
    return templates.TemplateResponse("admin/login.html", {"request": request, "error": None})


@app.post("/admin/login")
def admin_login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
) -> Response:
    if not verify_credentials(username, password):
        return templates.TemplateResponse(
            "admin/login.html",
            {"request": request, "error": "Invalid credentials"},
            status_code=401,
        )
    response = RedirectResponse(url="/admin/stats", status_code=303)
    response.set_cookie(SESSION_COOKIE, create_session_token(username), httponly=True, samesite="lax")
    return response


@app.get("/admin/logout")
def admin_logout() -> RedirectResponse:
    response = RedirectResponse(url="/", status_code=303)
    response.delete_cookie(SESSION_COOKIE)
    return response


@app.get("/admin/stats", response_class=HTMLResponse)
def admin_stats(
    request: Request,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
) -> HTMLResponse:
    settings = get_settings()
    total_spins = db.scalar(
        select(func.count()).select_from(Spin).where(Spin.is_test.is_(False))
    ) or 0
    total_winners = db.scalar(
        select(func.count()).select_from(Spin).where(Spin.is_winner.is_(True), Spin.is_test.is_(False))
    ) or 0
    golf_wins = count_prize_wins(db, "golf_ball")
    hat_wins = count_prize_wins(db, "hat")
    recent_spins = db.scalars(select(Spin).order_by(Spin.created_at.desc()).limit(50)).all()

    return templates.TemplateResponse(
        "admin/stats.html",
        {
            "request": request,
            "total_spins": total_spins,
            "total_winners": total_winners,
            "golf_wins": golf_wins,
            "golf_max": settings.golf_ball_max,
            "golf_remaining": settings.golf_ball_max - golf_wins,
            "hat_wins": hat_wins,
            "hat_max": settings.hat_max,
            "hat_remaining": settings.hat_max - hat_wins,
            "recent_spins": recent_spins,
        },
    )
