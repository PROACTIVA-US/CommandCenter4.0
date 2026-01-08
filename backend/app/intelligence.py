"""
Strategic Intelligence for CC4.

Three prompts. No complex agents, no multi-model validation, no RLM.
Just well-crafted prompts that work.

Now enhanced with OpenForecaster for calibrated probabilities.
"""

import json
import os
from typing import List, Optional

import anthropic
from dotenv import load_dotenv

from .forecaster import get_calibrated_probability

# Load environment variables
load_dotenv()

# Initialize client
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

MODEL = "claude-sonnet-4-20250514"


async def wander(context: str, goal: str, project_context: Optional[dict] = None) -> List[dict]:
    """
    Explores a problem space, returns nascent ideas.
    
    Args:
        context: What the user wants to explore
        goal: The project goal (e.g., "100M ARR by 2027")
        project_context: Structured context about the project (from discovery)
    
    Returns:
        List of {title, description, why_relevant}
    """
    # Build context section if we have project context
    project_info = ""
    if project_context:
        project_info = f"""\n\nWhat I know about this project:
{json.dumps(project_context, indent=2)}\n
Use this context to make your suggestions more specific and actionable.
"""
    
    prompt = f"""You are a strategic advisor helping identify paths to: {goal}{project_info}

The user wants to explore: {context}

Generate 3-5 nascent ideas worth investigating. For each:
- title: concise name (3-6 words)
- description: 2-3 sentences on what this is
- why_relevant: one sentence on how it connects to the goal

Be creative but grounded. These are starting points for exploration, not complete solutions.
Look for non-obvious angles, underexplored opportunities, and strategic leverage points.

Return ONLY a JSON array, no other text:
[{{"title": "...", "description": "...", "why_relevant": "..."}}]"""

    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )
    
    text = response.content[0].text.strip()
    
    # Handle potential markdown code blocks
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    
    return json.loads(text)


async def validate(hypothesis: str, context: Optional[str] = None) -> dict:
    """
    Tests a hypothesis using:
    1. OpenForecaster for calibrated probability (if available)
    2. Claude for reasoning and analysis
    
    Args:
        hypothesis: The claim to validate
        context: Optional additional context
    
    Returns:
        {confidence: 0.0-1.0, calibrated_confidence: 0.0-1.0 or None, 
         reasoning: str, risks: [str], next_steps: [str]}
    """
    # Get calibrated probability from OpenForecaster (if available)
    calibrated_prob = await get_calibrated_probability(hypothesis, context)
    
    # Build prompt for Claude
    context_section = f"\n\nAdditional context: {context}" if context else ""
    
    calibration_note = ""
    if calibrated_prob is not None:
        calibration_note = f"""

Note: A calibrated forecasting model (OpenForecaster-8B, trained on 52k forecasting questions) 
estimates the probability of this hypothesis at {calibrated_prob:.0%}. 
This model has been validated to be well-calibrated - when it says X%, it's right about X% of the time.
Factor this into your assessment, but also provide your own analysis."""
    
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
    
    # Handle potential markdown code blocks
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    
    result = json.loads(text)
    
    # Add calibrated probability to response if available
    result["calibrated_confidence"] = calibrated_prob
    
    return result


async def discover_context(project_name: str, goal: str, known_context: Optional[dict] = None) -> dict:
    """
    Given a project and what's already known, identifies gaps and generates
    questions that would most improve the system's ability to help.
    
    This inverts the usual flow: instead of the user telling the system things,
    the system asks the user things.
    
    Args:
        project_name: Name of the project
        goal: The stated goal (e.g., "10MM ARR by 2027")
        known_context: What we already know (dict or None)
    
    Returns:
        {
            questions: [{question, why_it_matters, priority, category}],
            context_completeness: 0.0-1.0,
            summary: "What we know so far"
        }
    """
    context_json = json.dumps(known_context, indent=2) if known_context else "Nothing yet."
    
    prompt = f"""You are a strategic advisor preparing to help with: {project_name}
Stated goal: {goal}

What I currently know about this project:
{context_json}

Your job is to identify the MOST IMPORTANT gaps in my knowledge that would improve my ability to give good strategic advice.

Think about what a world-class strategic consultant would need to know before advising on a path to {goal}.

Categories to consider:
- **product**: What is it? Who uses it? What problem does it solve?
- **market**: Competitors? Market size? Positioning?
- **team**: Who's building this? What are their strengths/gaps?
- **finance**: Current revenue? Runway? Funding situation?
- **strategy**: Current approach? What's been tried? Key constraints?

Generate 3-5 questions that would MOST improve my ability to help. Prioritize:
1. Questions I absolutely MUST know to give useful advice (priority: high)
2. Questions that would significantly improve advice quality (priority: medium)
3. Questions that would add helpful nuance (priority: low)

Do NOT ask questions if the answer is already in the known context.
Do NOT ask vague questions. Be specific and actionable.
DO ask questions that unlock strategic insight.

Also assess: Given what I know, how prepared am I to give good advice? (0.0 = know nothing, 1.0 = know everything important)

Return ONLY a JSON object:
{{
  "questions": [
    {{"question": "...", "why_it_matters": "...", "priority": "high|medium|low", "category": "product|market|team|finance|strategy"}}
  ],
  "context_completeness": <0.0-1.0>,
  "summary": "<1-2 sentence summary of what I currently know>"
}}"""

    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )
    
    text = response.content[0].text.strip()
    
    # Handle potential markdown code blocks
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    
    return json.loads(text)


async def integrate_answers(project_name: str, goal: str, existing_context: Optional[dict], new_answers: dict) -> dict:
    """
    Takes user's answers to discovery questions and integrates them into
    a structured context object.
    
    Args:
        project_name: Name of the project
        goal: The stated goal
        existing_context: What we already knew
        new_answers: {question: answer} pairs from the user
    
    Returns:
        Updated context dict with new information integrated
    """
    existing_json = json.dumps(existing_context, indent=2) if existing_context else "{}"
    answers_json = json.dumps(new_answers, indent=2)
    
    prompt = f"""You are organizing information about a project for a strategic intelligence system.

Project: {project_name}
Goal: {goal}

Existing context:
{existing_json}

New answers from user:
{answers_json}

Your job is to merge the new answers into a clean, structured context object.

Rules:
- Preserve all existing context unless explicitly contradicted
- Extract key facts from answers (don't just copy verbatim)
- Use consistent field names
- Group related information
- Keep it concise but complete

Suggested structure (adapt as needed):
{{
  "product": {{
    "description": "...",
    "target_customer": "...",
    "key_value_prop": "..."
  }},
  "market": {{
    "competitors": [...],
    "market_size": "...",
    "positioning": "..."
  }},
  "team": {{
    "size": ...,
    "key_strengths": [...],
    "gaps": [...]
  }},
  "finance": {{
    "current_revenue": "...",
    "runway": "...",
    "funding": "..."
  }},
  "strategy": {{
    "current_approach": "...",
    "constraints": [...],
    "what_worked": [...],
    "what_didnt": [...]
  }}
}}

Return ONLY the merged JSON context object, no other text."""

    response = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}]
    )
    
    text = response.content[0].text.strip()
    
    # Handle potential markdown code blocks
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    
    return json.loads(text)


async def plan(validated_idea: str, goal: str, constraints: Optional[str] = None) -> List[dict]:
    """
    Converts validated idea into actionable path.
    
    Args:
        validated_idea: The idea that passed validation
        goal: The project goal
        constraints: Optional constraints (time, budget, resources)
    
    Returns:
        List of {action, why, effort, dependencies}
    """
    constraints_section = f"\nConstraints: {constraints}" if constraints else ""
    
    prompt = f"""Create an action plan to execute this idea.

Goal: {goal}
Validated idea: {validated_idea}{constraints_section}

Generate 3-7 concrete next actions. For each:
- action: specific, measurable step (starts with a verb)
- why: one sentence on how it advances toward the goal
- effort: "low" (< 1 day), "medium" (1-5 days), or "high" (> 5 days)
- dependencies: list of actions that must happen first (empty list if none)

Requirements:
- First action should be doable THIS WEEK
- Actions should be concrete, not vague ("Talk to 5 potential customers" not "Do market research")
- Order by priority/sequence

Return ONLY a JSON array, no other text:
[{{"action": "...", "why": "...", "effort": "low|medium|high", "dependencies": [...]}}]"""

    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )
    
    text = response.content[0].text.strip()
    
    # Handle potential markdown code blocks
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    
    return json.loads(text)
