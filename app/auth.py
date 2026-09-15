from fastapi import HTTPException, Request, status
from itsdangerous import BadSignature, URLSafeSerializer

from app.config import get_settings

SESSION_COOKIE = "rh_casino_session"


def _serializer() -> URLSafeSerializer:
    return URLSafeSerializer(get_settings().admin_session_secret, salt="admin-session")


def create_session_token(username: str) -> str:
    return _serializer().dumps({"username": username})


def read_session_token(token: str) -> str | None:
    try:
        data = _serializer().loads(token)
        return data.get("username")
    except BadSignature:
        return None


def verify_credentials(username: str, password: str) -> bool:
    settings = get_settings()
    return username == settings.admin_username and password == settings.admin_password


def require_admin(request: Request) -> str:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_303_SEE_OTHER,
            headers={"Location": "/admin/login"},
        )
    username = read_session_token(token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_303_SEE_OTHER,
            headers={"Location": "/admin/login"},
        )
    return username
