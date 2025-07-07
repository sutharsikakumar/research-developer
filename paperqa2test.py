import asyncio
from dotenv import load_dotenv

load_dotenv()

from paperqa import Settings, Docs, ask

async def main():
    docs = Docs()
    await docs.aadd("sample_papers_machinelearning/ART20203995.pdf")
    settings = Settings()
    settings.llm = "gpt-3.5-turbo"
    ask = input("Ask a machine learning question: ")
    answer_response = await docs.aquery(ask, settings=settings)
    print(answer_response)

if __name__ == "__main__":
    asyncio.run(main())
