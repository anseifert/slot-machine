from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.game import Outcome, outcome_message, roll_outcome
from app.models import Spin
from app.schemas import SpinRequest, SpinResponse


class SpinError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def count_prize_wins(db: Session, prize_type: str) -> int:
    return db.scalar(
        select(func.count())
        .select_from(Spin)
        .where(Spin.is_winner.is_(True), Spin.prize_type == prize_type)
    ) or 0


def perform_spin(db: Session, payload: SpinRequest) -> SpinResponse:
    settings = get_settings()

    existing = db.scalar(select(Spin).where(Spin.email == payload.email.lower()))
    if existing:
        raise SpinError("This email address has already been used to spin.", status_code=409)

    db.execute(text("SELECT pg_advisory_xact_lock(424242)"))

    golf_remaining = settings.golf_ball_max - count_prize_wins(db, "golf_ball")
    hat_remaining = settings.hat_max - count_prize_wins(db, "hat")

    outcome, reels, is_winner, prize_type = roll_outcome(
        golf_remaining=golf_remaining,
        hat_remaining=hat_remaining,
        golf_odds=settings.golf_ball_odds,
        hat_odds=settings.hat_odds,
        total_weight=settings.total_odds_weight,
    )

    if is_winner and prize_type:
        current_wins = count_prize_wins(db, prize_type)
        max_wins = settings.golf_ball_max if prize_type == "golf_ball" else settings.hat_max
        if current_wins >= max_wins:
            is_winner = False
            prize_type = None
            outcome = Outcome.GOLF_TEASE if outcome == Outcome.GOLF_WIN else Outcome.HAT_TEASE

    spin = Spin(
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        email=payload.email.lower(),
        reels=reels,
        is_winner=is_winner,
        prize_type=prize_type if is_winner else None,
        outcome=outcome.value,
    )

    try:
        db.add(spin)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise SpinError("This email address has already been used to spin.", status_code=409) from None

    return SpinResponse(
        reels=reels,
        is_winner=is_winner,
        prize_type=prize_type if is_winner else None,
        outcome=outcome.value,
        message=outcome_message(outcome),
    )
