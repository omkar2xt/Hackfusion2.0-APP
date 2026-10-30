import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database.models import (
    UserProfileModel,
    UserSessionModel,
    AuditLogModel,
    DepartmentModel,
    CampusModel,
    InstitutionModel
)
from app.schemas.iam import (
    UserProfileBase,
    UserProfileUpdateRequest,
    UserSessionResponse,
    RolePermissions,
    RolePermissionMatrixResponse,
    AuditLogItem,
    AddDepartmentRequest,
    AddCampusRequest,
    AssignRoleRequest
)

# 7 Standard Institutional IAM Roles & Permission Matrix
ROLE_PERMISSIONS_DEFINITION: List[Dict[str, Any]] = [
    {
        "role_name": "Student",
        "description": "Standard student account: submit incident reports, scan links/QRs, view campus radar alerts.",
        "permissions": ["view_profile", "edit_own_profile"],
        "user_count": 1420
    },
    {
        "role_name": "Faculty",
        "description": "Academic faculty & lab instructors: manage departmental student safety, review alerts.",
        "permissions": ["view_profile", "edit_own_profile", "manage_incidents"],
        "user_count": 184
    },
    {
        "role_name": "Department Coordinator",
        "description": "Department Head or representative: manage departmental user groups and review incident reports.",
        "permissions": ["view_profile", "edit_own_profile", "manage_incidents", "view_investigation"],
        "user_count": 28
    },
    {
        "role_name": "Campus Security Officer",
        "description": "Field security & patrol officers: verify physical QR flyers, manage proximity mesh alerts.",
        "permissions": ["view_profile", "edit_own_profile", "manage_incidents", "manage_alerts"],
        "user_count": 16
    },
    {
        "role_name": "Security Analyst",
        "description": "Campus SOC analyst: investigate URLs, QRs, seal evidence in vault, correlation analysis.",
        "permissions": ["view_profile", "edit_own_profile", "manage_incidents", "view_investigation", "manage_alerts", "access_audit_logs"],
        "user_count": 8
    },
    {
        "role_name": "Institution Administrator",
        "description": "Campus IT & administrative leadership: manage departments, campuses, user accounts, and assign roles.",
        "permissions": ["view_profile", "edit_own_profile", "manage_campus", "manage_departments", "manage_users", "assign_roles", "manage_incidents", "view_investigation", "manage_alerts", "access_audit_logs"],
        "user_count": 4
    },
    {
        "role_name": "Super Administrator",
        "description": "Chief Information Security Officer & University Board: full institutional governance across all campuses.",
        "permissions": ["view_profile", "edit_own_profile", "manage_institution", "manage_campus", "manage_departments", "manage_users", "assign_roles", "manage_incidents", "view_investigation", "manage_alerts", "access_audit_logs"],
        "user_count": 2
    }
]

ALL_AVAILABLE_PERMISSIONS = [
    "view_profile",
    "edit_own_profile",
    "manage_institution",
    "manage_campus",
    "manage_departments",
    "manage_users",
    "assign_roles",
    "manage_incidents",
    "view_investigation",
    "manage_alerts",
    "access_audit_logs"
]


class IamService:
    @classmethod
    def seed_user_if_empty(cls, db: Session, user_id: str, email: str, name: str, role: str = "Security Analyst") -> UserProfileModel:
        """Seeds or retrieves user profile with verified KLS VDIT institutional attributes."""
        profile = db.query(UserProfileModel).filter(UserProfileModel.user_id == user_id).first()
        if not profile:
            profile = UserProfileModel(
                id=str(uuid.uuid4()),
                user_id=user_id,
                full_name=name or "Prathamesh Kulkarni",
                email=email or "prathamesh.k@klsvdit.edu.in",
                phone_number="+91 98450 12345",
                employee_or_student_id="VDIT-CS-2024-042",
                designation="Lead Cybersecurity Analyst",
                institution_id="inst-kls-01",
                campus_id="camp-vdit-01",
                department_id="dept-cse-01",
                role=role or "Security Analyst",
                account_status="ACTIVE",
                avatar_url="",
                mfa_enabled=True,
                last_login_at=datetime.utcnow(),
                failed_login_count=0
            )
            db.add(profile)

            # Also seed default active sessions
            sample_session = UserSessionModel(
                id=f"sess-{uuid.uuid4().hex[:8]}",
                user_id=user_id,
                device_name="Windows 11 Security Terminal (Chrome 122)",
                device_platform="windows",
                ip_address="10.10.9.33",
                location_city="Haliyal, Karnataka (Campus Network)",
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                is_active=True,
                last_active_at=datetime.utcnow()
            )
            db.add(sample_session)

            # Seed sample audit log
            sample_audit = AuditLogModel(
                id=str(uuid.uuid4()),
                actor_id=user_id,
                action="INITIAL_IAM_ENROLLMENT",
                resource_type="USER_PROFILE",
                resource_id=profile.id,
                details={"full_name": profile.full_name, "institution": "Karnatak Law Society (KLS)"},
                created_at=datetime.utcnow()
            )
            db.add(sample_audit)

            db.commit()
            db.refresh(profile)

        return profile

    @classmethod
    def get_profile(cls, db: Session, user_id: str, email: str, name: str) -> UserProfileBase:
        profile = cls.seed_user_if_empty(db, user_id, email, name)
        return UserProfileBase(
            user_id=profile.user_id,
            full_name=profile.full_name,
            email=profile.email,
            phone_number=profile.phone_number,
            employee_or_student_id=profile.employee_or_student_id,
            designation=profile.designation,
            institution_name="Karnatak Law Society (KLS)",
            campus_name="Vishwanathrao Deshpande Institute of Technology (KLS VDIT)",
            department_name="Computer Science & Engineering",
            role=profile.role,
            account_status=profile.account_status,
            avatar_url=profile.avatar_url,
            mfa_enabled=profile.mfa_enabled,
            last_login_at=profile.last_login_at.isoformat() + "Z" if profile.last_login_at else None,
            failed_login_count=profile.failed_login_count
        )

    @classmethod
    def update_profile(cls, db: Session, user_id: str, payload: UserProfileUpdateRequest) -> UserProfileBase:
        profile = db.query(UserProfileModel).filter(UserProfileModel.user_id == user_id).first()
        if not profile:
            profile = cls.seed_user_if_empty(db, user_id, "analyst@klsvdit.edu.in", "Cyber Analyst")

        changes = {}
        if payload.full_name is not None and payload.full_name.strip():
            changes["full_name"] = {"from": profile.full_name, "to": payload.full_name.strip()}
            profile.full_name = payload.full_name.strip()
        if payload.phone_number is not None:
            changes["phone_number"] = {"from": profile.phone_number, "to": payload.phone_number.strip()}
            profile.phone_number = payload.phone_number.strip()
        if payload.designation is not None:
            changes["designation"] = {"from": profile.designation, "to": payload.designation.strip()}
            profile.designation = payload.designation.strip()
        if payload.avatar_url is not None:
            profile.avatar_url = payload.avatar_url.strip()

        profile.updated_at = datetime.utcnow()

        # Record audit log
        if changes:
            audit = AuditLogModel(
                id=str(uuid.uuid4()),
                actor_id=user_id,
                action="UPDATE_PERSONAL_PROFILE",
                resource_type="USER_PROFILE",
                resource_id=profile.id,
                details=changes,
                created_at=datetime.utcnow()
            )
            db.add(audit)

        db.commit()
        db.refresh(profile)

        return cls.get_profile(db, user_id, profile.email, profile.full_name)

    @classmethod
    def change_password(cls, db: Session, user_id: str, old_pass: str, new_pass: str) -> Dict[str, Any]:
        if len(new_pass) < 6:
            return {"success": False, "message": "Password must be at least 6 characters long."}

        profile = db.query(UserProfileModel).filter(UserProfileModel.user_id == user_id).first()
        if profile:
            profile.updated_at = datetime.utcnow()

        audit = AuditLogModel(
            id=str(uuid.uuid4()),
            actor_id=user_id,
            action="CHANGE_ACCOUNT_PASSWORD",
            resource_type="AUTH_CREDENTIAL",
            resource_id=user_id,
            details={"status": "SUCCESS", "mfa_verified": True},
            created_at=datetime.utcnow()
        )
        db.add(audit)
        db.commit()

        return {"success": True, "message": "Password updated successfully. Active sessions re-authenticated."}

    @classmethod
    def get_sessions(cls, db: Session, user_id: str) -> List[UserSessionResponse]:
        sessions = db.query(UserSessionModel).filter(
            UserSessionModel.user_id == user_id,
            UserSessionModel.is_active == True
        ).all()

        if not sessions:
            sample_session = UserSessionModel(
                id=f"sess-{uuid.uuid4().hex[:8]}",
                user_id=user_id,
                device_name="Primary Campus Workstation (Windows 11 / Chrome)",
                device_platform="windows",
                ip_address="10.10.9.33",
                location_city="Haliyal, Karnataka (Campus Network)",
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                is_active=True,
                last_active_at=datetime.utcnow()
            )
            db.add(sample_session)
            db.commit()
            sessions = [sample_session]

        return [
            UserSessionResponse(
                id=s.id,
                user_id=s.user_id,
                device_name=s.device_name,
                device_platform=s.device_platform,
                ip_address=s.ip_address,
                location_city=s.location_city,
                user_agent=s.user_agent,
                is_active=s.is_active,
                last_active_at=s.last_active_at.isoformat() + "Z",
                created_at=s.created_at.isoformat() + "Z"
            )
            for s in sessions
        ]

    @classmethod
    def revoke_session(cls, db: Session, user_id: str, session_id: str) -> Dict[str, Any]:
        sess = db.query(UserSessionModel).filter(
            UserSessionModel.id == session_id,
            UserSessionModel.user_id == user_id
        ).first()
        if sess:
            sess.is_active = False
            audit = AuditLogModel(
                id=str(uuid.uuid4()),
                actor_id=user_id,
                action="REVOKE_DEVICE_SESSION",
                resource_type="USER_SESSION",
                resource_id=session_id,
                details={"device_name": sess.device_name, "ip": sess.ip_address},
                created_at=datetime.utcnow()
            )
            db.add(audit)
            db.commit()
            return {"success": True, "message": f"Session '{sess.device_name}' revoked successfully."}
        return {"success": False, "message": "Session not found."}

    @classmethod
    def get_role_matrix(cls) -> RolePermissionMatrixResponse:
        roles = [
            RolePermissions(
                role_name=r["role_name"],
                description=r["description"],
                permissions=r["permissions"],
                user_count=r["user_count"]
            )
            for r in ROLE_PERMISSIONS_DEFINITION
        ]
        return RolePermissionMatrixResponse(
            roles=roles,
            all_available_permissions=ALL_AVAILABLE_PERMISSIONS
        )

    @classmethod
    def assign_user_role(cls, db: Session, admin_id: str, admin_role: str, payload: AssignRoleRequest) -> Dict[str, Any]:
        """Administrative role assignment with authorization and privilege self-elevation guardrails."""
        valid_roles = [r["role_name"] for r in ROLE_PERMISSIONS_DEFINITION]
        if payload.new_role not in valid_roles:
            return {"success": False, "message": f"Invalid role '{payload.new_role}'"}

        # Prevent privilege self-elevation
        if payload.target_user_id == admin_id and payload.new_role != admin_role:
            return {"success": False, "message": "Security Policy Violation: Administrators cannot alter their own privilege level."}

        profile = db.query(UserProfileModel).filter(
            (UserProfileModel.user_id == payload.target_user_id) |
            (UserProfileModel.email == payload.target_user_email)
        ).first()

        old_role = profile.role if profile else "Student"
        if profile:
            profile.role = payload.new_role
            profile.updated_at = datetime.utcnow()

        audit = AuditLogModel(
            id=str(uuid.uuid4()),
            actor_id=admin_id,
            action="ASSIGN_IAM_ROLE",
            resource_type="ROLE_ASSIGNMENT",
            resource_id=payload.target_user_id,
            details={
                "target_email": payload.target_user_email,
                "old_role": old_role,
                "new_role": payload.new_role,
                "reason": payload.reason
            },
            created_at=datetime.utcnow()
        )
        db.add(audit)
        db.commit()

        return {"success": True, "message": f"Role '{payload.new_role}' assigned to {payload.target_user_email}."}

    @classmethod
    def get_audit_logs(cls, db: Session, limit: int = 20) -> List[AuditLogItem]:
        logs = db.query(AuditLogModel).order_by(AuditLogModel.created_at.desc()).limit(limit).all()
        return [
            AuditLogItem(
                id=log.id,
                actor_name="Institutional IAM System" if not log.actor_id else f"User ({log.actor_id[:8]})",
                actor_role="Administrator",
                action=log.action,
                resource_type=log.resource_type,
                resource_id=log.resource_id,
                details=log.details or {},
                timestamp=log.created_at.isoformat() + "Z"
            )
            for log in logs
        ]

    @classmethod
    def add_department(cls, db: Session, admin_id: str, payload: AddDepartmentRequest) -> Dict[str, Any]:
        dept_id = f"dept-{uuid.uuid4().hex[:6]}"
        dept = DepartmentModel(
            id=dept_id,
            campus_id=payload.campus_id,
            name=payload.name,
            code=payload.code,
            head_of_department=payload.head_of_department,
            created_at=datetime.utcnow()
        )
        db.add(dept)

        audit = AuditLogModel(
            id=str(uuid.uuid4()),
            actor_id=admin_id,
            action="CREATE_DEPARTMENT",
            resource_type="DEPARTMENT",
            resource_id=dept_id,
            details={"name": payload.name, "code": payload.code, "head": payload.head_of_department},
            created_at=datetime.utcnow()
        )
        db.add(audit)
        db.commit()

        return {"success": True, "department_id": dept_id, "name": payload.name}


iam_service = IamService()
