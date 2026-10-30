import math
import uuid
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.database.models import CampusBuildingModel, CampusZoneModel
from app.schemas.campus import (
    CampusBuildingCreate,
    CampusBuildingUpdate,
    CampusZoneCreate,
    GeofenceAlert,
    GeofenceCheckResponse
)

# Verified KLS VDIT (Vishwanathrao Deshpande Institute of Technology), Haliyal, Karnataka coordinates
# Campus center ~ 15.3227274 N, 74.7549305 E
KLS_VDIT_BUILDINGS = [
    {
        "id": "bldg-cse-01",
        "name": "Engineering & CS Quad (CSE & IT Labs)",
        "code": "ENG-QUAD",
        "building_type": "academic",
        "latitude": 15.3225,
        "longitude": 74.7552,
        "radius_meters": 150,
        "description": "Computer Science & Engineering Department, AI Research Labs & High Performance Computing",
        "contact_lead": "HOD Computer Science",
        "is_verified": True
    },
    {
        "id": "bldg-admin-01",
        "name": "Administration & Bursar Hub",
        "code": "ADMIN-BURSAR",
        "building_type": "administration",
        "latitude": 15.3228,
        "longitude": 74.7548,
        "radius_meters": 120,
        "description": "Principal Office, Registrar, Admissions, Fee Payment Counter & Server Center",
        "contact_lead": "Campus Administrative Officer",
        "is_verified": True
    },
    {
        "id": "bldg-lib-01",
        "name": "Main Library Commons (Jnan Sudha)",
        "code": "LIB-COMMONS",
        "building_type": "library",
        "latitude": 15.3221,
        "longitude": 74.7549,
        "radius_meters": 180,
        "description": "Central Campus Library, Digital Knowledge Resource Centre & Study Pods",
        "contact_lead": "Chief Librarian",
        "is_verified": True
    },
    {
        "id": "bldg-canteen-01",
        "name": "Student Life & Dining Hall",
        "code": "STUDENT-UNION",
        "building_type": "amenities",
        "latitude": 15.3224,
        "longitude": 74.7542,
        "radius_meters": 140,
        "description": "Central Food Court, Student Common Rooms & Recreational Hall",
        "contact_lead": "Campus Services Director",
        "is_verified": True
    },
    {
        "id": "bldg-ece-01",
        "name": "Science & Bio-Research Tower (ECE/EE Block)",
        "code": "SCI-COMPLEX",
        "building_type": "academic",
        "latitude": 15.3232,
        "longitude": 74.7555,
        "radius_meters": 130,
        "description": "Electronics & Electrical Engineering Complex, Robotics & IoT Testing Center",
        "contact_lead": "HOD Electronics",
        "is_verified": True
    },
    {
        "id": "bldg-hostel-01",
        "name": "Residence Halls & Dorms",
        "code": "RESIDENCE-HALLS",
        "building_type": "residential",
        "latitude": 15.3212,
        "longitude": 74.7538,
        "radius_meters": 200,
        "description": "Student Residential Complex, Guest Quarters & Wi-Fi mesh node B",
        "contact_lead": "Chief Warden",
        "is_verified": True
    },
    {
        "id": "bldg-gate-01",
        "name": "Main Campus Security Gate",
        "code": "GATE-01",
        "building_type": "security",
        "latitude": 15.3239,
        "longitude": 74.7542,
        "radius_meters": 100,
        "description": "Main Campus Entrance, Visitor Checkpoint & Surveillance Command",
        "contact_lead": "Chief Security Officer",
        "is_verified": True
    },
    {
        "id": "bldg-med-01",
        "name": "Health Center & Emergency Care",
        "code": "MED-CARE",
        "building_type": "emergency",
        "latitude": 15.3230,
        "longitude": 74.7540,
        "radius_meters": 90,
        "description": "Campus First Aid, Emergency Medical Response & Ambulance Bay",
        "contact_lead": "Medical Officer",
        "is_verified": True
    }
]


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two GPS coordinates in meters."""
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 1)


class CampusService:
    @classmethod
    def seed_default_buildings(cls, db: Session) -> None:
        """Seeds verified KLS VDIT buildings if none exist."""
        existing_count = db.query(CampusBuildingModel).count()
        if existing_count == 0:
            for b_data in KLS_VDIT_BUILDINGS:
                bldg = CampusBuildingModel(
                    id=b_data["id"],
                    name=b_data["name"],
                    code=b_data["code"],
                    building_type=b_data["building_type"],
                    latitude=b_data["latitude"],
                    longitude=b_data["longitude"],
                    radius_meters=b_data["radius_meters"],
                    description=b_data["description"],
                    contact_lead=b_data["contact_lead"],
                    is_verified=b_data["is_verified"],
                    is_active=True
                )
                db.add(bldg)
            db.commit()

    @classmethod
    def get_all_buildings(cls, db: Session) -> List[CampusBuildingModel]:
        cls.seed_default_buildings(db)
        return db.query(CampusBuildingModel).filter(CampusBuildingModel.is_active == True).all()

    @classmethod
    def create_building(cls, db: Session, payload: CampusBuildingCreate) -> CampusBuildingModel:
        bldg = CampusBuildingModel(
            id=str(uuid.uuid4()),
            name=payload.name,
            code=payload.code,
            building_type=payload.building_type,
            latitude=payload.latitude,
            longitude=payload.longitude,
            radius_meters=payload.radius_meters,
            description=payload.description or "",
            contact_lead=payload.contact_lead or "",
            is_verified=payload.is_verified,
            is_active=payload.is_active
        )
        db.add(bldg)
        db.commit()
        db.refresh(bldg)
        return bldg

    @classmethod
    def update_building(cls, db: Session, building_id: str, payload: CampusBuildingUpdate) -> Optional[CampusBuildingModel]:
        bldg = db.query(CampusBuildingModel).filter(CampusBuildingModel.id == building_id).first()
        if not bldg:
            return None
        for key, val in payload.model_dump(exclude_unset=True).items():
            setattr(bldg, key, val)
        bldg.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(bldg)
        return bldg

    @classmethod
    def check_geofence(cls, db: Session, lat: float, lon: float, accuracy: float = 10.0) -> GeofenceCheckResponse:
        """Evaluates current user coordinate against all campus facilities and active threat perimeters."""
        buildings = cls.get_all_buildings(db)
        
        # Campus center: KLS VDIT Haliyal
        campus_center_lat, campus_center_lon = 15.3227274, 74.7549305
        dist_to_center = haversine_distance_meters(lat, lon, campus_center_lat, campus_center_lon)
        in_campus_bounds = dist_to_center <= 1200.0  # ~1.2km campus boundary

        closest_bldg = None
        closest_distance = float('inf')

        # Threat mapping per code matching cyber radar telemetry
        threat_profile_map = {
            "ENG-QUAD": {"threat_level": "RED_ALERT", "top_threat": "Credential Harvester", "message": "🚨 Red Alert: Rogue Wi-Fi AP detected harvesting campus portal credentials."},
            "ADMIN-BURSAR": {"threat_level": "RED_ALERT", "top_threat": "Impersonation Wire Phish", "message": "🚨 Red Alert: Fake Tuition wire transfer emails & tampered payment flyers active."},
            "LIB-COMMONS": {"threat_level": "ELEVATED", "top_threat": "Malicious QR Code", "message": "⚠️ Warning: Suspicious QR code stickers reported on 2nd-floor printer desks."},
            "STUDENT-UNION": {"threat_level": "ELEVATED", "top_threat": "Phishing SMS", "message": "⚠️ Warning: Fake cafeteria meal discount SMS phishing circulating in dining hall."},
            "SCI-COMPLEX": {"threat_level": "NORMAL", "top_threat": "Reconnaissance Scan", "message": "✅ Zone Secure. Baseline cyber hygiene maintained."},
            "RESIDENCE-HALLS": {"threat_level": "NORMAL", "top_threat": "Smishing Link", "message": "✅ Zone Secure. Dorm mesh network operating normally."}
        }

        alerts: List[GeofenceAlert] = []

        for b in buildings:
            d = haversine_distance_meters(lat, lon, b.latitude, b.longitude)
            if d < closest_distance:
                closest_distance = d
                closest_bldg = b

            profile = threat_profile_map.get(b.code, {"threat_level": "NORMAL", "top_threat": "Standard Perimeter", "message": "Perimeter normal."})
            is_inside = d <= b.radius_meters
            is_approaching = (not is_inside) and (d <= (b.radius_meters + 60))

            if is_inside or is_approaching:
                alerts.append(GeofenceAlert(
                    zone_id=b.id,
                    zone_name=b.name,
                    threat_level=profile["threat_level"],
                    distance_meters=d,
                    is_inside=is_inside,
                    is_approaching=is_approaching,
                    warning_message=profile["message"],
                    top_threat_vector=profile["top_threat"]
                ))

        alerts.sort(key=lambda a: a.distance_meters)

        return GeofenceCheckResponse(
            user_latitude=lat,
            user_longitude=lon,
            timestamp=datetime.utcnow().isoformat() + "Z",
            in_campus_bounds=in_campus_bounds,
            closest_building_id=closest_bldg.id if closest_bldg else None,
            closest_building_name=closest_bldg.name if closest_bldg else None,
            closest_building_distance_meters=closest_distance if closest_bldg else None,
            alerts=alerts
        )


campus_service = CampusService()
