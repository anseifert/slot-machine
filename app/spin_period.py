from datetime import datetime, timedelta
from zoneinfo import ZoneInfo


def get_timezone(tz_name: str) -> ZoneInfo:
    return ZoneInfo(tz_name)


def get_local_now(tz_name: str) -> datetime:
    return datetime.now(get_timezone(tz_name))


def get_current_period_start(now: datetime | None = None, tz_name: str = "America/Chicago") -> datetime:
    """Return UTC datetime for the start of the current twice-daily spin window."""
    tz = get_timezone(tz_name)
    local = (now or datetime.now(tz)).astimezone(tz)
    if local.hour < 12:
        period_start = local.replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        period_start = local.replace(hour=12, minute=0, second=0, microsecond=0)
    return period_start.astimezone(ZoneInfo("UTC"))


def get_next_period_reset(now: datetime | None = None, tz_name: str = "America/Chicago") -> datetime:
    """Return UTC datetime for the next 12:00 AM or 12:00 PM reset."""
    tz = get_timezone(tz_name)
    local = (now or datetime.now(tz)).astimezone(tz)
    if local.hour < 12:
        next_reset = local.replace(hour=12, minute=0, second=0, microsecond=0)
    else:
        next_reset = (local + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return next_reset.astimezone(ZoneInfo("UTC"))


def format_reset_time(dt: datetime, tz_name: str) -> str:
    return dt.astimezone(get_timezone(tz_name)).strftime("%I:%M %p %Z on %b %d, %Y")
