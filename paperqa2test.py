from dotenv import load_dotenv

load_dotenv()

from paperqa import Settings, ask

if __name__ == "__main__":
    query = input("Ask a machine learning question: ")
    answer_response = ask(
        query,
        settings=Settings(temperature=0.5, paper_directory="sample_papers_machinelearning/"),
    )
    #print(answer_response)
