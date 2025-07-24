from celery import Celery
import asyncio, uuid, json
from pipeline import limitation_runner, future_work_runner

celery_app = Celery(
    "research_backend",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
)

@celery_app.task(name="jobs.run_limitation")
def run_limitation(job_id: str, prompt: str):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    result = loop.run_until_complete(limitation_runner.run(prompt))
    return result  # Render stores as JSON in Redis backend

@celery_app.task(name="jobs.run_future_work")
def run_future_work(job_id: str, pipeline_json: str, pdf_path: str, choice: str | None, generate_code: bool):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    result = loop.run_until_complete(
        future_work_runner.run(pipeline_json, pdf_path, choice, generate_code)
    )
    return result
