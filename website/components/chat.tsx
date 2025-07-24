import { useState } from "react";
import { post, get } from "../lib/api";
import PdfCard from "./pdf-card";
import IdeasList from "./ideas-list";
import ProjectModal from "./project-model";
import CodeBlock from "./code-block";

type Stage =
  | "idle" | "waiting-papers" | "pick-pdf"
  | "waiting-ideas" | "pick-idea"
  | "waiting-project" | "done";

export default function Chat() {
  const [prompt, setPrompt] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [pdfs, setPdfs] = useState<string[]>([]);
  const [ideas, setIdeas] = useState<string>();
  const [project, setProject] = useState<string>();
  const [code, setCode] = useState<string>();
  const [chosenPdf, setChosenPdf] = useState<string>();


  const poll = (id: string, onDone: (r: any) => void) => {
    const timer = setInterval(async () => {
      const j = await get<{ status: string; result: any; error: string }>(
        `/jobs/${id}`
      );
      if (j.status === "DONE") {
        clearInterval(timer);
        onDone(j.result);
      } else if (j.status === "ERROR") {
        clearInterval(timer);
        alert(j.error);
        setStage("idle");
      }
    }, 2000);
  };


  const startPipeline = async () => {
    if (!prompt.trim()) return;
    setStage("waiting-papers");
    const r = await post<{ job_id: string }>("/jobs/pipeline", { prompt });
    poll(r.job_id, (res) => {
      setPdfs(res.pdf_paths);
      setStage("pick-pdf");
    });
  };


  const pickPdf = async (pdf: string) => {
    setChosenPdf(pdf);
    setStage("waiting-ideas");
    const r = await post<{ job_id: string }>("/jobs/future", {
      pipeline_json: "pipeline_output.json",
      pdf_path: pdf,
    });
    poll(r.job_id, (res) => {
      setIdeas(res.ideas);
      setStage("pick-idea");
    });
  };


  const pickIdea = async (choice: string) => {
    if (!chosenPdf) return;
    setStage("waiting-project");
    const r = await post<{ job_id: string }>("/jobs/future", {
      pipeline_json: "pipeline_output.json",
      pdf_path: chosenPdf,
      choice,
      generate_code: true,
    });
    poll(r.job_id, (res) => {
      setProject(res.project);
      setCode(res.code);
      setStage("done");
    });
  };


  return (
    <div className="space-y-4">
      {stage === "idle" && (
        <div className="flex gap-2">
          <input
            className="flex-1 border p-2 rounded"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. graphene raman 2024"
          />
          <button className="btn" onClick={startPipeline}>
            Go
          </button>
        </div>
      )}

      {stage === "waiting-papers" && <p>🔄 Finding papers…</p>}

      {stage === "pick-pdf" && <PdfCard paths={pdfs} onSelect={pickPdf} />}

      {stage === "waiting-ideas" && <p>🔄 Extracting ideas…</p>}

      {stage === "pick-idea" && ideas && (
        <IdeasList text={ideas} onSelect={pickIdea} />
      )}

      {stage === "waiting-project" && <p>🔄 Drafting project…</p>}

      {stage === "done" && (
        <>
          <ProjectModal scaffold={project!} />
          <CodeBlock code={code!} />
        </>
      )}
    </div>
  );
}
