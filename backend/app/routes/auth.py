"""PlantCare AI — Authentication routes."""
from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Response, Request
from jose import JWTError, jwt
import bcrypt

from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_db
from app.schemas import RegisterRequest, LoginRequest, UserResponse, TokenData

router = APIRouter(prefix="/api/auth", tags=["auth"])

def _hash_password(password: str) -> str:
    # Truncate to 72 bytes if needed (bcrypt limitation)
    pwd_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode("utf-8")

def _verify_password(password: str, password_hash: str) -> bool:
    try:
        pwd_bytes = password.encode("utf-8")[:72]
        return bcrypt.checkpw(pwd_bytes, password_hash.encode("utf-8"))
    except Exception:
        return False

COOKIE_NAME = "plantcare_token"
EMAIL_RE = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


def _create_token(user_id: int, username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "username": username, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(request: Request) -> TokenData:
    """Extract and validate the auth token from cookies."""
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub", 0))
        username = payload.get("username", "")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return TokenData(user_id=user_id, username=username)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_optional_user(request: Request) -> TokenData | None:
    """Return user data if logged in, else None."""
    try:
        return get_current_user(request)
    except HTTPException:
        return None


@router.post("/register")
async def register(data: RegisterRequest, response: Response):
    """Register a new user account."""
    # Validate email format
    if not EMAIL_RE.match(data.email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Validate username
    if not re.match(r"^[a-zA-Z0-9_]+$", data.username):
        raise HTTPException(
            status_code=400,
            detail="Username may only contain letters, digits, and underscores"
        )

    password_hash = _hash_password(data.password)

    with get_db() as db:
        # Check for existing username or email
        existing = db.execute(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            (data.username, data.email),
        ).fetchone()
        if existing:
            raise HTTPException(
                status_code=409, detail="Username or email already registered"
            )
        cursor = db.execute(
            "INSERT INTO users (username, email, password_hash, full_name) VALUES (?, ?, ?, ?)",
            (data.username, data.email, password_hash, data.full_name),
        )
        user_id = cursor.lastrowid

    token = _create_token(user_id, data.username)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        secure=False,  # Set True in production with HTTPS
    )
    return {
        "message": "Registration successful",
        "user": {"id": user_id, "username": data.username, "email": data.email, "full_name": data.full_name},
    }


@router.post("/login")
async def login(data: LoginRequest, response: Response):
    """Log in with username and password."""
    with get_db() as db:
        row = db.execute(
            "SELECT id, username, email, full_name, password_hash FROM users WHERE username = ?",
            (data.username,),
        ).fetchone()

    if not row or not _verify_password(data.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = _create_token(row["id"], row["username"])
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        secure=False,
    )
    return {
        "message": "Login successful",
        "user": {
            "id": row["id"],
            "username": row["username"],
            "email": row["email"],
            "full_name": row["full_name"],
        },
    }


@router.post("/logout")
async def logout(response: Response):
    """Clear the auth cookie."""
    response.delete_cookie(key=COOKIE_NAME)
    return {"message": "Logged out successfully"}


@router.get("/me")
async def me(request: Request):
    """Return the current user's profile."""
    user = get_current_user(request)
    with get_db() as db:
        row = db.execute(
            "SELECT id, username, email, full_name FROM users WHERE id = ?",
            (user.user_id,),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user": {
            "id": row["id"],
            "username": row["username"],
            "email": row["email"],
            "full_name": row["full_name"],
        }
    }
