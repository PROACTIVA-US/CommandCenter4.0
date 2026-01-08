"""Pydantic schemas for CC4 API."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


# --- Project Schemas ---

class ProjectCreate(BaseModel):
    name: str
    goal: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    context: Optional[str] = None
    context_completeness: Optional[float] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    goal: Optional[str]
    context: Optional[str]  # JSON string of discovered context
    context_completeness: float
    created_at: datetime
    
    class Config:
        from_attributes = True


# --- Idea Schemas ---

class IdeaCreate(BaseModel):
    project_id: str
    title: str
    description: Optional[str] = None
    status: str = "resonance"
    parent_id: Optional[str] = None
    position_x: float = 0
    position_y: float = 0


class IdeaUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    confidence: Optional[float] = None
    calibrated_confidence: Optional[float] = None
    validation_reasoning: Optional[str] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None


class IdeaResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: Optional[str]
    status: str
    confidence: Optional[float]
    calibrated_confidence: Optional[float]
    validation_reasoning: Optional[str]
    parent_id: Optional[str]
    position_x: float
    position_y: float
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# --- Connection Schemas ---

class ConnectionCreate(BaseModel):
    source_id: str
    target_id: str
    label: Optional[str] = None


class ConnectionResponse(BaseModel):
    id: str
    source_id: str
    target_id: str
    label: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# --- Intelligence Schemas ---

class WanderRequest(BaseModel):
    context: str  # What to explore
    project_id: str  # To get the goal


class WanderIdea(BaseModel):
    title: str
    description: str
    why_relevant: str


class WanderResponse(BaseModel):
    ideas: List[WanderIdea]


class ValidateRequest(BaseModel):
    hypothesis: str
    context: Optional[str] = None


class ValidateResponse(BaseModel):
    confidence: float
    calibrated_confidence: Optional[float] = None  # From OpenForecaster
    reasoning: str
    risks: List[str]
    next_steps: List[str]


class PlanRequest(BaseModel):
    validated_idea: str
    project_id: str  # To get the goal
    constraints: Optional[str] = None


class PlanAction(BaseModel):
    action: str
    why: str
    effort: str  # low | medium | high
    dependencies: List[str]


class PlanResponse(BaseModel):
    actions: List[PlanAction]


# --- Context Discovery Schemas ---

class DiscoverContextRequest(BaseModel):
    project_id: str


class ContextQuestion(BaseModel):
    question: str
    why_it_matters: str
    priority: str  # high | medium | low
    category: str  # product | market | team | finance | strategy


class DiscoverContextResponse(BaseModel):
    questions: List[ContextQuestion]
    context_completeness: float  # 0.0-1.0
    summary: str  # What we know so far


class AnswerContextRequest(BaseModel):
    project_id: str
    answers: dict  # {question: answer} pairs
