from fastapi import APIRouter, HTTPException
from utils.auth import LoginRequest, LoginResponse, validate_credentials, generate_token

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest):
    if validate_credentials(data.username, data.password):
        token = generate_token()  # generate a unique token for this session
        return LoginResponse(success=True, token=token, message="Login successful")
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")
