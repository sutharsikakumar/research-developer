import asyncio, json, textwrap
from paperqa import Docs, Settings
from rich import print

PDF_PATH      = "papers/test_future.pdf"
PIPELINE_JSON = "pipeline_output.json"
LLM_NAME      = "gpt-4.1"  

#some qualms remaining, need to incporporate multuple papers

async def get_future_points(docs, settings, context):
    query = textwrap.dedent(f"""
        Here is an analysis snippet (JSON):\n{context}\n\n
        List the future work or open problems *explicitly mentioned* in the paper.
        Return a numbered bullet list; keep each bullet under 25 words.
    """)
    resp = await docs.aquery(query, settings=settings)
    return resp.formatted_answer if hasattr(resp, "formatted_answer") else str(resp)


async def interactive_loop():
    docs = Docs()
    await docs.aadd(PDF_PATH)
    settings = Settings(llm=LLM_NAME)

    pipeline_json = json.load(open(PIPELINE_JSON))
    future_points = await get_future_points(docs, settings,
                                            json.dumps(pipeline_json, indent=2))
    print("[bold cyan]Suggested future‑work directions:[/]")
    print(future_points)

    # adjust formatting here, how would this work on text? 
    # better prompt engineering needed

    choice = input("\nPick an item number (or keyword) to expand: ")
    follow_query = f"""
        You chose: {choice}. Draft a concrete research framework to tackle it.
        Include: goal, datasets, methods/models, evaluation metrics, and a
        high‑level file‑structure / code outline if applicable. Bullet points please.
    """
    project_plan = await docs.aquery(follow_query, settings=settings)
    print("\n[bold green]Project scaffold:[/]\n", project_plan.formatted_answer if hasattr(project_plan, "formatted_answer") else str(project_plan))

    if input("\nGenerate starter code? [y/n] ").lower() == "y":
        code_query = f"Expand the previous outline into runnable Python stubs with TODOs. If project does not require code, return the statement project does not require code."
        code = await docs.aquery(code_query, settings=settings)
        open("starter_project.py", "w").write(code.formatted_answer if hasattr(code, "formatted_answer") else str(code))
        print("Starter code saved to starter_project.py")

if __name__ == "__main__":
    asyncio.run(interactive_loop())
