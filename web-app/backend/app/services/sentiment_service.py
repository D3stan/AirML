from __future__ import annotations

from typing import Any


def sentiment_analysis(payload: dict[str, Any]) -> dict[str, Any]:
    text = str(payload.get("text", ""))
    positive_words = {"great", "excellent", "clean", "perfect", "amazing", "good"}
    negative_words = {"bad", "dirty", "poor", "noisy", "terrible", "broken"}
    tokens = {token.strip(".,!?;:").lower() for token in text.split()}
    score = len(tokens & positive_words) - len(tokens & negative_words)

    if score > 0:
        label = "positive"
    elif score < 0:
        label = "negative"
    else:
        label = "neutral"

    return {"sentiment": label, "score": score}
