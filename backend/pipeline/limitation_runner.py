import os, json, re, asyncio, requests, arxiv
from pathlib import Path
from dotenv import load_dotenv
from paperqa import Docs, Settings
from langchain.document_loaders import PyPDFLoader
from optimize_arxiv import optimize_query, search_arxiv
from fpdf import FPDF

load_dotenv()
os.makedirs("papers", exist_ok=True)



def _write_text_to_pdf(text: str, output_path: str):
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    for line in text.split("\n"):
        pdf.multi_cell(0, 10, line)
    pdf.output(output_path)


def _extract_relevant_sections(pdf_path: str) -> str:
    """Return only limitation / future‑work / conclusion text."""
    loader = PyPDFLoader(pdf_path)
    section_text = ""
    for page in loader.load():
        matches = re.findall(
            r"(?:limitations|future work|conclusion|further work|future directions)"
            r"[\s\S]{0,1000}",
            page.page_content,
            re.IGNORECASE,
        )
        section_text += "\n\n".join(matches)
    return section_text


def _download_pdf(arxiv_url: str) -> str:
    """Download and cache to papers/<arxiv_id>.pdf."""
    arxiv_id = arxiv_url.split("/")[-1]
    pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"
    file_path = f"papers/{arxiv_id}.pdf"

    if not Path(file_path).exists():
        resp = requests.get(pdf_url, timeout=30)
        resp.raise_for_status()
        Path(file_path).write_bytes(resp.content)
    return file_path


async def _analyze(file_paths: list[str], questions: list[str]) -> dict[str, str]:
    docs = Docs()
    for p in file_paths:
        await docs.aadd(p)

    settings = Settings(llm="gpt-4.1")
    answers: dict[str, str] = {}
    for q in questions:
        res = await docs.aquery(q, settings=settings)
        answers[q] = str(res)
    return answers



async def run(prompt: str, *, max_results: int = 5) -> dict:
    """
    Top‑level coroutine used by Celery / FastAPI.

    Args:
        prompt: free‑text field/topic query
        max_results: arXiv papers to fetch

    Returns: dict with keys answers / pdf_paths / query
    """
    query_str, filters = optimize_query(prompt)
    papers = search_arxiv(query_str, filters)[:max_results]

    pdf_paths = [_download_pdf(p["url"]) for p in papers]
    questions = [
        "What future work or open research directions are suggested by the authors?"
    ]
    answers = await _analyze(pdf_paths, questions)

    Path("pipeline_output.json").write_text(json.dumps(answers, indent=2))

    return {"answers": answers, "pdf_paths": pdf_paths, "query": query_str}


if __name__ == "__main__":
    asyncio.run(run(input("Research field (incl. timeframe, author, etc.): ")))
