"""
CommandCenter 4.0 API

A strategic intelligence tool for discovering paths to your goals.
Enhanced with OpenForecaster for calibrated predictions.
"""

import json
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import get_db, init_db
from .models import Project, Idea, Connection
from .schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    IdeaCreate, IdeaUpdate, IdeaResponse,
    ConnectionCreate, ConnectionResponse,
    WanderRequest, WanderResponse, WanderIdea,
    ValidateRequest, ValidateResponse,
    PlanRequest, PlanResponse, PlanAction,
    DiscoverContextRequest, DiscoverContextResponse, ContextQuestion,
    AnswerContextRequest,
)
from . import intelligence


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    init_db()
    yield


app = FastAPI(
    title="CommandCenter 4.0",
    description="Strategic intelligence for discovering paths to your goals. Now with calibrated forecasting.",
    version="4.0.0",
    lifespan=lifespan,
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Health Check ---

@app.get("/health")
async def health():
    return {"status": "healthy", "version": "4.0.0", "features": ["openforecaster"]}


# --- Projects ---

@app.post("/api/projects", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    db_project = Project(name=project.name, goal=project.goal)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@app.get("/api/projects", response_model=List[ProjectResponse])
async def list_projects(db: Session = Depends(get_db)):
    return db.query(Project).order_by(Project.created_at.desc()).all()


@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.patch("/api/projects/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, update: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if update.name is not None:
        project.name = update.name
    if update.goal is not None:
        project.goal = update.goal
    
    db.commit()
    db.refresh(project)
    return project


@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    return {"deleted": True}


# --- Ideas ---

@app.post("/api/ideas", response_model=IdeaResponse)
async def create_idea(idea: IdeaCreate, db: Session = Depends(get_db)):
    # Verify project exists
    project = db.query(Project).filter(Project.id == idea.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_idea = Idea(
        project_id=idea.project_id,
        title=idea.title,
        description=idea.description,
        status=idea.status,
        parent_id=idea.parent_id,
        position_x=idea.position_x,
        position_y=idea.position_y,
    )
    db.add(db_idea)
    db.commit()
    db.refresh(db_idea)
    return db_idea


@app.get("/api/ideas", response_model=List[IdeaResponse])
async def list_ideas(project_id: str, db: Session = Depends(get_db)):
    return db.query(Idea).filter(Idea.project_id == project_id).order_by(Idea.created_at.desc()).all()


@app.get("/api/ideas/{idea_id}", response_model=IdeaResponse)
async def get_idea(idea_id: str, db: Session = Depends(get_db)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    return idea


@app.patch("/api/ideas/{idea_id}", response_model=IdeaResponse)
async def update_idea(idea_id: str, update: IdeaUpdate, db: Session = Depends(get_db)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(idea, field, value)
    
    db.commit()
    db.refresh(idea)
    return idea


@app.delete("/api/ideas/{idea_id}")
async def delete_idea(idea_id: str, db: Session = Depends(get_db)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    db.delete(idea)
    db.commit()
    return {"deleted": True}


# --- Connections ---

@app.post("/api/connections", response_model=ConnectionResponse)
async def create_connection(conn: ConnectionCreate, db: Session = Depends(get_db)):
    # Verify both ideas exist
    source = db.query(Idea).filter(Idea.id == conn.source_id).first()
    target = db.query(Idea).filter(Idea.id == conn.target_id).first()
    
    if not source or not target:
        raise HTTPException(status_code=404, detail="Source or target idea not found")
    
    db_conn = Connection(
        source_id=conn.source_id,
        target_id=conn.target_id,
        label=conn.label,
    )
    db.add(db_conn)
    db.commit()
    db.refresh(db_conn)
    return db_conn


@app.get("/api/connections", response_model=List[ConnectionResponse])
async def list_connections(project_id: str, db: Session = Depends(get_db)):
    # Get all connections for ideas in this project
    idea_ids = [i.id for i in db.query(Idea.id).filter(Idea.project_id == project_id).all()]
    return db.query(Connection).filter(
        (Connection.source_id.in_(idea_ids)) | (Connection.target_id.in_(idea_ids))
    ).all()


@app.delete("/api/connections/{connection_id}")
async def delete_connection(connection_id: str, db: Session = Depends(get_db)):
    conn = db.query(Connection).filter(Connection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    db.delete(conn)
    db.commit()
    return {"deleted": True}


# --- Strategic Intelligence ---

@app.post("/api/wander", response_model=WanderResponse)
async def wander(request: WanderRequest, db: Session = Depends(get_db)):
    """Explore a problem space, generate nascent ideas."""
    project = db.query(Project).filter(Project.id == request.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    goal = project.goal or "achieving strategic objectives"
    
    # Parse project context if available
    project_context = None
    if project.context:
        try:
            project_context = json.loads(project.context)
        except json.JSONDecodeError:
            pass
    
    ideas = await intelligence.wander(request.context, goal, project_context)
    return WanderResponse(ideas=[WanderIdea(**idea) for idea in ideas])


@app.post("/api/validate", response_model=ValidateResponse)
async def validate(request: ValidateRequest):
    """
    Validate a hypothesis using:
    - OpenForecaster for calibrated probability (if available)
    - Claude for reasoning and risk analysis
    """
    result = await intelligence.validate(request.hypothesis, request.context)
    return ValidateResponse(**result)


@app.post("/api/plan", response_model=PlanResponse)
async def plan(request: PlanRequest, db: Session = Depends(get_db)):
    """Convert a validated idea into actionable steps."""
    project = db.query(Project).filter(Project.id == request.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    goal = project.goal or "achieving strategic objectives"
    
    actions = await intelligence.plan(request.validated_idea, goal, request.constraints)
    return PlanResponse(actions=[PlanAction(**action) for action in actions])


# --- Context Discovery ---

@app.post("/api/discover-context", response_model=DiscoverContextResponse)
async def discover_context(request: DiscoverContextRequest, db: Session = Depends(get_db)):
    """
    Identify gaps in project context and generate questions to fill them.
    This inverts the usual flow: the system asks the user what it needs to know.
    """
    project = db.query(Project).filter(Project.id == request.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    goal = project.goal or "achieving strategic objectives"
    
    # Parse existing context if available
    known_context = None
    if project.context:
        try:
            known_context = json.loads(project.context)
        except json.JSONDecodeError:
            pass
    
    result = await intelligence.discover_context(project.name, goal, known_context)
    
    return DiscoverContextResponse(
        questions=[ContextQuestion(**q) for q in result["questions"]],
        context_completeness=result["context_completeness"],
        summary=result["summary"]
    )


@app.post("/api/answer-context")
async def answer_context(request: AnswerContextRequest, db: Session = Depends(get_db)):
    """
    Process user's answers to context discovery questions.
    Integrates answers into the project's context.
    """
    project = db.query(Project).filter(Project.id == request.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    goal = project.goal or "achieving strategic objectives"
    
    # Parse existing context if available
    existing_context = None
    if project.context:
        try:
            existing_context = json.loads(project.context)
        except json.JSONDecodeError:
            pass
    
    # Integrate new answers
    new_context = await intelligence.integrate_answers(
        project.name, goal, existing_context, request.answers
    )
    
    # Save to database
    project.context = json.dumps(new_context)
    
    # Re-assess completeness
    completeness_check = await intelligence.discover_context(project.name, goal, new_context)
    project.context_completeness = completeness_check["context_completeness"]
    
    db.commit()
    db.refresh(project)
    
    return {
        "context": new_context,
        "context_completeness": project.context_completeness,
        "summary": completeness_check["summary"]
    }


# --- Batch Operations ---

@app.post("/api/ideas/batch", response_model=List[IdeaResponse])
async def create_ideas_batch(ideas: List[IdeaCreate], db: Session = Depends(get_db)):
    """Create multiple ideas at once (for wander results)."""
    db_ideas = []
    for idea in ideas:
        db_idea = Idea(
            project_id=idea.project_id,
            title=idea.title,
            description=idea.description,
            status=idea.status,
            parent_id=idea.parent_id,
            position_x=idea.position_x,
            position_y=idea.position_y,
        )
        db.add(db_idea)
        db_ideas.append(db_idea)
    
    db.commit()
    for idea in db_ideas:
        db.refresh(idea)
    
    return db_ideas
