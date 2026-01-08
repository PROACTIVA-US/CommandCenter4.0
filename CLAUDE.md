# CLAUDE.md

Instructions for AI assistants working on this codebase.

## Project Overview

CommandCenter 4.0 is a strategic intelligence tool. It helps users discover paths to their goals (like 100M ARR) through a loop of DISCOVER → VALIDATE → IMPROVE.

**This is NOT a dev tool.** Building things is delegated to AutoClaude.

## Architecture

- **Backend**: FastAPI + SQLite (port 8001)
- **Frontend**: React + React Flow + Tailwind (port 3001)
- **AI**: Claude API for reasoning + OpenForecaster-8B for calibrated probabilities

## Key Commands

```bash
# Backend
cd backend && source venv/bin/activate
uvicorn app.main:app --reload --port 8001

# Frontend
cd frontend && npm run dev

# Database reset
rm backend/cc4.db && uvicorn app.main:app --reload --port 8001
```

## Code Style

- Keep it simple. No premature abstraction.
- SQLite is fine. Don't suggest Postgres.
- Three AI prompts (wander, validate, plan). Don't add more.
- Four node types. Don't add more without explicit request.

## File Structure

```
backend/
  app/
    main.py          # FastAPI app + routes
    models.py        # SQLAlchemy models
    database.py      # DB connection
    intelligence.py  # The three AI prompts (wander, validate, plan)
    forecaster.py    # OpenForecaster integration for calibrated probabilities
    schemas.py       # Pydantic schemas

frontend/
  src/
    App.tsx
    store.ts         # Zustand state management
    types.ts         # TypeScript types
    pages/
      IdeasPage.tsx    # Entry point with 3 buttons
      CanvasPage.tsx   # VISLZR mind map
      BuildPage.tsx    # AutoClaude embed
    components/
      IdeaNode.tsx     # Custom React Flow node
```

## The Four Prompts

All strategic intelligence lives in `backend/app/intelligence.py`:

1. **discover_context()** - Identifies gaps in knowledge, generates questions to fill them
2. **wander()** - Explores a space, returns nascent ideas (now context-aware!)
3. **validate()** - Tests a hypothesis, returns confidence (now with OpenForecaster!)
4. **plan()** - Converts validated idea to action steps

## Context Discovery

The system can now prompt the user for context instead of the other way around.

- **Flow**: Create project → System asks strategic questions → Answers become structured context
- **Progressive**: Each Q&A session improves context_completeness (0.0-1.0)
- **Integrated**: Context automatically enhances wander() results
- **Endpoints**: `/api/discover-context`, `/api/answer-context`
- **Schema**: Project.context stores JSON, Project.context_completeness tracks depth

## OpenForecaster Integration

The `validate()` function now uses two models:
- **OpenForecaster-8B** → calibrated probability (when it says 70%, it's right ~70% of the time)
- **Claude** → reasoning, risks, next steps

This gives you the best of both worlds: calibrated numbers AND useful analysis.

To enable OpenForecaster, set `HUGGINGFACE_TOKEN` in `backend/.env`.
Without it, the system gracefully falls back to Claude-only validation.

## Don't Add

- Complex memory systems (6-layer, tiered, provenance)
- Multi-model validation beyond OpenForecaster (no AI Arena)
- FedRAMP compliance infrastructure
- Billing/commercial features
- RLM or recursive decomposition
- Any "machinery" visible to users

## Do Add

- Bug fixes
- UX improvements
- Performance optimizations
- Better prompts (if they demonstrably work better)

## Testing

```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm test
```

## Environment Variables

```bash
# backend/.env
ANTHROPIC_API_KEY=sk-ant-...
HUGGINGFACE_TOKEN=hf_...  # Optional, enables OpenForecaster

# frontend/.env
VITE_API_URL=http://localhost:8001
```
