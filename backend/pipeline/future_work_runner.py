








import asyncio, json, textwrap
from pathlib import Path
from paperqa import Docs, Settings

LLM_NAME = "gpt-4.1"


async def _ideas_from_context(docs: Docs, settings: Settings, context_json: str) -> str:
    query = textwrap.dedent(
        f




    )
    res = await docs.aquery(query, settings=settings)
    return getattr(res, "formatted_answer", str(res))


async def run(
    pipeline_json: str | Path,
    pdf_path: str | Path,
    choice: str | None = None,
    generate_code: bool = False,
) -> dict:









    docs = Docs()
    await docs.aadd(str(pdf_path))
    settings = Settings(llm=LLM_NAME)

    context_json = Path(pipeline_json).read_text()
    ideas = await _ideas_from_context(docs, settings, context_json)

    project = ""
    code = ""
    if choice:
        follow_query = textwrap.dedent(
            f




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
