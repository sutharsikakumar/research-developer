import arxiv

def fetch_papers(query: str, max_results: int = 5):
    search = arxiv.Search(
        query=query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.SubmittedDate
    )

    client = arxiv.Client()
    papers = []

    for result in client.results(search):
        papers.append({
            "title": result.title,
            "summary": result.summary,
            "arxiv_id": result.get_short_id(),
            "pdf_url": result.pdf_url,
            "published": result.published
        })

    return papers

if __name__ == "__main__":
    query = input("Enter arXiv search query: ")
    results = fetch_papers(query)

    for i, paper in enumerate(results, 1):
        print(f"- Paper {i}: {paper['title']}")
        print(f"- Published: {paper['published']}")
        print(f"- PDF: {paper['pdf_url']}")
        print(f"- Summary: {paper['summary'][:500]}...")
