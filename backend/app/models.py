"""SQLAlchemy models for CC4."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from .database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Project(Base):
    """A project with a goal (e.g., "100M ARR by 2027")."""
    
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    goal = Column(Text)  # e.g., "100M ARR by 2027"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    ideas = relationship("Idea", back_populates="project", cascade="all, delete-orphan")


class Idea(Base):
    """
    An idea that crystallizes through stages:
    resonance → idea → hypothesis → task
    """
    
    __tablename__ = "ideas"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="resonance")  # resonance | idea | hypothesis | task
    confidence = Column(Float)  # 0.0-1.0, Claude's assessment
    calibrated_confidence = Column(Float)  # 0.0-1.0, from OpenForecaster
    validation_reasoning = Column(Text)  # Why this confidence level
    parent_id = Column(String, ForeignKey("ideas.id"))  # Crystallization lineage
    position_x = Column(Float, default=0)
    position_y = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    project = relationship("Project", back_populates="ideas")
    parent = relationship("Idea", remote_side=[id], backref="children")
    
    # Connections where this idea is the source
    outgoing_connections = relationship(
        "Connection", 
        foreign_keys="Connection.source_id",
        back_populates="source",
        cascade="all, delete-orphan"
    )
    
    # Connections where this idea is the target
    incoming_connections = relationship(
        "Connection",
        foreign_keys="Connection.target_id", 
        back_populates="target",
        cascade="all, delete-orphan"
    )


class Connection(Base):
    """A connection between two ideas on the canvas."""
    
    __tablename__ = "connections"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    source_id = Column(String, ForeignKey("ideas.id"), nullable=False)
    target_id = Column(String, ForeignKey("ideas.id"), nullable=False)
    label = Column(String)  # Optional edge label
    created_at = Column(DateTime, default=datetime.utcnow)
    
    source = relationship("Idea", foreign_keys=[source_id], back_populates="outgoing_connections")
    target = relationship("Idea", foreign_keys=[target_id], back_populates="incoming_connections")
