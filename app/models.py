from datetime import datetime
from typing import List

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Spin(Base):
    __tablename__ = "spins"

    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    reels: Mapped[List[str]] = mapped_column(JSONB)
    is_winner: Mapped[bool] = mapped_column(Boolean, default=False)
    prize_type: Mapped[str] = mapped_column(String(32), nullable=True)
    outcome: Mapped[str] = mapped_column(String(32))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
