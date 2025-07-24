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
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null)
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
    setSelectedPdf(path) 
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

  const renderTextWithBold = (text: string) => {
    const parts = text.split(/(\*\*[^\*]+\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 grid grid-cols-[1fr,1fr] gap-4 p-6">
        <div className="overflow-y-auto">
          <div className="max-w-md mx-auto">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-10 h-10 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-4xl font-semibold text-gray-900 mb-3">
                  Welcome to RESEARCHelper
                </h2>
                <p className="text-xl text-gray-600 max-w-md mx-auto">
                  Describe your research topic or question to get started with finding relevant papers and generating research ideas.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] p-4 rounded-xl text-lg text-gray-800 py-2 ${
                        m.role === "user"
                          ? "bg-orange-100 ml-auto"
                          : "bg-gray-100"
                      }`}
                    >
                      {renderTextWithBold(m.content)}
                    </div>
                  </div>
                ))}

                {stage === "pickPdf" && (
                  <div className="flex justify-start">
                    <div className="max-w-[70%] p-4 rounded-xl bg-gray-100 py-2">
                      <div className="text-lg text-gray-800">
                        {renderTextWithBold("Select one of the suggested papers:")}
                      </div>
                      <div className="grid gap-4 mt-4">
                        {pdfs.map((p) => (
                          <button
                            key={p}
                            onClick={() => pickPdf(p)}
                            className="text-left p-5 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
                          >
                            <div className="font-medium text-gray-900 text-lg">
                              {p.split("/").pop()?.replace(/\.[^/.]+$/, "")}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">PDF</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {stage === "pickIdea" && (
                  <div className="flex justify-start">
                    <div className="max-w-[70%] p-4 rounded-xl bg-gray-100 py-2">
                      <div className="space-y-4">
                        {ideas
                          .split("\n")
                          .filter((l) => /^\d+\./.test(l))
                          .map((line, idx) => {
                            const n = line.match(/^(\d+)\./)![1]
                            return (
                              <div key={`${n}-${idx}`} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex-1 text-lg text-gray-800">
                                    {renderTextWithBold(line.slice(line.indexOf(".") + 1).trim())}
                                  </div>
                                  <button
                                    onClick={() => pickIdea(n)}
                                    className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors flex-shrink-0"
                                  >
                                    Choose
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading States */}
                {(stage === "waitPapers" || stage === "waitIdeas" || stage === "waitProj") && (
                  <div className="flex justify-start">
                    <div className="max-w-[70%] p-4 rounded-xl bg-gray-100 py-2">
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-orange-600"></div>
                        <span className="text-lg">
                          {stage === "waitPapers" && "Finding relevant papers..."}
                          {stage === "waitIdeas" && "Generating research ideas..."}
                          {stage === "waitProj" && "Creating project outline..."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={bottomRef}></div>
          </div>
        </div>

        <div className="overflow-y-auto p-6">
          {selectedPdf && (
            <div className="space-y-4">
              <div className="bg-gray-200 h-64 rounded-xl flex items-center justify-center text-lg text-gray-600">
                Preview (Placeholder)
              </div>
              <button
                onClick={() => {
                  if (chosenPdfRef.current) pickPdf(chosenPdfRef.current)
                }}
                className="w-full px-6 py-3 bg-orange-600 text-white text-lg font-medium rounded-md hover:bg-orange-700 transition-colors"
              >
                Select
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="fixed top-7/8 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-6 z-30">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Describe your research topic or question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              className="w-full px-6 py-4 pr-16 text-xl bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={stage !== "idle" && stage !== "done"}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || (stage !== "idle" && stage !== "done")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-blue-500 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}