import os
import arxiv
import asyncio
import requests
from dotenv import load_dotenv
from paperqa import Docs, Settings
from langchain.document_loaders import PyPDFLoader
from optimize_arxiv import optimize_query, search_arxiv
import re

load_dotenv()

### in the environment i need to include semantic scholar api, and crossref api. 
### Currently its only parsing the pdf file into text then asking llm to analyze and answer the question

# Create papers directory if not exists
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
    """Extract only the 'Limitations', 'Future Work', or 'Conclusion' sections."""
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
    """Download a paper PDF to local papers/ directory."""
    # Extract arxiv_id from the URL (e.g., 'http://arxiv.org/abs/1234.5678' -> '1234.5678')
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
    """Load PDFs into PaperQA Docs and run queries."""
    docs = Docs()
    for path in file_paths:
        await docs.aadd(path)

    # temp_paths = []

    # for path in file_paths:
    #     relevant_text = extract_relevant_sections(path)
    #     if relevant_text.strip():
    #         # Save text to temporary PDF file
    #         temp_pdf_path = os.path.join("papers", f"filtered_{os.path.basename(path)}.pdf")
    #         write_text_to_pdf(relevant_text, temp_pdf_path)
    #         temp_paths.append(temp_pdf_path)
    #         await docs.aadd(temp_pdf_path)
    #     else:
    #         print(f"⚠️ No relevant section found in {path}")


    

    settings = Settings()
    settings.llm = "gpt-4.1" 

    results = {}
    for question in questions:
        print(f"\n🔍 Asking: {question}")
        answer = await docs.aquery(question, settings=settings)
        results[question] = answer

    return results 

"""
    docs = Docs()
    await docs.aadd("sample_papers_machinelearning/ART20203995.pdf")
    settings = Settings()
    settings.llm = "gpt-3.5-turbo"
    ask = input("Ask a machine learning question: ")
    answer_response = await docs.aquery(ask, settings=settings)
    print(answer_response)
"""


async def main():
    # 1. Get research field
    field = input("Enter the research field you want to explore (e.g., 'graph neural networks'): ")

    # 2. Fetch and download papers
    print("\n🔎 Searching arXiv...")
    query_str, year_filter = optimize_query(field)
    papers = search_arxiv(query_str, year_filter)
    file_paths = [download_pdf(paper) for paper in papers]

    # 3. Define your questions; this are the prompt template that allows us to find gap in the research papers
    # questions = [
    #     "What are the recurring limitations mentioned in these papers?",
    #     "What future work or open research directions are suggested by the authors?"
    # ]
    questions = ["What future work or open research directions are suggested by the authors?"]

    # 4. Analyze with PaperQA
    print("\n📊 Analyzing papers for research gaps...")
    answers = await analyze_papers(file_paths, questions)

    # 5. Output results
    print("\n📌 Research Insights:\n")
    for q, a in answers.items():
        print(f"--- {q} ---\n{a}\n")

    # Save output as JSON for future_work.py
    import json
    # Convert all answers to strings for JSON serialization
    answers_str = {q: str(a) for q, a in answers.items()}
    with open("pipeline_output.json", "w") as f:
        json.dump(answers_str, f, indent=2)
    print("Results saved to pipeline_output.json")

if __name__ == "__main__":
    asyncio.run(main())