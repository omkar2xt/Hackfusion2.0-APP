from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import get_current_user, CurrentUser
from app.schemas.coach import (
    LearningModuleResponse,
    SubmitQuizRequest,
    QuizResultResponse,
    UserLearningProgressResponse
)
from app.services.safety_coach_service import safety_coach_service

router = APIRouter(prefix="/coach", tags=["Adaptive Cyber Safety Coach"])


@router.get("/modules", response_model=List[LearningModuleResponse], status_code=status.HTTP_200_OK)
def list_learning_modules(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Retrieves all interactive cybersecurity learning modules."""
    return safety_coach_service.list_modules(db)


@router.get("/modules/{slug}", response_model=LearningModuleResponse, status_code=status.HTTP_200_OK)
def get_learning_module(
    slug: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    module = safety_coach_service.get_module(db, slug)
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    return module


@router.post("/quiz/submit", response_model=QuizResultResponse, status_code=status.HTTP_200_OK)
def submit_module_quiz(
    payload: SubmitQuizRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Submits quiz responses, updates score, and awards security badges."""
    return safety_coach_service.submit_quiz(db, user.id, payload.module_id, payload.answers)


@router.get("/progress", response_model=UserLearningProgressResponse, status_code=status.HTTP_200_OK)
def get_user_progress(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Returns user's security level badge, completed modules, and adaptive recommendations."""
    return safety_coach_service.get_user_progress(db, user.id)

