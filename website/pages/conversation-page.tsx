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
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="h-screen flex">
        {/* Left Panel - Chat Interface */}
        <div className="w-1/2 flex flex-col border-r border-gray-200">
          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              {messages.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-orange-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-10 h-10 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Welcome to RESEARCHelper
                  </h2>
                  <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
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
                        className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                          m.role === "user"
                            ? "bg-orange-500 text-white ml-auto"
                            : "bg-white border border-gray-200 text-gray-800"
                        }`}
                      >
                        <div className="text-base leading-relaxed whitespace-pre-wrap">
                          {renderTextWithBold(m.content)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {stage === "pickPdf" && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
                        <div className="text-base text-gray-800 mb-4 font-medium">
                          Select one of the suggested papers:
                        </div>
                        <div className="space-y-3">
                          {pdfs.map((p) => (
                            <button
                              key={p}
                              onClick={() => pickPdf(p)}
                              className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 hover:shadow-md"
                            >
                              <div className="font-semibold text-gray-900 text-base mb-1">
                                {p.split("/").pop()?.replace(/\.[^/.]+$/, "")}
                              </div>
                              <div className="text-sm text-gray-500">PDF Document</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {stage === "pickIdea" && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
                        <div className="text-base text-gray-800 mb-4 font-medium">
                          Choose a research idea to develop:
                        </div>
                        <div className="space-y-3">
                          {ideas
                            .split("\n")
                            .filter((l) => /^\d+\./.test(l))
                            .map((line, idx) => {
                              const n = line.match(/^(\d+)\./)![1]
                              return (
                                <div key={`${n}-${idx}`} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 text-base text-gray-800 leading-relaxed">
                                      {renderTextWithBold(line.slice(line.indexOf(".") + 1).trim())}
                                    </div>
                                    <button
                                      onClick={() => pickIdea(n)}
                                      className="px-6 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors flex-shrink-0 shadow-sm hover:shadow-md"
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
                      <div className="max-w-[80%] p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 text-gray-700">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-orange-500"></div>
                          <span className="text-base font-medium">
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

          {/* Input Area - Fixed at bottom of left panel */}
          <div className="p-6 bg-white border-t border-gray-200">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
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
                  className="w-full px-6 py-4 pr-16 text-base bg-gray-50 text-gray-900 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all shadow-sm"
                  disabled={stage !== "idle" && stage !== "done"}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || (stage !== "idle" && stage !== "done")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-orange-500 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-100"
                >
                  <svg
                    width="24"
                    height="24"
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

        {/* Right Panel - PDF Preview */}
        <div className="w-1/2 bg-gray-100 flex flex-col">
          <div className="p-6 bg-white border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">PDF Preview</h3>
          </div>
          <div className="flex-1 p-6">
            {selectedPdf ? (
              <div className="h-full flex flex-col">
                <div className="mb-4">
                  <h4 className="text-base font-medium text-gray-900 mb-2">
                    {selectedPdf.split("/").pop()?.replace(/\.[^/.]+$/, "")}
                  </h4>
                  <p className="text-sm text-gray-600">PDF Document</p>
                </div>
                <div className="flex-1 bg-white border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg text-gray-500 font-medium">PDF Preview</p>
                    <p className="text-sm text-gray-400 mt-1">Document preview will appear here</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-xl text-gray-400 font-medium">No PDF Selected</p>
                  <p className="text-sm text-gray-400 mt-2">Select a paper to preview it here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}