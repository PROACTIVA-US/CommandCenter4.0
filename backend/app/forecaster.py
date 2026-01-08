"""
OpenForecaster integration for calibrated predictions.

Uses OpenForecaster-8B via HuggingFace Inference API.
Model: nikhilchandak/OpenForecaster-8B

This model is trained specifically for forecasting and provides
calibrated probabilities - when it says 70%, it's right ~70% of the time.
"""

import os
import re
from typing import Optional

from huggingface_hub import InferenceClient

# Initialize client
HF_TOKEN = os.getenv("HUGGINGFACE_TOKEN")
MODEL_ID = "nikhilchandak/OpenForecaster-8B"


def get_client() -> Optional[InferenceClient]:
    """Get HuggingFace client if token is available."""
    if HF_TOKEN:
        return InferenceClient(token=HF_TOKEN)
    return None


async def get_calibrated_probability(hypothesis: str, context: Optional[str] = None) -> Optional[float]:
    """
    Get a calibrated probability from OpenForecaster.
    
    Args:
        hypothesis: The claim to evaluate
        context: Optional background context
        
    Returns:
        Probability between 0.0 and 1.0, or None if unavailable
    """
    client = get_client()
    if not client:
        return None
    
    # Format as forecasting question (OpenForecaster style)
    context_part = f"\n\nBackground: {context}" if context else ""
    
    prompt = f"""Question: What is the probability that the following hypothesis is true or will succeed?

Hypothesis: {hypothesis}{context_part}

Resolution Criteria: The hypothesis is considered resolved TRUE if the stated outcome occurs or the claim is validated.

Provide your probability estimate as a decimal between 0.0 and 1.0.
Think step by step about the factors that support and oppose this hypothesis.
End with your final probability on a new line as just the number."""

    try:
        response = client.text_generation(
            model=MODEL_ID,
            prompt=prompt,
            max_new_tokens=1024,
            temperature=0.3,  # Lower temp for more consistent probabilities
            do_sample=True,
        )
        
        # Extract probability from response
        # Look for decimal numbers, prefer the last one (final answer)
        matches = re.findall(r'\b(0\.\d+|1\.0|1\.00?)\b', response)
        
        if matches:
            # Take the last match (usually the final probability)
            prob = float(matches[-1])
            return min(max(prob, 0.0), 1.0)
        
        # Try percentage format
        pct_matches = re.findall(r'(\d{1,3})%', response)
        if pct_matches:
            prob = float(pct_matches[-1]) / 100
            return min(max(prob, 0.0), 1.0)
        
        return None
        
    except Exception as e:
        print(f"OpenForecaster error: {e}")
        return None


async def get_forecaster_reasoning(hypothesis: str, context: Optional[str] = None) -> Optional[str]:
    """
    Get full reasoning from OpenForecaster (optional, for debugging).
    
    Returns the raw model output with thinking process.
    """
    client = get_client()
    if not client:
        return None
    
    context_part = f"\n\nBackground: {context}" if context else ""
    
    prompt = f"""Question: What is the probability that the following hypothesis is true or will succeed?

Hypothesis: {hypothesis}{context_part}

Think step by step about:
1. Key factors supporting this hypothesis
2. Key factors opposing this hypothesis  
3. What information would change your assessment
4. Your final probability estimate (0.0 to 1.0)"""

    try:
        response = client.text_generation(
            model=MODEL_ID,
            prompt=prompt,
            max_new_tokens=1024,
            temperature=0.3,
            do_sample=True,
        )
        return response
    except Exception as e:
        print(f"OpenForecaster error: {e}")
        return None
