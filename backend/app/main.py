from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid, os, json, redis

from backend.workers.tasks import run_limitation, run_future_work

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.from_url(REDIS_URL, decode_responses=True)


app = FastAPI(title="Research‑Developer API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class PipelineIn(BaseModel):
    prompt: str


class FutureIn(BaseModel):
    pipeline_json: str
    pdf_path: str
    choice: str | None = None
    generate_code: bool = False


class JobOut(BaseModel):
    job_id: str
    status: str
    result: dict | None = None
    error: str | None = None


@app.post("/jobs/pipeline", response_model=JobOut)
def start_pipeline(body: PipelineIn):
    """Enqueue the ‘limitation’ pipeline and return a job_id."""
    job_id = str(uuid.uuid4())
    r.hset(job_id, mapping={"status": "QUEUED"})
    run_limitation.delay(job_id, body.prompt)
    return {"job_id": job_id, "status": "QUEUED", "result": None, "error": None}


@app.post("/jobs/future", response_model=JobOut)
def start_future(body: FutureIn):
    """Enqueue the ‘future work’ pipeline and return a job_id."""
    job_id = str(uuid.uuid4())
    r.hset(job_id, mapping={"status": "QUEUED"})
    run_future_work.delay(
        job_id,
        body.pipeline_json,
        body.pdf_path,
        body.choice,
        body.generate_code,
    )
    return {"job_id": job_id, "status": "QUEUED", "result": None, "error": None}


@app.get("/jobs/{job_id}", response_model=JobOut)
def job_status(job_id: str):
    """Poll the current status/result of a job."""
    if not r.exists(job_id):
        raise HTTPException(status_code=404, detail="Job not found")

    data = r.hgetall(job_id)
    result = json.loads(data["result"]) if data.get("result") else None
    return {
        "job_id": job_id,
        "status": data.get("status", "UNKNOWN"),
        "result": result,
        "error": data.get("error"),
    }
