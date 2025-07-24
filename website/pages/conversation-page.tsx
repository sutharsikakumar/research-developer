"use client"

import { useState, useEffect, useRef } from "react"
import { post, get } from "@/lib/api"

interface ChatMsg { role: "user" | "assistant"; content: string }

export default function ConversationPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState("")
  const [stage, setStage] = useState<
    | "idle"
    | "waitPapers"
    | "pickPdf"
    | "waitIdeas"
    | "pickIdea"
    | "waitProj"
    | "done"
  >("idle")
  const [pdfs, setPdfs] = useState<string[]>([])
  const [ideas, setIdeas] = useState<string>("")
  const chosenPdfRef = useRef<string>("")
  const bottomRef = useRef<HTMLDivElement>(null)


  const poll = (id: string, onDone: (r: any) => void) => {
    const timer = setInterval(async () => {
      const j = await get<{ status: string; result: any; error: string }>(
        `/jobs/${id}`
      )
      if (j.status === "DONE") {
        clearInterval(timer)
        onDone(j.result)
      } else if (j.status === "ERROR") {
        clearInterval(timer)
        alert(j.error)
      }
    }, 2000)
  }


  const handleSubmit = async () => {
    if (!input.trim()) return
    const userMsg = { role: "user", content: input.trim() } as ChatMsg
    setMessages((m) => [...m, userMsg])
    setInput("")

    setStage("waitPapers")
    const { job_id } = await post<{ job_id: string }>("/jobs/pipeline", {
      prompt: userMsg.content,
    })
    poll(job_id, (res) => {
      setPdfs(res.pdf_paths)
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Select one of the suggested papers:" },
      ])
      setStage("pickPdf")
    })
  }


  const pickPdf = async (path: string) => {
    chosenPdfRef.current = path
    setStage("waitIdeas")
    const { job_id } = await post<{ job_id: string }>("/jobs/future", {
      pipeline_json: "pipeline_output.json",
      pdf_path: path,
    })
    poll(job_id, (res) => {
      setIdeas(res.ideas)
      setStage("pickIdea")
    })
  }


  const pickIdea = async (num: string) => {
    setStage("waitProj")
    const { job_id } = await post<{ job_id: string }>("/jobs/future", {
      pipeline_json: "pipeline_output.json",
      pdf_path: chosenPdfRef.current,
      choice: num,
      generate_code: true,
    })
    poll(job_id, (res) => {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Project outline:\n" + res.project },
        { role: "assistant", content: "Starter Code ↓\n" + res.code },
      ])
      setStage("done")
    })
  }


  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages])


  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-6 bg-gray-50">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-3 py-2 rounded-lg ${m.role === "user" ? "bg-green-200" : "bg-gray-200"}`}
            >
              <pre className="whitespace-pre-wrap text-sm">{m.content}</pre>
            </div>
          </div>
        ))}

        {stage === "pickPdf" && (
          <div className="grid md:grid-cols-3 gap-3">
            {pdfs.map((p) => (
              <button
                key={p}
                onClick={() => pickPdf(p)}
                className="border rounded p-2 hover:bg-green-50 text-left"
              >
                {p.split("/").pop()}
              </button>
            ))}
          </div>
        )}

        {stage === "pickIdea" && (
          <ol className="space-y-2">
            {ideas
              .split("\n")
              .filter((l) => /^\d+\./.test(l))
              .map((line, idx) => {
                const n = line.match(/^(\d+)\./)![1]
                return (
                  <li key={`${n}-${idx}`} className="border rounded p-2">
                    {line.slice(line.indexOf(".") + 1).trim()}
                    <button
                      onClick={() => pickIdea(n)}
                      className="float-right text-blue-600 underline"
                    >
                      Use
                    </button>
                  </li>
                )
              })}
          </ol>
        )}
        <div ref={bottomRef}></div>
      </div>

      <div className="p-4 bg-white flex gap-3">
        <textarea
          rows={2}
          className="flex-1 border p-2 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="Type your research topic…"
        />
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-green-200 rounded disabled:opacity-50"
          disabled={!input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  )
}
