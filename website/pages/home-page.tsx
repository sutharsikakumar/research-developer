"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import Image from "next/image"

interface HomePageProps {
  onSubmit: (topic: string) => void
}

export default function HomePage({ onSubmit }: HomePageProps) {
  const [inputValue, setInputValue] = useState("")
  const [displayedText, setDisplayedText] = useState("")
  const [fontSize, setFontSize] = useState(4) // rem units
  const [imageSize, setImageSize] = useState(400) // pixels
  const [textMaxWidth, setTextMaxWidth] = useState(400) // pixels
  const [containerWidth, setContainerWidth] = useState(0)

  const textContainerRef = useRef<HTMLDivElement>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)
  const fullText = "what research topic are you interested in exploring?"

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText(fullText.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
      }
    }, 50)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const adjustSizes = () => {
      if (!textContainerRef.current || !mainContentRef.current) return

      const headerHeight = 80
      const inputAreaHeight = 200
      const availableHeight = window.innerHeight - headerHeight - inputAreaHeight
      const availableWidth = window.innerWidth

      // Calculate available width with 15% padding on each side (70% total available)
      const contentAreaWidth = availableWidth * 0.7
      const gapWidth = availableWidth * 0.1 // 10vw gap

      // Calculate optimal image size
      const maxImageWidth = Math.min(contentAreaWidth * 0.4, availableHeight * 0.5, 450)
      const baseImageSize = Math.max(200, maxImageWidth)

      // Calculate remaining width for text after image and gap
      const remainingWidth = contentAreaWidth - baseImageSize - gapWidth
      const maxTextWidth = Math.max(300, remainingWidth)

      // Calculate font size based on available space
      const baseFontSize = Math.min(availableWidth / 400, availableHeight / 250, maxTextWidth / 200, 5)

      // Ensure minimum sizes
      const adjustedFontSize = Math.max(1.8, Math.min(baseFontSize, 6))
      const adjustedImageSize = Math.max(200, Math.min(baseImageSize, 500))
      const adjustedTextWidth = Math.max(300, Math.min(maxTextWidth, 600))

      setFontSize(adjustedFontSize)
      setImageSize(adjustedImageSize)
      setTextMaxWidth(adjustedTextWidth)

      if (textContainerRef.current) {
        setContainerWidth(textContainerRef.current.getBoundingClientRect().width)
      }
    }

    // Initial adjustment
    adjustSizes()

    // Adjust on resize and when text changes
    window.addEventListener("resize", adjustSizes)

    // Delay to ensure text is rendered
    const timeoutId = setTimeout(adjustSizes, 100)

    return () => {
      window.removeEventListener("resize", adjustSizes)
      clearTimeout(timeoutId)
    }
  }, [displayedText])

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

  const renderWavyText = (text: string) => {
    if (!containerWidth || !textMaxWidth) return text

    // Calculate characters per line based on actual text container width
    const avgCharWidth = fontSize * 0.6 // Approximate character width in rem
    const charsPerLine = Math.floor(textMaxWidth / (avgCharWidth * 16)) // Convert rem to pixels

    const words = text.split(" ")
    let globalCharIndex = 0

    return words.map((word, wordIndex) => {
      const wordChars = word.split("").map((char, charInWordIndex) => {
        const linePosition = globalCharIndex % Math.max(charsPerLine, 8)
        const waveOffset = Math.sin(linePosition * 0.2) * (fontSize * 2.5)
        const rotation = Math.sin(linePosition * 0.15) * 2

        globalCharIndex++

        return (
          <span
            key={`${wordIndex}-${charInWordIndex}`}
            className="inline-block"
            style={{
              transform: `translateY(${waveOffset}px) rotate(${rotation}deg)`,
              transition: "transform 0.3s ease",
            }}
          >
            {char}
          </span>
        )
      })

      globalCharIndex++ // Account for space after word

      return (
        <span key={wordIndex} className="inline-block mr-2">
          {wordChars}
        </span>
      )
    })
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col fixed inset-0 pt-20">
      <main ref={mainContentRef} className="flex-1 flex items-center justify-center px-6 overflow-hidden">
        <div
          className="flex items-center justify-center"
          style={{
            gap: "10vw",
            maxWidth: "70vw", // Ensure entire group fits within 70% of screen
            width: "100%",
          }}
        >
          <div className="flex-shrink-0 flex justify-center">
            <Image
              src="/research-illustration.png"
              alt="Research illustration"
              width={imageSize}
              height={imageSize}
              className="object-contain"
              style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
            />
          </div>
          <div
            ref={textContainerRef}
            className="flex-shrink-0"
            style={{
              maxWidth: `${textMaxWidth}px`,
              width: `${textMaxWidth}px`,
            }}
          >
            <h2
              className="font-bold text-gray-900 leading-relaxed"
              style={{
                fontSize: `${fontSize}rem`,
                lineHeight: 1.3,
                wordWrap: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {renderWavyText(displayedText)}
            </h2>
          </div>
        </div>
      </main>

      <div className="w-full flex-shrink-0" style={{ padding: "4vh 7vw 7vh 7vw" }}>
        <div className="w-full max-w-3xl mx-auto">
          <div className="relative flex items-center">
          <input
            type="text"
            placeholder=""
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}  // ✅ updated!
            className="w-full px-6 py-4 pr-16 text-lg bg-gray-900 text-white rounded-lg border-none outline-none focus:ring-2 focus:ring-green-200"
          />
            {inputValue === "" && (
              <div className="absolute left-6 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <div className="w-0.5 h-6 bg-white animate-pulse"></div>
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-white hover:text-green-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                width="20"
                height="20"
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
