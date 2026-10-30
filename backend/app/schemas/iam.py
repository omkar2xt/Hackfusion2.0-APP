from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime


class UserProfileBase(BaseModel):
    user_id: str
    full_name: str
    email: str
    phone_number: Optional[str] = "+91 98450 12345"
    employee_or_student_id: Optional[str] = "VDIT-CS-2024-042"
    designation: Optional[str] = "Cybersecurity Lead Analyst"
    institution_name: Optional[str] = "Karnatak Law Society (KLS)"
    campus_name: Optional[str] = "Vishwanathrao Deshpande Institute of Technology (KLS VDIT)"
    department_name: Optional[str] = "Computer Science & Engineering"
    role: str = "Security Analyst"
    account_status: str = "ACTIVE"
    avatar_url: Optional[str] = ""
    mfa_enabled: bool = True
    last_login_at: Optional[str] = None
    failed_login_count: int = 0


class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    designation: Optional[str] = None
    avatar_url: Optional[str] = None
    # Email and institutional identity cannot be arbitrarily changed without admin approval


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UserSessionResponse(BaseModel):
    id: str
    user_id: str
    device_name: str
    device_platform: str
    ip_address: str
    location_city: str
    user_agent: Optional[str] = None
    is_active: bool
    last_active_at: str
    created_at: str


class RolePermissions(BaseModel):
    role_name: str
    description: str
    permissions: List[str]
    user_count: int = 0


class RolePermissionMatrixResponse(BaseModel):
    roles: List[RolePermissions]
    all_available_permissions: List[str]


class AuditLogItem(BaseModel):
    id: str
    actor_name: str
    actor_role: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Dict[str, Any] = {}
    timestamp: str


class AddDepartmentRequest(BaseModel):
    campus_id: str = "camp-vdit-01"
    name: str
    code: str
    head_of_department: str


class AddCampusRequest(BaseModel):
    institution_id: str = "inst-kls-01"
    name: str
    code: str
    location: str


class AssignRoleRequest(BaseModel):
    target_user_id: str
    target_user_email: str
    new_role: str  # Student, Faculty, Department Coordinator, Campus Security Officer, Security Analyst, Institution Administrator, Super Administrator
    reason: Optional[str] = "Departmental IAM assignment"

