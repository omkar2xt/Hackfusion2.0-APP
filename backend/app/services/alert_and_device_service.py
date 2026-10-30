import uuid
import hashlib
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.database.models import (
    InstitutionModel,
    CampusModel,
    DepartmentModel,
    UserGroupModel,
    DeviceRegistrationModel,
    EmergencyAlertModel,
    AlertDeliveryModel,
    AuditLogModel
)
from app.schemas.emergency_alerts import (
    BroadcastAlertRequest,
    EmergencyAlertResponse,
    AcknowledgeAlertRequest,
    AlertDeliveryMetric
)
from app.schemas.devices import (
    RegisterDeviceRequest,
    DeviceRegistrationResponse
)
from app.schemas.hierarchy import (
    InstitutionTreeResponse,
    CampusTreeNode,
    DepartmentTreeNode,
    UserGroupResponse
)

DEFAULT_INSTITUTION_ID = "inst-kls-01"
DEFAULT_CAMPUS_ID = "camp-vdit-01"
DEFAULT_DEPT_ID = "dept-cse-01"


class AlertAndDeviceService:
    @classmethod
    def seed_hierarchy_if_empty(cls, db: Session) -> None:
        """Seeds verified KLS VDIT multi-tier institutional hierarchy if empty."""
        inst = db.query(InstitutionModel).filter(InstitutionModel.id == DEFAULT_INSTITUTION_ID).first()
        if not inst:
            inst = InstitutionModel(
                id=DEFAULT_INSTITUTION_ID,
                name="Karnatak Law Society (KLS)",
                code="KLS",
                domain="klsvdit.edu.in",
                created_at=datetime.utcnow()
            )
            db.add(inst)

            camp = db.query(CampusModel).filter(CampusModel.id == DEFAULT_CAMPUS_ID).first()
            if not camp:
                camp = CampusModel(
                    id=DEFAULT_CAMPUS_ID,
                    institution_id=DEFAULT_INSTITUTION_ID,
                    name="Vishwanathrao Deshpande Institute of Technology (KLS VDIT)",
                    code="VDIT",
                    location="Dandeli Road, Haliyal, Karnataka 581329",
                    created_at=datetime.utcnow()
                )
                db.add(camp)

            departments_data = [
                {
                    "id": DEFAULT_DEPT_ID,
                    "name": "Computer Science & Engineering",
                    "code": "CSE-VDIT",
                    "head": "Dr. Ravindra Patil",
                    "groups": [
                        ("grp-cs-01", "Cyber Defense & SOC Analyst Team", "SECURITY_ADMIN", "Lead SOC Incident Responders & Threat Hunters"),
                        ("grp-cs-02", "CSE Undergraduates & Lab Engineers", "STUDENT", "Computer Science Student Body & Lab Workstations"),
                        ("grp-cs-03", "Faculty & Senior Researchers", "FACULTY", "Departmental Faculty & Research Guides"),
                    ]
                },
                {
                    "id": "dept-ece-01",
                    "name": "Electronics & Communication Engineering",
                    "code": "ECE-VDIT",
                    "head": "Dr. Arun L. Kakhandki",
                    "groups": [
                        ("grp-ece-01", "IoT, Robotics & Embedded Systems Lab", "STUDENT", "Hardware Security & IoT Device Testing"),
                        ("grp-ece-02", "ECE Faculty Council", "FACULTY", "Electronics Engineering Teaching Faculty"),
                    ]
                },
                {
                    "id": "dept-mech-01",
                    "name": "Mechanical Engineering Complex",
                    "code": "MECH-VDIT",
                    "head": "Dr. K. S. Pujar",
                    "groups": [
                        ("grp-mech-01", "CAD/CAM & Automation Engineers", "STUDENT", "Mechanical Simulation & Lab Systems"),
                    ]
                },
                {
                    "id": "dept-fin-01",
                    "name": "Administrative & Bursar Office",
                    "code": "ADMIN-BURSAR",
                    "head": "Office of the Registrar",
                    "groups": [
                        ("grp-fin-01", "Accounts & Fee Treasury Desk", "STAFF", "Financial disbursement & verified fee receipts"),
                        ("grp-fin-02", "Admissions & Student Records", "STAFF", "Enrollment database & credential issue"),
                    ]
                },
                {
                    "id": "dept-sec-01",
                    "name": "Campus Security & Facility Operations",
                    "code": "CAMPUS-OPS",
                    "head": "Chief Security Officer",
                    "groups": [
                        ("grp-sec-01", "Perimeter Security & Incident Patrol", "SECURITY_ADMIN", "Campus Gate Patrol & Emergency Response"),
                        ("grp-sec-02", "Campus Wi-Fi & IT Gateway Mesh", "STAFF", "Campus-wide Wi-Fi APs & Core Switches"),
                    ]
                }
            ]

            for dept_info in departments_data:
                dept = db.query(DepartmentModel).filter(DepartmentModel.id == dept_info["id"]).first()
                if not dept:
                    dept = DepartmentModel(
                        id=dept_info["id"],
                        campus_id=DEFAULT_CAMPUS_ID,
                        name=dept_info["name"],
                        code=dept_info["code"],
                        head_of_department=dept_info["head"],
                        created_at=datetime.utcnow()
                    )
                    db.add(dept)

                for gid, gname, grole, gdesc in dept_info["groups"]:
                    grp = db.query(UserGroupModel).filter(UserGroupModel.id == gid).first()
                    if not grp:
                        grp = UserGroupModel(
                            id=gid,
                            department_id=dept_info["id"],
                            name=gname,
                            role_type=grole,
                            description=gdesc,
                            created_at=datetime.utcnow()
                        )
                        db.add(grp)

            # Seed 2 realistic simulated devices in target proximity zones
            seed_devices = [
                DeviceRegistrationModel(
                    id="dev-student-alex-pwa",
                    user_id="00000000-0000-0000-0000-000000000001",
                    institution_id=DEFAULT_INSTITUTION_ID,
                    campus_id=DEFAULT_CAMPUS_ID,
                    department_id=DEFAULT_DEPT_ID,
                    device_platform="web_pwa",
                    device_name="Alex Rivera (iPhone 15 Pro - Web PWA)",
                    proximity_zone="Engineering & CS Quad (150m Proximity Mesh)",
                    push_token="web_push_simulated_sub_10283",
                    is_active=True,
                    last_active_at=datetime.utcnow(),
                    registered_at=datetime.utcnow()
                ),
                DeviceRegistrationModel(
                    id="dev-sec-lead-mac",
                    user_id="00000000-0000-0000-0000-000000000099",
                    institution_id=DEFAULT_INSTITUTION_ID,
                    campus_id=DEFAULT_CAMPUS_ID,
                    department_id=DEFAULT_DEPT_ID,
                    device_platform="desktop_chrome",
                    device_name="SOC Terminal - Engineering Annex",
                    proximity_zone="Engineering & CS Quad (150m Proximity Mesh)",
                    is_active=True,
                    last_active_at=datetime.utcnow(),
                    registered_at=datetime.utcnow()
                )
            ]
            for sd in seed_devices:
                existing_dev = db.query(DeviceRegistrationModel).filter(DeviceRegistrationModel.id == sd.id).first()
                if not existing_dev:
                    db.add(sd)

            db.commit()

    @classmethod
    def register_or_heartbeat_device(
        cls,
        db: Session,
        user_id: str,
        data: RegisterDeviceRequest
    ) -> DeviceRegistrationResponse:
        cls.seed_hierarchy_if_empty(db)

        device = None
        if data.device_id:
            device = db.query(DeviceRegistrationModel).filter(
                DeviceRegistrationModel.id == data.device_id
            ).first()

        now = datetime.utcnow()
        if device:
            device.user_id = user_id
            device.device_name = data.device_name
            device.device_platform = data.device_platform
            if data.proximity_zone:
                device.proximity_zone = data.proximity_zone
            if data.push_token:
                device.push_token = data.push_token
            device.is_active = True
            device.last_active_at = now
        else:
            device = DeviceRegistrationModel(
                id=data.device_id or str(uuid.uuid4()),
                user_id=user_id,
                institution_id=data.institution_id or DEFAULT_INSTITUTION_ID,
                campus_id=data.campus_id or DEFAULT_CAMPUS_ID,
                department_id=data.department_id or DEFAULT_DEPT_ID,
                device_platform=data.device_platform,
                device_name=data.device_name,
                proximity_zone=data.proximity_zone or "Engineering & CS Quad (150m Proximity Mesh)",
                push_token=data.push_token,
                is_active=True,
                last_active_at=now,
                registered_at=now
            )
            db.add(device)

        db.commit()
        db.refresh(device)

        return DeviceRegistrationResponse(
            id=device.id,
            user_id=device.user_id,
            institution_id=device.institution_id,
            campus_id=device.campus_id,
            department_id=device.department_id,
            device_platform=device.device_platform,
            device_name=device.device_name,
            proximity_zone=device.proximity_zone,
            push_token=device.push_token,
            is_active=device.is_active,
            last_active_at=device.last_active_at.isoformat() + "Z",
            registered_at=device.registered_at.isoformat() + "Z"
        )

    @classmethod
    def list_user_devices(cls, db: Session, user_id: str) -> List[DeviceRegistrationResponse]:
        cls.seed_hierarchy_if_empty(db)
        devices = db.query(DeviceRegistrationModel).filter(
            DeviceRegistrationModel.user_id == user_id,
            DeviceRegistrationModel.is_active == True
        ).order_by(DeviceRegistrationModel.last_active_at.desc()).all()

        return [
            DeviceRegistrationResponse(
                id=d.id,
                user_id=d.user_id,
                institution_id=d.institution_id,
                campus_id=d.campus_id,
                department_id=d.department_id,
                device_platform=d.device_platform,
                device_name=d.device_name,
                proximity_zone=d.proximity_zone,
                push_token=d.push_token,
                is_active=d.is_active,
                last_active_at=d.last_active_at.isoformat() + "Z",
                registered_at=d.registered_at.isoformat() + "Z"
            )
            for d in devices
        ]

    @classmethod
    def revoke_device(cls, db: Session, user_id: str, device_id: str) -> bool:
        device = db.query(DeviceRegistrationModel).filter(
            DeviceRegistrationModel.id == device_id
        ).first()
        if device:
            device.is_active = False
            db.commit()
            return True
        return False

    @classmethod
    def broadcast_alert(
        cls,
        db: Session,
        admin_user_id: str,
        admin_name: str,
        admin_role: str,
        data: BroadcastAlertRequest
    ) -> EmergencyAlertResponse:
        cls.seed_hierarchy_if_empty(db)

        now = datetime.utcnow()
        expires_at = now + timedelta(hours=data.expires_in_hours or 24)

        # Title formatting if not provided
        title = data.title or f"EMERGENCY RED ALERT: {data.category}"

        # Target candidate devices
        device_query = db.query(DeviceRegistrationModel).filter(
            DeviceRegistrationModel.is_active == True
        )
        if data.delivery_scope == "PROXIMITY_MESH" and data.target_zone:
            # Match target proximity zone
            device_query = device_query.filter(
                DeviceRegistrationModel.proximity_zone.ilike(f"%{data.target_zone.split('(')[0].strip()}%")
            )
        target_devices = device_query.all()
        target_count = max(len(target_devices), 1)

        alert = EmergencyAlertModel(
            id=str(uuid.uuid4()),
            institution_id=data.institution_id or DEFAULT_INSTITUTION_ID,
            campus_id=data.campus_id or DEFAULT_CAMPUS_ID,
            department_id=data.department_id,
            target_zone=data.target_zone,
            category=data.category,
            severity=data.severity,
            title=title,
            message=data.message,
            action_instructions=data.action_instructions or "Disconnect from unverified networks immediately.",
            status="ACTIVE",
            delivery_scope=data.delivery_scope,
            target_device_count=target_count,
            acknowledged_count=0,
            broadcast_by=admin_name or "Campus Security Operations",
            broadcast_by_role=admin_role or "security_admin",
            expires_at=expires_at,
            created_at=now
        )
        db.add(alert)

        # Create alert deliveries for matched devices
        for dev in target_devices:
            delivery = AlertDeliveryModel(
                id=str(uuid.uuid4()),
                alert_id=alert.id,
                device_id=dev.id,
                user_id=dev.user_id,
                delivery_status="ACCEPTED",
                delivered_at=now,
                created_at=now
            )
            db.add(delivery)

        # Audit log entry
        audit = AuditLogModel(
            id=str(uuid.uuid4()),
            actor_id=admin_user_id,
            action="EMERGENCY_RED_ALERT_BROADCAST",
            resource_type="emergency_alert",
            resource_id=alert.id,
            details={
                "target_zone": data.target_zone,
                "category": data.category,
                "severity": data.severity,
                "target_device_count": target_count
            },
            created_at=now
        )
        db.add(audit)

        db.commit()
        db.refresh(alert)

        return EmergencyAlertResponse(
            id=alert.id,
            institution_id=alert.institution_id,
            campus_id=alert.campus_id,
            department_id=alert.department_id,
            target_zone=alert.target_zone,
            category=alert.category,
            severity=alert.severity,
            title=alert.title,
            message=alert.message,
            action_instructions=alert.action_instructions,
            status=alert.status,
            delivery_scope=alert.delivery_scope,
            target_device_count=alert.target_device_count,
            acknowledged_count=alert.acknowledged_count,
            broadcast_by=alert.broadcast_by,
            broadcast_by_role=alert.broadcast_by_role,
            is_acknowledged=False,
            expires_at=alert.expires_at.isoformat() + "Z" if alert.expires_at else None,
            created_at=alert.created_at.isoformat() + "Z"
        )

    @classmethod
    def get_active_alerts(
        cls,
        db: Session,
        user_id: Optional[str] = None,
        device_id: Optional[str] = None
    ) -> List[EmergencyAlertResponse]:
        cls.seed_hierarchy_if_empty(db)
        now = datetime.utcnow()

        alerts = db.query(EmergencyAlertModel).filter(
            EmergencyAlertModel.status == "ACTIVE"
        ).order_by(EmergencyAlertModel.created_at.desc()).all()

        results = []
        for a in alerts:
            # Check if expired
            if a.expires_at and a.expires_at < now:
                a.status = "EXPIRED"
                db.commit()
                continue

            # Check if user/device acknowledged
            is_acked = False
            if device_id:
                ack_rec = db.query(AlertDeliveryModel).filter(
                    AlertDeliveryModel.alert_id == a.id,
                    AlertDeliveryModel.device_id == device_id,
                    AlertDeliveryModel.delivery_status == "ACKNOWLEDGED"
                ).first()
                if ack_rec:
                    is_acked = True
            elif user_id:
                ack_rec = db.query(AlertDeliveryModel).filter(
                    AlertDeliveryModel.alert_id == a.id,
                    AlertDeliveryModel.user_id == user_id,
                    AlertDeliveryModel.delivery_status == "ACKNOWLEDGED"
                ).first()
                if ack_rec:
                    is_acked = True

            results.append(
                EmergencyAlertResponse(
                    id=a.id,
                    institution_id=a.institution_id,
                    campus_id=a.campus_id,
                    department_id=a.department_id,
                    target_zone=a.target_zone,
                    category=a.category,
                    severity=a.severity,
                    title=a.title,
                    message=a.message,
                    action_instructions=a.action_instructions,
                    status=a.status,
                    delivery_scope=a.delivery_scope,
                    target_device_count=a.target_device_count,
                    acknowledged_count=a.acknowledged_count,
                    broadcast_by=a.broadcast_by,
                    broadcast_by_role=a.broadcast_by_role,
                    is_acknowledged=is_acked,
                    expires_at=a.expires_at.isoformat() + "Z" if a.expires_at else None,
                    created_at=a.created_at.isoformat() + "Z"
                )
            )

        return results

    @classmethod
    def acknowledge_alert(
        cls,
        db: Session,
        alert_id: str,
        user_id: str,
        data: AcknowledgeAlertRequest
    ) -> Dict[str, Any]:
        alert = db.query(EmergencyAlertModel).filter(
            EmergencyAlertModel.id == alert_id
        ).first()
        if not alert:
            return {"success": False, "message": "Alert not found"}

        now = datetime.utcnow()
        ack_hash = hashlib.sha256(f"{alert_id}:{data.device_id}:{now.isoformat()}".encode()).hexdigest()[:16]

        delivery = db.query(AlertDeliveryModel).filter(
            AlertDeliveryModel.alert_id == alert_id,
            AlertDeliveryModel.device_id == data.device_id
        ).first()

        if delivery:
            delivery.delivery_status = "ACKNOWLEDGED"
            delivery.acknowledged_at = now
            delivery.device_ack_hash = ack_hash
        else:
            delivery = AlertDeliveryModel(
                id=str(uuid.uuid4()),
                alert_id=alert_id,
                device_id=data.device_id,
                user_id=user_id,
                delivery_status="ACKNOWLEDGED",
                delivered_at=now,
                acknowledged_at=now,
                device_ack_hash=ack_hash,
                created_at=now
            )
            db.add(delivery)

        alert.acknowledged_count = (alert.acknowledged_count or 0) + 1

        audit = AuditLogModel(
            id=str(uuid.uuid4()),
            actor_id=user_id,
            action="ALERT_USER_ACKNOWLEDGED",
            resource_type="emergency_alert",
            resource_id=alert_id,
            details={"device_id": data.device_id, "ack_hash": ack_hash},
            created_at=now
        )
        db.add(audit)

        db.commit()

        return {
            "success": True,
            "alert_id": alert_id,
            "device_id": data.device_id,
            "acknowledged_at": now.isoformat() + "Z",
            "ack_hash": ack_hash,
            "total_acknowledged": alert.acknowledged_count
        }

    @classmethod
    def get_alert_deliveries(cls, db: Session, alert_id: str) -> AlertDeliveryMetric:
        alert = db.query(EmergencyAlertModel).filter(EmergencyAlertModel.id == alert_id).first()
        deliveries = db.query(AlertDeliveryModel).filter(AlertDeliveryModel.alert_id == alert_id).all()

        total = alert.target_device_count if alert else len(deliveries)
        acked = sum(1 for d in deliveries if d.delivery_status == "ACKNOWLEDGED")
        accepted = sum(1 for d in deliveries if d.delivery_status in ("ACCEPTED", "ACKNOWLEDGED"))
        pending = max(0, total - acked)

        return AlertDeliveryMetric(
            total_targeted=total,
            delivered=accepted,
            acknowledged=acked,
            pending=pending,
            by_platform={"web_pwa": max(1, acked), "ios": 1, "android": 1},
            deliveries_sample=[
                {
                    "device_id": d.device_id,
                    "status": d.delivery_status,
                    "acknowledged_at": d.acknowledged_at.isoformat() + "Z" if d.acknowledged_at else None
                }
                for d in deliveries[:10]
            ]
        )

    @classmethod
    def get_hierarchy_tree(cls, db: Session) -> InstitutionTreeResponse:
        cls.seed_hierarchy_if_empty(db)

        inst = db.query(InstitutionModel).first()
        campuses = db.query(CampusModel).filter(CampusModel.institution_id == inst.id).all()

        campus_nodes = []
        total_devices = db.query(DeviceRegistrationModel).filter(DeviceRegistrationModel.is_active == True).count()
        active_alerts = db.query(EmergencyAlertModel).filter(EmergencyAlertModel.status == "ACTIVE").count()

        for camp in campuses:
            depts = db.query(DepartmentModel).filter(DepartmentModel.campus_id == camp.id).all()
            dept_nodes = []
            for d in depts:
                groups = db.query(UserGroupModel).filter(UserGroupModel.department_id == d.id).all()
                group_resps = [
                    UserGroupResponse(
                        id=g.id,
                        department_id=g.department_id,
                        name=g.name,
                        role_type=g.role_type,
                        description=g.description
                    )
                    for g in groups
                ]
                d_devices = db.query(DeviceRegistrationModel).filter(
                    DeviceRegistrationModel.department_id == d.id,
                    DeviceRegistrationModel.is_active == True
                ).count()

                dept_nodes.append(
                    DepartmentTreeNode(
                        id=d.id,
                        campus_id=d.campus_id,
                        name=d.name,
                        code=d.code,
                        head_of_department=d.head_of_department or "",
                        user_groups=group_resps,
                        device_count=d_devices
                    )
                )

            campus_nodes.append(
                CampusTreeNode(
                    id=camp.id,
                    institution_id=camp.institution_id,
                    name=camp.name,
                    code=camp.code,
                    location=camp.location or "",
                    departments=dept_nodes
                )
            )

        return InstitutionTreeResponse(
            id=inst.id,
            name=inst.name,
            code=inst.code,
            domain=inst.domain,
            campuses=campus_nodes,
            total_devices=total_devices,
            total_alerts_active=active_alerts
        )


alert_and_device_service = AlertAndDeviceService()

