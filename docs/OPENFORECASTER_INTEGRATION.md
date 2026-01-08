# OpenForecaster Integration Plan

## Goal
Add calibrated forecasting to CC4's validate endpoint using OpenForecaster-8B.

## Architecture
```
User submits hypothesis
       ↓
┌──────────────────────────────────┐
│  OpenForecaster-8B               │
│  → Returns calibrated probability │
│  (e.g., 0.73)                    │
└──────────────────────────────────┘
       ↓
┌──────────────────────────────────┐
│  Claude                          │
│  → Returns reasoning, risks,     │
│     next_steps                   │
└──────────────────────────────────┘
       ↓
Combined response to user
```

## Implementation Steps

### Step 1: Add HuggingFace dependency
In `backend/requirements.txt`, add:
```
huggingface_hub>=0.20.0
```

### Step 2: Create forecaster.py
New file: `backend/app/forecaster.py`

```python
"""
OpenForecaster integration for calibrated predictions.

Uses OpenForecaster-8B via HuggingFace Inference API.
Model: nikhilchandak/OpenForecaster-8B
"""

import os
from huggingface_hub import InferenceClient

# Initialize client
HF_TOKEN = os.getenv("HUGGINGFACE_TOKEN")
MODEL_ID = "nikhilchandak/OpenForecaster-8B"

client = InferenceClient(token=HF_TOKEN) if HF_TOKEN else None


async def get_calibrated_probability(hypothesis: str, context: str = None) -> float:
    """
    Get a calibrated probability from OpenForecaster.
    
    Args:
        hypothesis: The claim to evaluate
        context: Optional background context
        
    Returns:
        Probability between 0.0 and 1.0
    """
    if not client:
        # Fallback if no HF token - return None to skip
        return None
    
    # Format as forecasting question
    prompt = f"""Question: What is the probability that the following will be true or successful?

{hypothesis}

{f"Background context: {context}" if context else ""}

Provide your probability estimate as a decimal between 0 and 1, then explain briefly."""

    try:
        response = client.text_generation(
            model=MODEL_ID,
            prompt=prompt,
            max_new_tokens=512,
            temperature=0.7,
        )
        
        # Extract probability from response
        # OpenForecaster typically outputs probability first
        import re
        match = re.search(r'(\d+\.?\d*)', response)
        if match:
            prob = float(match.group(1))
            # Normalize if percentage
            if prob > 1:
                prob = prob / 100
            return min(max(prob, 0.0), 1.0)
        
        return None
        
    except Exception as e:
        print(f"OpenForecaster error: {e}")
        return None
```

### Step 3: Update intelligence.py

Modify the validate function to use both:

```python
from .forecaster import get_calibrated_probability

async def validate(hypothesis: str, context: Optional[str] = None) -> dict:
    """
    Tests a hypothesis using:
    1. OpenForecaster for calibrated probability
    2. Claude for reasoning and analysis
    """
    
    # Get calibrated probability from OpenForecaster (if available)
    calibrated_prob = await get_calibrated_probability(hypothesis, context)
    
    # Get reasoning from Claude
    context_section = f"\n\nAdditional context: {context}" if context else ""
    calibration_note = ""
    if calibrated_prob is not None:
        calibration_note = f"\n\nNote: A calibrated forecasting model estimates the probability at {calibrated_prob:.0%}. Factor this into your assessment."
    
    prompt = f"""Evaluate this hypothesis:

"{hypothesis}"{context_section}{calibration_note}

Be rigorous and intellectually honest. Consider:
1. What evidence or reasoning supports this?
2. What evidence or reasoning contradicts this?
3. What's unknown that would significantly affect the assessment?
4. What could go wrong if this is acted upon?

Return ONLY a JSON object, no other text:
{{
  "confidence": <number between 0.0 and 1.0>,
  "reasoning": "<your honest assessment in 2-4 sentences>",
  "risks": ["<risk 1>", "<risk 2>", ...],
  "next_steps": ["<what to do to increase confidence>", ...]
}}

{"If the calibrated probability differs significantly from your intuition, explain why in your reasoning." if calibrated_prob else ""}

Calibration guide:
- 0.0-0.3: Unlikely or deeply flawed
- 0.3-0.5: Possible but significant concerns
- 0.5-0.7: Reasonable but needs validation
- 0.7-0.85: Strong case with minor uncertainties
- 0.85-1.0: Very high confidence (rare)

Do NOT be agreeable. If it's a bad idea, say so clearly."""

    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )
    
    text = response.content[0].text.strip()
    
    # Handle markdown code blocks
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    
    result = json.loads(text)
    
    # Add calibrated probability to response if available
    if calibrated_prob is not None:
        result["calibrated_confidence"] = calibrated_prob
    
    return result
```

### Step 4: Update schema

In `backend/app/schemas.py`, update ValidateResponse:

```python
class ValidateResponse(BaseModel):
    confidence: float
    calibrated_confidence: Optional[float] = None  # From OpenForecaster
    reasoning: str
    risks: List[str]
    next_steps: List[str]
```

### Step 5: Update .env.example

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
HUGGINGFACE_TOKEN=hf_your-token-here
```

### Step 6: Update frontend to show calibrated confidence

In CanvasPage.tsx, when showing confidence, show both if available:

```tsx
{idea.confidence !== null && (
  <div className="text-right">
    <div className="text-2xl font-bold text-white">
      {Math.round(idea.confidence * 100)}%
    </div>
    <div className="text-xs text-slate-400">confidence</div>
    {idea.calibrated_confidence && (
      <div className="text-xs text-blue-400">
        {Math.round(idea.calibrated_confidence * 100)}% calibrated
      </div>
    )}
  </div>
)}
```

## Testing

1. Set HUGGINGFACE_TOKEN in backend/.env
2. Start backend: `uvicorn app.main:app --reload --port 8001`
3. Test endpoint:
```bash
curl -X POST http://localhost:8001/api/validate \
  -H "Content-Type: application/json" \
  -d '{"hypothesis": "Electric vehicles will represent 50% of new car sales in the US by 2030"}'
```

## Fallback Behavior

If HUGGINGFACE_TOKEN is not set or OpenForecaster fails:
- `calibrated_confidence` will be null
- Claude's confidence will still be returned
- System degrades gracefully

## Future Improvements

1. Run OpenForecaster locally with Ollama/vLLM for lower latency
2. Add retrieval (news context) for better predictions
3. Cache predictions for similar hypotheses
4. Track prediction accuracy over time
