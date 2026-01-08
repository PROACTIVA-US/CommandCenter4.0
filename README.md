# CommandCenter 4.0

A strategic intelligence tool for discovering paths to 100M ARR.

## The Loop

```
DISCOVER → VALIDATE → IMPROVE
```

## What's Different

**CC4 is simple.** After CC2's 43 services and CC3's 5,760-line spec, we stripped it down to ~1,000 lines that actually work.

**Calibrated predictions.** Uses [OpenForecaster-8B](https://huggingface.co/nikhilchandak/OpenForecaster-8B) for statistically calibrated confidence scores. When it says 70%, it's right ~70% of the time.

**Three tabs, three prompts, four node types.** That's it.

## Quick Start

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY and optionally HUGGINGFACE_TOKEN

uvicorn app.main:app --reload --port 8001

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:3001

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CC4                                  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  IDEAS TAB  │  │   CANVAS    │  │  BUILD TAB  │    │
│  │  (entry)    │  │  (VISLZR)   │  │ (AutoClaude)│    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │            STRATEGIC INTELLIGENCE               │  │
│  │  Wander (explore) • Validate (test) • Plan      │  │
│  │         ↓                                        │  │
│  │  OpenForecaster-8B for calibrated probabilities │  │
│  │  Claude for reasoning, risks, next steps        │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │              SQLite Database                    │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Three Tabs

1. **Ideas Tab** - Entry point with 3 paths: Explore, Capture Idea, Build
2. **Canvas** - VISLZR mind map where ideas crystallize
3. **Build** - AutoClaude integration for execution

## Node Types

| Type | Shape | Meaning |
|------|-------|---------|
| Resonance | Soft glow | Nascent, unexplored |
| Idea | Circle | Captured, needs validation |
| Hypothesis | Diamond | Testable claim |
| Task | Square | Ready to build |

## Validation

When you validate an idea, you get two confidence scores:

- **Claude** - Reasoning-based assessment with risks and next steps
- **Calibrated** - From OpenForecaster-8B, trained on 52k forecasting questions

The calibrated score is statistically meaningful. Set `HUGGINGFACE_TOKEN` in `.env` to enable it.

## Tech Stack

- **Backend**: FastAPI + SQLite
- **Frontend**: React + React Flow + Tailwind
- **AI**: Claude API + OpenForecaster-8B (via HuggingFace)

## Philosophy

> "It's not a tool you use. It's a space you inhabit."

But first, it has to work. Elegance comes from simplicity.

## Links

- [OpenForecaster Paper](https://arxiv.org/abs/2512.25070)
- [OpenForecaster Model](https://huggingface.co/nikhilchandak/OpenForecaster-8B)
- [OpenForesight Dataset](https://huggingface.co/datasets/nikhilchandak/OpenForesight)
