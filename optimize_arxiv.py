from __future__ import annotations
import re
from datetime import datetime
from typing import Optional, Set, Tuple
import spacy
import arxiv

# Load spaCy without NER
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

    return query, min_year

def search_arxiv(query: str, min_year: Optional[int], max_results: int = 5):
    search = arxiv.Search(
        query=query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.SubmittedDate
    )
    
    results = []
    for result in search.results():
        pub_year = result.published.year
        if min_year and pub_year < min_year:
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
    query_str, year_filter = optimize_query(user_q)
    
    print("\n Optimized arXiv Query:")
    print(query_str)
    
    print("\n Top Matching Papers:")
    papers = search_arxiv(query_str, year_filter)
    for i, paper in enumerate(papers, 1):
        print(f"\n{i}. {paper['title']}")
        print(f"   Authors: {paper['authors']}")
        print(f"   Published: {paper['published']}")
        print(f"   URL: {paper['url']}")
