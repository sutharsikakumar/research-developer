









from __future__ import annotations

import asyncio
import json
import os

import redis
from celery import Celery

from backend.pipeline import limitation_runner, future_work_runner


REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("research_backend", broker=REDIS_URL, backend=REDIS_URL)

r = redis.from_url(REDIS_URL, decode_responses=True)

def _get_event_loop() -> asyncio.AbstractEventLoop:

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop


def _mark_status(job_id: str, **fields):

    r.hset(job_id, mapping=fields)

@celery_app.task(name="jobs.run_limitation")
def run_limitation(job_id: str, prompt: str):

    _mark_status(job_id, status="RUNNING")

    loop = _get_event_loop()
    try:
        result = loop.run_until_complete(limitation_runner.run(prompt))
    except Exception as e:
        _mark_status(job_id, status="ERROR", error=str(e))
        raise
    else:
        _mark_status(job_id, status="DONE", result=json.dumps(result))
        return result


@celery_app.task(name="jobs.run_future_work")
def run_future_work(
    job_id: str,
    pipeline_json: str,
    pdf_path: str,
    choice: str | None,
    generate_code: bool,
):

    _mark_status(job_id, status="RUNNING")

    loop = _get_event_loop()
    try:
        result = loop.run_until_complete(
            future_work_runner.run(
                pipeline_json=pipeline_json,
                pdf_path=pdf_path,
                choice=choice,
                generate_code=generate_code,
            )
        )
    except Exception as e:
        _mark_status(job_id, status="ERROR", error=str(e))
        raise
    else:
        _mark_status(job_id, status="DONE", result=json.dumps(result))
        return result
