# CommandCenter 4.0 — Simplified Spec

**What it is**: A strategic intelligence tool that helps you discover paths to 100M ARR.

**What it is not**: A dev tool (that's AutoClaude's job).

---

## The Loop

Everything serves this:

```
DISCOVER → VALIDATE → IMPROVE
   ↑                      │
   └──────────────────────┘
```

- **DISCOVER**: Explore problem spaces, find opportunities, generate ideas
- **VALIDATE**: Test hypotheses against reality (not AI consensus)
- **IMPROVE**: Refine based on what you learned, repeat

---

## Three Tabs

### 1. Ideas Tab (`/`)

The entry point. Three buttons:

| Button | What Happens |
|--------|--------------|
| **"I want to explore..."** | Opens text input → Wander agent explores the space → Returns nascent ideas to canvas |
| **"I have an idea"** | Opens form → Captures idea → Adds to canvas as Idea node |
| **"I need something built"** | Goes to Build tab (AutoClaude) |

### 2. Canvas Tab (`/canvas`) — VISLZR

A mind map where ideas crystallize.

**Node Types** (4 total):

| Type | Visual | Meaning |
|------|--------|---------|
| **Resonance** | Soft glow, diffuse edges | Nascent, unexplored |
| **Idea** | Solid circle | Captured, needs validation |
| **Hypothesis** | Diamond | Testable claim extracted from idea |
| **Task** | Square | Ready to build |

**Crystallization Flow**:
```
Resonance → Idea → Hypothesis → Task
  (soft)   (solid)  (diamond)   (square)
```

### 3. Build Tab (`/build`)

Links to AutoClaude for execution.

---

## Data Model

Three tables: `projects`, `ideas`, `connections`

---

## Strategic Intelligence

Three prompts in `backend/app/intelligence.py`:

1. **wander()** - Explores a space, returns nascent ideas
2. **validate()** - Tests a hypothesis, returns confidence
3. **plan()** - Converts validated idea to action steps

---

## Tech Stack

- **Backend**: FastAPI + SQLite
- **Frontend**: React + React Flow + Tailwind
- **AI**: Claude API direct

---

## What's NOT in V1

- Revenue dashboard
- Multi-user
- Complex memory systems
- FedRAMP compliance
- Billing
- AI Arena / multi-model validation
- RLM / 6-layer memory

---

## Philosophy

> "It's not a tool you use. It's a space you inhabit."

But first, it has to work. Elegance comes from simplicity.
