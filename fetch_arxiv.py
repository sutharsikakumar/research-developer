from __future__ import annotations
import arxiv
from optimize_arxiv import optimize_query


def fetch_papers_chat(user_text: str, max_results: int = 5):
    """Return a list of dicts describing arXiv papers relevant to *user_text*."""
    query, min_year = optimize_query(user_text)

    search = arxiv.Search(
        query=query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.Relevance,
    )

    client = arxiv.Client()
    papers = []

    for r in client.results(search):
        if min_year and r.published.year < min_year:
            continue
        papers.append({
            "title": r.title,
            "arxiv_id": r.get_short_id(),
            "published": r.published,
            "pdf_url": r.pdf_url,
            "summary": r.summary,
        })

    return papers


if __name__ == "__main__":
    question = input("Ask me a research question: ")
    hits = fetch_papers_chat(question, max_results=10)

    if not hits:
        print("No papers matched your query.")
    else:
        for i, p in enumerate(hits, 1):
            pub_date = p["published"].date()
            print(f"{i}. {p['title']} ({pub_date})")
            print(f"arXiv:{p['arxiv_id']} and PDF:{p['pdf_url']}\n")