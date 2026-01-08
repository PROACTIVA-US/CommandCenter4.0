import { create } from 'zustand';
import { Project, Idea, Connection, WanderIdea, ValidationResult, PlanAction, DiscoverContextResult, AnswerContextResult } from './types';

const API_URL = '/api';

interface AppState {
  // Data
  projects: Project[];
  currentProject: Project | null;
  ideas: Idea[];
  connections: Connection[];
  
  // UI state
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchProjects: () => Promise<void>;
  createProject: (name: string, goal?: string) => Promise<Project>;
  selectProject: (project: Project) => void;
  
  fetchIdeas: (projectId: string) => Promise<void>;
  createIdea: (idea: Partial<Idea>) => Promise<Idea>;
  updateIdea: (id: string, updates: Partial<Idea>) => Promise<Idea>;
  deleteIdea: (id: string) => Promise<void>;
  
  fetchConnections: (projectId: string) => Promise<void>;
  createConnection: (sourceId: string, targetId: string, label?: string) => Promise<Connection>;
  deleteConnection: (id: string) => Promise<void>;
  
  // Intelligence
  wander: (context: string) => Promise<WanderIdea[]>;
  validate: (hypothesis: string, context?: string) => Promise<ValidationResult>;
  plan: (validatedIdea: string, constraints?: string) => Promise<PlanAction[]>;
  
  // Context Discovery
  discoverContext: () => Promise<DiscoverContextResult>;
  answerContext: (answers: Record<string, string>) => Promise<AnswerContextResult>;
  
  // Helpers
  setError: (error: string | null) => void;
  updateCurrentProject: (updates: Partial<Project>) => void;
}

export const useStore = create<AppState>((set, get) => ({
  projects: [],
  currentProject: null,
  ideas: [],
  connections: [],
  loading: false,
  error: null,
  
  setError: (error) => set({ error }),
  
  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/projects`);
      const projects = await res.json();
      set({ projects, loading: false });
    } catch (e) {
      set({ error: 'Failed to fetch projects', loading: false });
    }
  },
  
  createProject: async (name: string, goal?: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, goal }),
      });
      const project = await res.json();
      set((state) => ({ 
        projects: [project, ...state.projects], 
        currentProject: project,
        loading: false 
      }));
      return project;
    } catch (e) {
      set({ error: 'Failed to create project', loading: false });
      throw e;
    }
  },
  
  selectProject: (project) => {
    set({ currentProject: project, ideas: [], connections: [] });
    get().fetchIdeas(project.id);
    get().fetchConnections(project.id);
  },
  
  fetchIdeas: async (projectId: string) => {
    try {
      const res = await fetch(`${API_URL}/ideas?project_id=${projectId}`);
      const ideas = await res.json();
      set({ ideas });
    } catch (e) {
      set({ error: 'Failed to fetch ideas' });
    }
  },
  
  createIdea: async (idea: Partial<Idea>) => {
    const { currentProject } = get();
    if (!currentProject) throw new Error('No project selected');
    
    try {
      const res = await fetch(`${API_URL}/ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...idea, project_id: currentProject.id }),
      });
      const newIdea = await res.json();
      set((state) => ({ ideas: [...state.ideas, newIdea] }));
      return newIdea;
    } catch (e) {
      set({ error: 'Failed to create idea' });
      throw e;
    }
  },
  
  updateIdea: async (id: string, updates: Partial<Idea>) => {
    try {
      const res = await fetch(`${API_URL}/ideas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updated = await res.json();
      set((state) => ({
        ideas: state.ideas.map((i) => (i.id === id ? updated : i)),
      }));
      return updated;
    } catch (e) {
      set({ error: 'Failed to update idea' });
      throw e;
    }
  },
  
  deleteIdea: async (id: string) => {
    try {
      await fetch(`${API_URL}/ideas/${id}`, { method: 'DELETE' });
      set((state) => ({
        ideas: state.ideas.filter((i) => i.id !== id),
        connections: state.connections.filter(
          (c) => c.source_id !== id && c.target_id !== id
        ),
      }));
    } catch (e) {
      set({ error: 'Failed to delete idea' });
      throw e;
    }
  },
  
  fetchConnections: async (projectId: string) => {
    try {
      const res = await fetch(`${API_URL}/connections?project_id=${projectId}`);
      const connections = await res.json();
      set({ connections });
    } catch (e) {
      set({ error: 'Failed to fetch connections' });
    }
  },
  
  createConnection: async (sourceId: string, targetId: string, label?: string) => {
    try {
      const res = await fetch(`${API_URL}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_id: sourceId, target_id: targetId, label }),
      });
      const conn = await res.json();
      set((state) => ({ connections: [...state.connections, conn] }));
      return conn;
    } catch (e) {
      set({ error: 'Failed to create connection' });
      throw e;
    }
  },
  
  deleteConnection: async (id: string) => {
    try {
      await fetch(`${API_URL}/connections/${id}`, { method: 'DELETE' });
      set((state) => ({
        connections: state.connections.filter((c) => c.id !== id),
      }));
    } catch (e) {
      set({ error: 'Failed to delete connection' });
      throw e;
    }
  },
  
  // Intelligence
  wander: async (context: string) => {
    const { currentProject } = get();
    if (!currentProject) throw new Error('No project selected');
    
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/wander`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, project_id: currentProject.id }),
      });
      const data = await res.json();
      set({ loading: false });
      return data.ideas;
    } catch (e) {
      set({ error: 'Exploration failed', loading: false });
      throw e;
    }
  },
  
  validate: async (hypothesis: string, context?: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hypothesis, context }),
      });
      const result = await res.json();
      set({ loading: false });
      return result;
    } catch (e) {
      set({ error: 'Validation failed', loading: false });
      throw e;
    }
  },
  
  plan: async (validatedIdea: string, constraints?: string) => {
    const { currentProject } = get();
    if (!currentProject) throw new Error('No project selected');
    
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          validated_idea: validatedIdea, 
          project_id: currentProject.id,
          constraints 
        }),
      });
      const data = await res.json();
      set({ loading: false });
      return data.actions;
    } catch (e) {
      set({ error: 'Planning failed', loading: false });
      throw e;
    }
  },
  
  // Context Discovery
  discoverContext: async () => {
    const { currentProject } = get();
    if (!currentProject) throw new Error('No project selected');
    
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/discover-context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: currentProject.id }),
      });
      const data = await res.json();
      set({ loading: false });
      return data;
    } catch (e) {
      set({ error: 'Context discovery failed', loading: false });
      throw e;
    }
  },
  
  answerContext: async (answers: Record<string, string>) => {
    const { currentProject } = get();
    if (!currentProject) throw new Error('No project selected');
    
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/answer-context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          project_id: currentProject.id,
          answers 
        }),
      });
      const data = await res.json();
      
      // Update current project with new context
      set((state) => ({
        loading: false,
        currentProject: state.currentProject ? {
          ...state.currentProject,
          context: JSON.stringify(data.context),
          context_completeness: data.context_completeness,
        } : null,
        projects: state.projects.map((p) =>
          p.id === currentProject.id
            ? { ...p, context: JSON.stringify(data.context), context_completeness: data.context_completeness }
            : p
        ),
      }));
      
      return data;
    } catch (e) {
      set({ error: 'Failed to save context', loading: false });
      throw e;
    }
  },
  
  updateCurrentProject: (updates: Partial<Project>) => {
    set((state) => ({
      currentProject: state.currentProject
        ? { ...state.currentProject, ...updates }
        : null,
      projects: state.projects.map((p) =>
        p.id === state.currentProject?.id ? { ...p, ...updates } : p
      ),
    }));
  },
}));
