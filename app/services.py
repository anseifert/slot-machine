from sqlalchemy import func, select, text
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


def is_test_spin_email(email: str) -> bool:
    settings = get_settings()
    allowed = {entry.strip().lower() for entry in settings.test_spin_emails.split(",") if entry.strip()}
    return email.lower() in allowed


def count_prize_wins(db: Session, prize_type: str) -> int:
    return db.scalar(
        select(func.count())
        .select_from(Spin)
        .where(
            Spin.is_winner.is_(True),
            Spin.prize_type == prize_type,
            Spin.is_test.is_(False),
        )
    ) or 0


def perform_spin(db: Session, payload: SpinRequest) -> SpinResponse:
    settings = get_settings()
    email = payload.email.lower()
    is_test = is_test_spin_email(email)

    if not is_test:
        existing = db.scalar(
            select(Spin).where(Spin.email == email, Spin.is_test.is_(False))
        )
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

    if is_winner and prize_type and not is_test:
        current_wins = count_prize_wins(db, prize_type)
        max_wins = settings.golf_ball_max if prize_type == "golf_ball" else settings.hat_max
        if current_wins >= max_wins:
            is_winner = False
            prize_type = None
            outcome = Outcome.GOLF_TEASE if outcome == Outcome.GOLF_WIN else Outcome.HAT_TEASE

    message = outcome_message(outcome)
    if is_test and is_winner:
        message = f"{message} (Test spin — prize not counted.)"

    spin = Spin(
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        email=email,
        reels=reels,
        is_test=is_test,
        is_winner=is_winner,
        prize_type=prize_type if is_winner else None,
        outcome=outcome.value,
    )

    db.add(spin)
    db.commit()

    return SpinResponse(
        reels=reels,
        is_winner=is_winner,
        prize_type=prize_type if is_winner else None,
        outcome=outcome.value,
        message=message,
        is_test=is_test,
    )
