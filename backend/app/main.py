from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uuid, os, json, redis

from backend.workers.tasks import run_limitation


REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.from_url(REDIS_URL, decode_responses=True)

app = FastAPI(title="Research‑Developer API")


class PipelineIn(BaseModel):
    prompt: str


class JobOut(BaseModel):
    job_id: str
    status: str
    result: dict | None = None
    error: str | None = None


@app.post("/jobs/pipeline", response_model=JobOut)
def start_pipeline(body: PipelineIn):
    """Enqueue the limitation pipeline and return a job_id to the UI."""
    job_id = str(uuid.uuid4())
    r.hset(job_id, mapping={"status": "QUEUED"})
    run_limitation.delay(job_id, body.prompt)
    return {"job_id": job_id, "status": "QUEUED", "result": None, "error": None}


@app.get("/jobs/{job_id}", response_model=JobOut)
def job_status(job_id: str):
    """Poll the current status/result of a job."""
    if not r.exists(job_id):
        raise HTTPException(404, "job not found")

    data = r.hgetall(job_id)
    result = json.loads(data["result"]) if data.get("result") else None
    return {
        "job_id": job_id,
        "status": data.get("status", "UNKNOWN"),
        "result": result,
        "error": data.get("error"),
    }
