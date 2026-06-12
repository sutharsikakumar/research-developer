import os
import arxiv
import asyncio
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings  # or HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.schema import Document

# For LLM QA (replace with your PaperQA or similar interface)
from paperqa import Docs, Settings

# 1. Download ~20 arXiv papers
def fetch_and_download_papers(query, max_results=20):
    os.makedirs("papers", exist_ok=True)
    search = arxiv.Search(query=query, max_results=max_results, sort_by=arxiv.SortCriterion.SubmittedDate)
    client = arxiv.Client()
    file_paths = []
    for result in client.results(search):
        arxiv_id = result.entry_id.split("/")[-1]
        pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"
        file_path = f"papers/{arxiv_id}.pdf"
        if not os.path.exists(file_path):
            try:
                import requests
                r = requests.get(pdf_url)
                with open(file_path, "wb") as f:
                    f.write(r.content)
                print(f"Downloaded {arxiv_id}")
            except Exception as e:
                print(f"Failed to download {arxiv_id}: {e}")
                continue
        file_paths.append(file_path)
    return file_paths

# 2. Index PDFs with LangChain
def index_pdfs(file_paths):
    docs = []
    for path in file_paths:
        try:
            loader = PyPDFLoader(path)
            pages = loader.load()
            for page in pages:
                docs.append(Document(page_content=page.page_content, metadata={"source": path}))
        except Exception as e:
            print(f"Failed to load {path}: {e}")
    # Split into chunks
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    split_docs = splitter.split_documents(docs)
    # Embed and index
    embeddings = OpenAIEmbeddings()  # or HuggingFaceEmbeddings()
    vectorstore = FAISS.from_documents(split_docs, embeddings)
    return vectorstore

# 3. Retrieve relevant PDFs for a question using hRAG
def retrieve_relevant_pdfs(vectorstore, question, top_k=5):
    # Retrieve top-k relevant chunks
    docs = vectorstore.similarity_search(question, k=top_k*2)
    # Get unique PDF paths, up to top_k
    seen = set()
    relevant_pdfs = []
    for doc in docs:
        src = doc.metadata["source"]
        if src not in seen:
            seen.add(src)
            relevant_pdfs.append(src)
        if len(relevant_pdfs) >= top_k:
            break
    return relevant_pdfs

# 4. Use PaperQA to answer the question using only relevant PDFs
async def answer_with_paperqa(relevant_pdfs, question):
    docs = Docs()
    for path in relevant_pdfs:
        await docs.aadd(path)
    settings = Settings(llm="gpt-4.1")
    answer = await docs.aquery(question, settings=settings)
    print("\n[Answer]\n", answer)

# 5. Main pipeline
async def main():
    query = input("Enter your arXiv search query: ")
    file_paths = fetch_and_download_papers(query, max_results=20)
    print(f"Downloaded {len(file_paths)} papers.")
    vectorstore = index_pdfs(file_paths)
    sample_question = input("Enter your research question: ")
    relevant_pdfs = retrieve_relevant_pdfs(vectorstore, sample_question, top_k=5)
    print(f"Using {len(relevant_pdfs)} most relevant papers for QA.")
    await answer_with_paperqa(relevant_pdfs, sample_question)

if __name__ == "__main__":
    asyncio.run(main())