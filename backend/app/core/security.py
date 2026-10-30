from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status
import jwt
from app.core.config import settings


class CurrentUser:
    def __init__(self, id: str, email: str, role: str = "student", full_name: str = ""):
        self.id = id
        self.email = email
        self.role = role
        self.full_name = full_name


def get_current_user(authorization: Optional[str] = Header(None)) -> CurrentUser:
    if not authorization:
        return CurrentUser(
            id="00000000-0000-0000-0000-000000000001",
            email="student@campus.edu",
            role="student",
            full_name="Campus Student"
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected 'Bearer <token>'"
        )

    token = parts[1]

    if settings.SUPABASE_JWT_SECRET:
        try:
            payload: Dict[str, Any] = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated"
            )
            user_id = payload.get("sub", "")
            email = payload.get("email", "")
            user_metadata = payload.get("user_metadata", {})
            role = user_metadata.get("role", "student")
            full_name = user_metadata.get("full_name", "")
            return CurrentUser(id=user_id, email=email, role=role, full_name=full_name)
        except jwt.PyJWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication token: {str(e)}"
            )

    try:
        unverified: Dict[str, Any] = jwt.decode(token, options={"verify_signature": False})
        user_id = unverified.get("sub", "00000000-0000-0000-0000-000000000001")
        email = unverified.get("email", "student@campus.edu")
        user_metadata = unverified.get("user_metadata", {})
        role = user_metadata.get("role", "student")
        full_name = user_metadata.get("full_name", "")
        return CurrentUser(id=user_id, email=email, role=role, full_name=full_name)
    except Exception:
        return CurrentUser(
            id="00000000-0000-0000-0000-000000000001",
            email="student@campus.edu",
            role="student",
            full_name="Campus Student"
        )


def get_current_admin(authorization: Optional[str] = Header(None)) -> CurrentUser:
    user = get_current_user(authorization)
    if settings.ENVIRONMENT == "production" and user.role not in ("security_admin", "staff"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to modify incident triage state"
        )
    return user
