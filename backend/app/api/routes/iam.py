from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import get_current_user, get_current_admin, CurrentUser
from app.schemas.iam import (
    UserProfileBase,
    UserProfileUpdateRequest,
    ChangePasswordRequest,
    UserSessionResponse,
    RolePermissionMatrixResponse,
    AuditLogItem,
    AssignRoleRequest,
    AddDepartmentRequest
)
from app.services.iam_service import iam_service

router = APIRouter(prefix="/iam", tags=["Identity & Access Management (IAM), Profiles & RBAC"])


@router.get("/profile", response_model=UserProfileBase, status_code=status.HTTP_200_OK)
def get_personal_profile(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Retrieves full institutional profile for the authenticated user."""
    return iam_service.get_profile(
        db=db,
        user_id=user.id,
        email=user.email,
        name=user.full_name or "Prathamesh Kulkarni"
    )


@router.put("/profile", response_model=UserProfileBase, status_code=status.HTTP_200_OK)
def update_personal_profile(
    payload: UserProfileUpdateRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Updates editable personal profile fields (Name, Phone, Designation, Avatar)."""
    return iam_service.update_profile(
        db=db,
        user_id=user.id,
        payload=payload
    )


@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Changes account password and records audit event."""
    res = iam_service.change_password(
        db=db,
        user_id=user.id,
        old_pass=payload.current_password,
        new_pass=payload.new_password
    )
    if not res.get("success"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=res.get("message"))
    return res


@router.get("/sessions", response_model=List[UserSessionResponse], status_code=status.HTTP_200_OK)
def get_active_sessions(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Lists all active devices and browser sessions for the authenticated user."""
    return iam_service.get_sessions(db=db, user_id=user.id)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_200_OK)
def revoke_session(
    session_id: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Revokes an active device session."""
    res = iam_service.revoke_session(db=db, user_id=user.id, session_id=session_id)
    if not res.get("success"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=res.get("message"))
    return res


@router.get("/roles/matrix", response_model=RolePermissionMatrixResponse, status_code=status.HTTP_200_OK)
def get_role_permission_matrix(
    user: CurrentUser = Depends(get_current_user)
):
    """Returns the 7-role institutional RBAC permission matrix."""
    return iam_service.get_role_matrix()


@router.post("/roles/assign", status_code=status.HTTP_200_OK)
def assign_role(
    payload: AssignRoleRequest,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin)
):
    """Administrator-only: Assigns an institutional role with privilege self-elevation guardrails."""
    res = iam_service.assign_user_role(
        db=db,
        admin_id=admin.id,
        admin_role=admin.role,
        payload=payload
    )
    if not res.get("success"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=res.get("message"))
    return res


@router.get("/audit-logs", response_model=List[AuditLogItem], status_code=status.HTTP_200_OK)
def get_audit_logs(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Retrieves immutable IAM and administrative audit logs."""
    return iam_service.get_audit_logs(db=db)


@router.post("/departments", status_code=status.HTTP_201_CREATED)
def create_department(
    payload: AddDepartmentRequest,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin)
):
    """Administrator-only: Adds a new department to the institutional hierarchy."""
    return iam_service.add_department(db=db, admin_id=admin.id, payload=payload)

