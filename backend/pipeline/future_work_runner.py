"""
Turns future_work.py into an importable function.

async run(json_path, pdf_path) → dict with keys:
  ideas  : bullet‑list string
  project: scaffold string (after user choice)
  code   : starter code string (optional; may be "")
"""

import asyncio, json, textwrap
from pathlib import Path
from paperqa import Docs, Settings

LLM_NAME = "gpt-4.1"


async def _ideas_from_context(docs: Docs, settings: Settings, context_json: str) -> str:
    query = textwrap.dedent(
        f"""
        Here is an analysis snippet (JSON):\n{context_json}\n\n
        List the future work or open problems *explicitly mentioned* in the paper.
        Return a numbered bullet list; keep each bullet under 25 words.
        """
    )
    res = await docs.aquery(query, settings=settings)
    return getattr(res, "formatted_answer", str(res))


async def run(
    pipeline_json: str | Path,
    pdf_path: str | Path,
    choice: str | None = None,
    generate_code: bool = False,
) -> dict:
    """
    Args:
        pipeline_json: path to the pipeline_output.json produced earlier
        pdf_path     : target PDF chosen by user
        choice       : idea number / keyword selected by user (optional: None returns just ideas)
        generate_code: whether to expand into starter_project.py content

    Returns dict{ ideas, project, code }
    """
    docs = Docs()
    await docs.aadd(str(pdf_path))
    settings = Settings(llm=LLM_NAME)

    context_json = Path(pipeline_json).read_text()
    ideas = await _ideas_from_context(docs, settings, context_json)

    project = ""
    code = ""
    if choice:
        follow_query = textwrap.dedent(
            f"""
            You chose: {choice}. Draft a concrete research framework to tackle it.
            Include: goal, datasets, methods/models, evaluation metrics, and a
            high‑level file‑structure / code outline if applicable. Bullet points please.
            """
        )
        project_res = await docs.aquery(follow_query, settings=settings)
        project = getattr(project_res, "formatted_answer", str(project_res))

        if generate_code:
            code_res = await docs.aquery(
                "Expand the previous outline into runnable Python stubs with TODOs. "
                "If project does not require code, return the statement project does not require code.",
                settings=settings,
            )
            code = getattr(code_res, "formatted_answer", str(code_res))
            Path("starter_project.py").write_text(code)

    return {"ideas": ideas, "project": project, "code": code}



if __name__ == "__main__":
    async def _cli():
        ideas_dict = await run("pipeline_output.json", "papers/test_future.pdf")
        print(ideas_dict["ideas"])
    asyncio.run(_cli())
