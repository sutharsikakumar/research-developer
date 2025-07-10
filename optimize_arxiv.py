from __future__ import annotations
import re
from datetime import datetime
from typing import Optional, Set, Tuple
import spacy

_nlp = spacy.load("en_core_web_sm", disable=["ner"])


CATEGORY_MAP = {
    "language model": "cs.CL",
    "large language model": "cs.CL",
    "reinforcement learning": "cs.LG",
    "machine learning": "cs.LG",
    "graph neural network": "cs.LG",
    "quantum": "quant-ph",
    "quantum computing": "quant-ph",
    "topology": "math.GN",
    "algebraic topology": "math.AT",
    "particle physics": "hep-ph",
    "astrophysics": "astro-ph",
}

def _noun_phrases(text: str) -> Set[str]:
    doc = _nlp(text.lower())
    return {
        " ".join(tok.text for tok in chunk).strip()
        for chunk in doc.noun_chunks
        if 1 <= len(chunk) <= 4
    }

def optimize_query(user_text: str) -> Tuple[str, Optional[int]]:
    phrases = _noun_phrases(user_text)
    categories = {CATEGORY_MAP[p] for p in phrases if p in CATEGORY_MAP}

    min_year: Optional[int] = None
    if m := re.search(r"(?:after|since)\s+(\d{4})", user_text, flags=re.I):
        min_year = int(m.group(1))
    elif "recent" in user_text.lower():
        min_year = datetime.utcnow().year - 3

    keyword_parts = [f'(ti:"{p}" OR abs:"{p}")' for p in phrases]
    query = " AND ".join(keyword_parts) if keyword_parts else ""
    if categories:
        cat_clause = " OR ".join(f"cat:{c}" for c in categories)
        query = f"{query} AND ({cat_clause})" if query else f"({cat_clause})"

    return query


if __name__ == "__main__":
    q = input("Ask a research question: ")
    print(optimise_query(q))
