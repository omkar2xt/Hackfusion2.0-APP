from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import get_current_user, CurrentUser
from app.schemas.campus import (
    CampusBuildingCreate,
    CampusBuildingUpdate,
    CampusBuildingResponse,
    GeofenceCheckRequest,
    GeofenceCheckResponse
)
from app.services.campus_service import campus_service

router = APIRouter(prefix="/campus", tags=["Campus Geospatial Intelligence Radar"])


@router.get("/buildings", response_model=List[CampusBuildingResponse], status_code=status.HTTP_200_OK)
def get_campus_buildings(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """
    Returns verified campus facilities, GPS coordinates and perimeter radii.
    Seeds KLS VDIT verified coordinates if not already present.
    """
    return campus_service.get_all_buildings(db)


@router.post("/buildings", response_model=CampusBuildingResponse, status_code=status.HTTP_201_CREATED)
def create_campus_building(
    payload: CampusBuildingCreate,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """
    Admin-only endpoint to register a new verified or custom campus building location.
    """
    return campus_service.create_building(db, payload)


@router.put("/buildings/{building_id}", response_model=CampusBuildingResponse, status_code=status.HTTP_200_OK)
def update_campus_building(
    building_id: str,
    payload: CampusBuildingUpdate,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """
    Admin-only endpoint to update campus building coordinates, geofence radius or details.
    """
    bldg = campus_service.update_building(db, building_id, payload)
    if not bldg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campus building with ID '{building_id}' not found."
        )
    return bldg


@router.post("/geofence-check", response_model=GeofenceCheckResponse, status_code=status.HTTP_200_OK)
def evaluate_geofence(
    payload: GeofenceCheckRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """
    Computes real-time geospatial distances from user device coordinates to all campus facilities.
    Evaluates perimeter breach, approaching threat warnings, and proximity alerts.
    """
    return campus_service.check_geofence(
        db=db,
        lat=payload.latitude,
        lon=payload.longitude,
        accuracy=payload.accuracy_meters or 10.0
    )
