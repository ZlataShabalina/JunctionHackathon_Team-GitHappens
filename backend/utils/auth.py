import os
from fastapi import Request, HTTPException

def verify_token(request: Request) -> None:
    expected = os.getenv("WEBHOOK_TOKEN", "devtoken")
    got = request.headers.get("x-webhook-token", "")
    if got != expected:
        raise HTTPException(status_code=401, detail="Invalid token")
