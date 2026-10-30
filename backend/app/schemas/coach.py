from typing import List, Optional
from pydantic import BaseModel, Field


class QuizQuestionResponse(BaseModel):
    id: str
    question_text: str
    options_json: List[str]
    # correct_index is omitted in public quiz payload to prevent cheating
    explanation: str

    model_config = {"from_attributes": True}


class LearningModuleResponse(BaseModel):
    id: str
    slug: str
    title: str
    category: str
    description: str
    estimated_minutes: int
    content_markdown: str
    icon_name: str
    order_index: int
    questions: List[QuizQuestionResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class SubmitQuizRequest(BaseModel):
    module_id: str
    answers: List[int] = Field(..., description="Selected answer index per question")


class QuizResultResponse(BaseModel):
    module_id: str
    score: int
    total_questions: int
    passed: bool
    correct_count: int
    feedback: str
    badge_awarded: Optional[str] = None


class UserLearningProgressResponse(BaseModel):
    total_modules: int
    completed_modules: int
    average_score: float
    coach_level: str  # "Cyber Novice", "Security Apprentice", "Campus Shield Guardian"
    completed_module_ids: List[str]
    recommended_modules: List[LearningModuleResponse]
