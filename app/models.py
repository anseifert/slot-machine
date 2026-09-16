from datetime import datetime
from typing import List

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Spin(Base):
    __tablename__ = "spins"

    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), index=True)
    reels: Mapped[List[str]] = mapped_column(JSONB)
    is_test: Mapped[bool] = mapped_column(Boolean, default=False)
    is_winner: Mapped[bool] = mapped_column(Boolean, default=False)
    prize_type: Mapped[str] = mapped_column(String(32), nullable=True)
    outcome: Mapped[str] = mapped_column(String(32))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CasinoSettings(Base):
    __tablename__ = "casino_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    golf_ball_odds: Mapped[int] = mapped_column(Integer, default=30)
    hat_odds: Mapped[int] = mapped_column(Integer, default=30)
    total_odds_weight: Mapped[int] = mapped_column(Integer, default=700)
    updated_by: Mapped[str] = mapped_column(String(100), default="system")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
