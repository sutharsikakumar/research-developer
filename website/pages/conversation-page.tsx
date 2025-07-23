"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ConversationPageProps {
  topic: string
  messages: Message[]
  onSendMessage: (message: string) => void
  onBack: () => void
}

export default function ConversationPage({ topic, messages, onSendMessage, onBack }: ConversationPageProps) {
  const [currentMessage, setCurrentMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = () => {
    if (currentMessage.trim()) {
      onSendMessage(currentMessage.trim())
      setCurrentMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-24">
      <main className="flex-1 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={onBack}
              className="mb-4 px-4 py-2 bg-green-200 text-gray-900 rounded-lg hover:bg-green-300 transition-colors"
            >
              ← Back to Home
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{topic}</h1>
            <p className="text-gray-600">Research conversation</p>
          </div>

          {/* Messages Container */}
          <div className="bg-white rounded-2xl shadow-lg mb-6 min-h-96">
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <p>Start your research conversation about "{topic}"</p>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === "user" ? "bg-green-200 text-gray-900" : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-end space-x-4">
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-transparent"
                rows={3}
              />
              <button
                onClick={handleSubmit}
                disabled={!currentMessage.trim()}
                className="px-6 py-3 bg-green-200 text-gray-900 rounded-lg hover:bg-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
