import random
from enum import StrEnum

FILLER_SYMBOLS = ["rhel", "openshift", "ansible", "satellite", "insights", "aap"]
PRIZE_SYMBOLS = ["golf_ball", "hat"]


class Outcome(StrEnum):
    GOLF_WIN = "golf_win"
    HAT_WIN = "hat_win"
    GOLF_TEASE = "golf_tease"
    HAT_TEASE = "hat_tease"
    LOSS = "loss"


def roll_outcome(
    golf_remaining: int,
    hat_remaining: int,
    golf_odds: int = 30,
    hat_odds: int = 30,
    total_weight: int = 700,
) -> tuple[Outcome, list[str], bool, str | None]:
    roll = random.randint(0, total_weight - 1)

    if roll < golf_odds:
        reels = ["golf_ball"] * 5
        if golf_remaining > 0:
            return Outcome.GOLF_WIN, reels, True, "golf_ball"
        return Outcome.GOLF_TEASE, reels, False, None

    if roll < golf_odds + hat_odds:
        reels = ["hat"] * 5
        if hat_remaining > 0:
            return Outcome.HAT_WIN, reels, True, "hat"
        return Outcome.HAT_TEASE, reels, False, None

    return Outcome.LOSS, _random_loss_reels(), False, None


def _random_loss_reels() -> list[str]:
    reels = [random.choice(FILLER_SYMBOLS) for _ in range(5)]
    while len(set(reels)) == 1:
        reels = [random.choice(FILLER_SYMBOLS) for _ in range(5)]
    return reels


def outcome_message(outcome: Outcome) -> str:
    messages = {
        Outcome.GOLF_WIN: "Jackpot! You won the golf ball prize!",
        Outcome.HAT_WIN: "Jackpot! You won the hat prize!",
        Outcome.GOLF_TEASE: "So close! Golf balls are all gone — better luck next event!",
        Outcome.HAT_TEASE: "So close! Hats are all gone — better luck next event!",
        Outcome.LOSS: "No match this time. Thanks for playing!",
    }
    return messages[outcome]
