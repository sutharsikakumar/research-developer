"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

interface HomePageProps {
  onSubmit: (topic: string) => void
}

export default function HomePage({ onSubmit }: HomePageProps) {
  const [inputValue, setInputValue] = useState("")
  const [displayedText, setDisplayedText] = useState("")
  const [fontSize, setFontSize] = useState(4.2)
  const [faceSize, setFaceSize] = useState(340)

  const textContainerRef = useRef<HTMLDivElement>(null)
  const faceRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLDivElement>(null)
  const fullText = "What research project are you interested in exploring?"

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText(fullText.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
      }
    }, 40)

    return () => clearInterval(timer)
  }, [])

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSubmit(inputValue.trim())
      setInputValue("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit()
    }
  }

  const exampleProjects = [
    "Neural Network Visualization",
    "Climate Data Analysis", 
    "Quantum Computing Basics"
  ]

  const formatTextWithBreaks = (text: string) => {
    const words = text.split(' ')
    const midPoint = Math.ceil(words.length)
    const firstLine = words.slice(0, midPoint).join(' ')
    const secondLine = words.slice(midPoint).join(' ')
    
    return (
      <>
        {firstLine}
        <br />
        {secondLine}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden" style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
      {/* Main content - centered vertically and horizontally */}
      <div className="flex-1 flex items-center justify-center pt-0 px-6 relative z-20 h-screen">
        <div className="flex items-center gap-24 max-w-5xl">
          {/* Face illustration - centered */}
          <div ref={faceRef} className="flex-shrink-0">
            <div
              className="flex-shrink-0 flex justify-center"
              style={{
                width: `${faceSize}px`,
                height: `${faceSize}px`,
              }}
            >
              <img
                src="/research-illustration.png"
                alt="Research illustration"
                width={faceSize}
                height={faceSize}
                className="object-contain"
                style={{ width: `${faceSize}px`, height: `${faceSize}px` }}
              />
            </div>
          </div>

          {/* Question text - centered */}
          <div ref={textContainerRef} className="flex-1 max-w-md text-center">
            <h2 
              className="font-semibold text-gray-900 leading-tight"
              style={{ fontSize: `${fontSize}rem`, lineHeight: 1.15 }}
            >
              {displayedText && formatTextWithBreaks(displayedText)}
              <span className="animate-pulse">|</span>
            </h2>
          </div>
        </div>
      </div>

      {/* Floating input section - centered below main content */}
      <div className="fixed top-5/6 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-6 z-30">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Enter your research topic..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full px-6 py-4 pr-16 text-lg bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
            />
            
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-blue-500 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
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

      {/* Example projects - centered below input */}
      <div className="fixed top-[70%] left-1/2 transform -translate-x-1/2 w-full max-w-xl px-8 z-20">
        <div className="flex justify-center gap-4">
          {exampleProjects.map((project, index) => (
            <button
              key={index}
              onClick={() => {
                setInputValue(project)
                handleSubmit()
              }}
              className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              {project}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}