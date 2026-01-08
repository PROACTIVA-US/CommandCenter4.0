// API Types

export interface Project {
  id: string;
  name: string;
  goal: string | null;
  created_at: string;
}

export type IdeaStatus = 'resonance' | 'idea' | 'hypothesis' | 'task';

export interface Idea {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: IdeaStatus;
  confidence: number | null;
  calibrated_confidence: number | null;  // From OpenForecaster
  validation_reasoning: string | null;
  parent_id: string | null;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  source_id: string;
  target_id: string;
  label: string | null;
  created_at: string;
}

export interface WanderIdea {
  title: string;
  description: string;
  why_relevant: string;
}

export interface ValidationResult {
  confidence: number;
  calibrated_confidence: number | null;  // From OpenForecaster
  reasoning: string;
  risks: string[];
  next_steps: string[];
}

export interface PlanAction {
  action: string;
  why: string;
  effort: 'low' | 'medium' | 'high';
  dependencies: string[];
}

// UI Types

export interface NodeData {
  idea: Idea;
  onEdit: (idea: Idea) => void;
  onDelete: (id: string) => void;
  onValidate: (idea: Idea) => void;
  onCrystallize: (idea: Idea, newStatus: IdeaStatus) => void;
  onSendToBuild: (idea: Idea) => void;
}
