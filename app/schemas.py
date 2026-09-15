from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class SpinRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr


class SpinResponse(BaseModel):
    reels: list[str]
    is_winner: bool
    prize_type: str | None
    outcome: str
    message: str
    is_test: bool = False


class SpinRecord(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    reels: list[str]
    is_winner: bool
    prize_type: str | None
    outcome: str
    created_at: datetime

    model_config = {"from_attributes": True}
