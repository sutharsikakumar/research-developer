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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">RESEARCHelper</h1>
          <button className="text-sm text-gray-600 hover:text-gray-900">
            past projects
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Welcome to RESEARCHelper
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Describe your research topic or question to get started with finding relevant papers and generating research ideas.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full ${
                      m.role === "user" 
                        ? "bg-blue-100 text-blue-600" 
                        : "bg-orange-100 text-orange-600"
                    } flex items-center justify-center text-sm font-medium`}>
                      {m.role === "user" ? "U" : "A"}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                        {m.content}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}

              {/* Paper Selection */}
              {stage === "pickPdf" && (
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-medium">
                      A
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="grid gap-3">
                      {pdfs.map((p) => (
                        <button
                          key={p}
                          onClick={() => pickPdf(p)}
                          className="text-left p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
                        >
                          <div className="font-medium text-gray-900 text-sm">
                            {p.split("/").pop()?.replace(/\.[^/.]+$/, "")}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">PDF</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Idea Selection */}
              {stage === "pickIdea" && (
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-medium">
                      A
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="space-y-3">
                      {ideas
                        .split("\n")
                        .filter((l) => /^\d+\./.test(l))
                        .map((line, idx) => {
                          const n = line.match(/^(\d+)\./)![1]
                          return (
                            <div key={`${n}-${idx}`} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 text-sm text-gray-800">
                                  {line.slice(line.indexOf(".") + 1).trim()}
                                </div>
                                <button
                                  onClick={() => pickIdea(n)}
                                  className="px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-md hover:bg-orange-700 transition-colors flex-shrink-0"
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
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-medium">
                      A
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-orange-600"></div>
                      <span className="text-sm">
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

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white sticky bottom-0">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                rows={1}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none min-h-[48px] max-h-32"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                placeholder="Describe your research topic or question..."
                disabled={stage !== "idle" && stage !== "done"}
                style={{ 
                  height: 'auto',
                  minHeight: '48px'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px'
                }}
              />
            </div>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              disabled={!input.trim() || (stage !== "idle" && stage !== "done")}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}