import os
from warnings import filters
import arxiv
import asyncio
import requests
from dotenv import load_dotenv
from paperqa import Docs, Settings
from langchain.document_loaders import PyPDFLoader
from optimize_arxiv import optimize_query, search_arxiv
import re

load_dotenv()






os.makedirs("papers", exist_ok=True)

from fpdf import FPDF
import tempfile

def write_text_to_pdf(text: str, output_path: str):
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    for line in text.split('\n'):
        pdf.multi_cell(0, 10, line)
    pdf.output(output_path)


def extract_relevant_sections(pdf_path):

    loader = PyPDFLoader(pdf_path)
    pages = loader.load()

    section_text = ""

    for page in pages:
        content = page.page_content
        matches = re.findall(
            r"(?:limitations|future work|conclusion|further work|future directions)[\s\S]{0,1000}",
            content,
            re.IGNORECASE
        )
        section_text += "\n\n".join(matches)

    return section_text

def fetch_papers(query: str, max_results: int = 5):
    search = arxiv.Search(
        query=query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.SubmittedDate
    )
    client = arxiv.Client()
    return list(client.results(search))


def download_pdf(paper_dict):


    arxiv_url = paper_dict["url"]
    arxiv_id = arxiv_url.split("/")[-1]
    pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"
    file_path = f"papers/{arxiv_id}.pdf"

    if not os.path.exists(file_path):
        response = requests.get(pdf_url)
        with open(file_path, "wb") as f:
            f.write(response.content)
        print(f"✅ Downloaded {arxiv_id}")
    else:
        print(f"📄 Already downloaded {arxiv_id}")

    return file_path


async def analyze_papers(file_paths, questions):

    docs = Docs()
    for path in file_paths:
        await docs.aadd(path)

















    settings = Settings()
    settings.llm = "gpt-4.1"

    results = {}
    for question in questions:
        print(f"\n🔍 Asking: {question}")
        answer = await docs.aquery(question, settings=settings)
        results[question] = answer

    return results












async def main():

    field = input("Enter the research field you want to explore (for best results specifiy time-frame of papers, as well as author name if preferred): ")


    print("\n🔎 Searching arXiv...")
    query_str, filters = optimize_query(field)
    papers = search_arxiv(query_str, filters)
    file_paths = [download_pdf(paper) for paper in papers]






    questions = ["What future work or open research directions are suggested by the authors?"]


    print("\n📊 Analyzing papers for research gaps...")
    answers = await analyze_papers(file_paths, questions)


    print("\n📌 Research Insights:\n")
    for q, a in answers.items():
        print(f"--- {q} ---\n{a}\n")


    import json

    answers_str = {q: str(a) for q, a in answers.items()}
    with open("pipeline_output.json", "w") as f:
        json.dump(answers_str, f, indent=2)
    print("Results saved to pipeline_output.json")

if __name__ == "__main__":
    asyncio.run(main())