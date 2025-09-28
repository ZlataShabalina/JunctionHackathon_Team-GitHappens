import os
from dotenv import load_dotenv
from pydantic import BaseModel
import secrets

load_dotenv()

# Load supervisor credentials from .env
SUPERVISOR_USERNAME = os.getenv("SUPERVISOR_USERNAME")
SUPERVISOR_PASSWORD = os.getenv("SUPERVISOR_PASSWORD")

# ---------- Request / Response Models ----------
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    token: str | None = None
    message: str

# ---------- Auth Helpers ----------
# In-memory store for issued tokens (optional)
active_tokens = set()

def generate_token() -> str:
    """
    Generate a new random token for the session.
    """
    token = secrets.token_urlsafe(16)
    active_tokens.add(token)
    return token

def verify_token(token: str) -> bool:
    """
    Simple token check. Replace with JWT in production.
    """
    return token in active_tokens

def validate_credentials(username: str, password: str) -> bool:
    """
    Check if provided credentials match supervisor's.
    """
    return username == SUPERVISOR_USERNAME and password == SUPERVISOR_PASSWORD
