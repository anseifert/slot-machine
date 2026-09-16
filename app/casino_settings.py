from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import CasinoSettings


@dataclass
class RuntimeOdds:
    golf_ball_odds: int
    hat_odds: int
    total_odds_weight: int


def _defaults_from_env() -> RuntimeOdds:
    settings = get_settings()
    return RuntimeOdds(
        golf_ball_odds=settings.golf_ball_odds,
        hat_odds=settings.hat_odds,
        total_odds_weight=settings.total_odds_weight,
    )


def ensure_casino_settings(db: Session) -> CasinoSettings:
    row = db.get(CasinoSettings, 1)
    if row:
        return row

    defaults = _defaults_from_env()
    row = CasinoSettings(
        id=1,
        golf_ball_odds=defaults.golf_ball_odds,
        hat_odds=defaults.hat_odds,
        total_odds_weight=defaults.total_odds_weight,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_runtime_odds(db: Session) -> RuntimeOdds:
    row = ensure_casino_settings(db)
    return RuntimeOdds(
        golf_ball_odds=row.golf_ball_odds,
        hat_odds=row.hat_odds,
        total_odds_weight=row.total_odds_weight,
    )


def update_runtime_odds(
    db: Session,
    golf_ball_odds: int,
    hat_odds: int,
    total_odds_weight: int,
    updated_by: str,
) -> RuntimeOdds:
    if golf_ball_odds < 0 or hat_odds < 0:
        raise ValueError("Odds must be zero or greater.")
    if total_odds_weight <= 0:
        raise ValueError("Total odds weight must be greater than zero.")
    if golf_ball_odds + hat_odds > total_odds_weight:
        raise ValueError("Golf ball and hat odds cannot exceed the total odds weight.")

    row = ensure_casino_settings(db)
    row.golf_ball_odds = golf_ball_odds
    row.hat_odds = hat_odds
    row.total_odds_weight = total_odds_weight
    row.updated_by = updated_by
    db.commit()
    db.refresh(row)
    return get_runtime_odds(db)


def seed_casino_settings_if_missing(db: Session) -> None:
    existing = db.scalar(select(CasinoSettings.id).where(CasinoSettings.id == 1))
    if existing:
        return
    ensure_casino_settings(db)
