from __future__ import annotations

import re
import difflib
from datetime import datetime
from typing import List, Optional, Set, Tuple

import spacy
import arxiv

_nlp = spacy.load("en_core_web_sm", disable=["ner"])

#update for potentially better results, not sure if it works as well as it could though
#some qualms remaining

CATEGORY_MAP = {
    "language model": "cs.CL",
    "large language model": "cs.CL",
    "reinforcement learning": "cs.LG",
    "machine learning": "cs.LG",
    "graph neural network": "cs.LG",
    "quantum computing": "quant-ph",
    "quantum": "quant-ph",
    "topology": "math.GN",
    "algebraic topology": "math.AT",
    "particle physics": "hep-ph",
    "astrophysics": "astro-ph",
}

SYNONYM_MAP = {
    "rl": "reinforcement learning",
    "gpt": "large language model",
    "llm": "large language model",
    "gans": "generative adversarial network",
    "adversarial network": "generative adversarial network",
    "gnn": "graph neural network",
}

SORT_MAP = {
    "relevance": arxiv.SortCriterion.Relevance,
    "date": arxiv.SortCriterion.SubmittedDate,
    "submitted": arxiv.SortCriterion.SubmittedDate,
    "updated": arxiv.SortCriterion.LastUpdatedDate,
}

def _noun_phrases(text: str) -> Set[str]:
    """Return lowercase noun phrases of length 1‑4 tokens."""
    doc = _nlp(text.lower())
    return {
        " ".join(tok.text for tok in chunk).strip()
        for chunk in doc.noun_chunks
        if 1 <= len(chunk) <= 4
    }

def _expand_synonyms(phrases: Set[str]) -> Set[str]:
    """Add known synonyms so they participate in the search."""
    expanded = set(phrases)
    for p in list(phrases):
        if p in SYNONYM_MAP:
            expanded.add(SYNONYM_MAP[p])
    return expanded

def _parse_author_filters(text: str) -> List[str]:
    """Extract author names following 'by' or 'author'."""
    author_patterns = [
        r"(?:papers?\s+)?by\s+([A-Z][A-Za-z\-']+(?:\s+[A-Z][A-Za-z\-']+)*)",
        r"author\s+([A-Z][A-Za-z\-']+(?:\s+[A-Z][A-Za-z\-']+)*)",
    ]

# i think using re.search

    authors: List[str] = []
    for pat in author_patterns:
        for m in re.finditer(pat, text, flags=re.I):
            name = m.group(1).strip()
            if name:
                authors.append(name)
    return authors

def _parse_date_filters(text: str) -> Tuple[Optional[int], Optional[int]]:
    """Return (min_year, max_year)."""
    text_l = text.lower()
    min_year = max_year = None

    if m := re.search(r"(?:after|since)\s+(\d{4})", text_l):
        min_year = int(m.group(1))

    if m := re.search(r"before\s+(\d{4})", text_l):
        max_year = int(m.group(1))

    if m := re.search(r"(?:between|from)\s+(\d{4})\s+(?:and|to)\s+(\d{4})", text_l):
        y1, y2 = sorted(int(x) for x in m.groups())
        min_year, max_year = y1, y2

    if "recent" in text_l and not min_year:
        min_year = datetime.utcnow().year - 3

    return min_year, max_year

def _extract_exclusions(text: str) -> List[str]:
    """Return list of phrases following 'not'."""
    exclusions = []
    for m in re.finditer(r"not\s+([a-zA-Z0-9\-\s]+)", text, flags=re.I):
        phrase = m.group(1).strip()
        if phrase:
            exclusions.append(phrase.lower())
    return exclusions

def _category_from_phrase(phrase: str) -> Optional[str]:
    """Fuzzy‑map phrase → arXiv category code."""
    if phrase in CATEGORY_MAP:
        return CATEGORY_MAP[phrase]
    # fuzzy match
    candidates = difflib.get_close_matches(phrase, CATEGORY_MAP.keys(), n=1, cutoff=0.8)
    if candidates:
        return CATEGORY_MAP[candidates[0]]
    return None

def _detect_sort(text: str) -> arxiv.SortCriterion:
    """Detect desired sorting."""
    for key, crit in SORT_MAP.items():
        if f"sort by {key}" in text.lower() or f"sorted by {key}" in text.lower():
            return crit
    # default date
    return arxiv.SortCriterion.SubmittedDate


def optimize_query(user_text: str):
    """Transform user text into query + filter dict for arXiv search."""
    phrases = _expand_synonyms(_noun_phrases(user_text))

    keyword_parts = [f'(ti:"{p}" OR abs:"{p}")' for p in phrases]

    categories = {_category_from_phrase(p) for p in phrases}
    categories.discard(None)
    if categories:
        cat_clause = " OR ".join(f"cat:{c}" for c in categories)
        keyword_parts.append(f'({cat_clause})')

    authors = _parse_author_filters(user_text)
    author_clause = " OR ".join(f'au:"{a}"' for a in authors)
    if author_clause:
        keyword_parts.append(f'({author_clause})')

    for ex in _extract_exclusions(user_text):
        keyword_parts.append(f'NOT (ti:"{ex}" OR abs:"{ex}")')

    query = " AND ".join(keyword_parts) if keyword_parts else ""

    min_year, max_year = _parse_date_filters(user_text)

    sort_by = _detect_sort(user_text)

    filters = {
        "min_year": min_year,
        "max_year": max_year,
        "sort": sort_by,
        "max_results": 10,
    }
    return query, filters

def search_arxiv(query: str, filters: dict):
    """Run search and return structured results list."""
    max_results = filters.get("max_results", 10)
    sort_by = filters.get("sort", arxiv.SortCriterion.SubmittedDate)

    search = arxiv.Search(
        query=query or "all:", 
        max_results=max_results,
        sort_by=sort_by,
    )

    results = []
    for result in search.results():
        pub_year = result.published.year
        min_y = filters.get("min_year")
        max_y = filters.get("max_year")
        if min_y and pub_year < min_y:
            continue
        if max_y and pub_year > max_y:
            continue
        results.append({
            "title": result.title,
            "authors": ", ".join(str(a) for a in result.authors),
            "published": result.published.date(),
            "url": result.entry_id
        })
    return results

if __name__ == "__main__":
    user_q = input("Ask a research question: ")
    query_str, filt = optimize_query(user_q)

    print("\n Optimized arXiv Query:")
    print(query_str)
    print("\n Filters:")
    print(filt)

    print("\n Top Matching Papers:")
    for i, paper in enumerate(search_arxiv(query_str, filt), 1):
        print(f"\n{i}. {paper['title']}")
        print(f"   Authors: {paper['authors']}")
        print(f"   Published: {paper['published']}")
        print(f"   URL: {paper['url']}")
