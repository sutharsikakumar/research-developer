"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Header from "@/components/header"
import { supabase } from "@/lib/supabase"

type Page = "home" | "conversation"

export default function WaitListPage() {
  const [email, setEmail] = useState("")
  const [done, setDone] = useState(false)
  const [displayedText, setDisplayedText] = useState("")
  const [currentPage, setCurrentPage] = useState<Page>("home")
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0)
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("")
  const [mainHeading, setMainHeading] = useState("")

  const fullText = "Welcome to Unmeasured!"
  const headingText = "Explore research limitations; change the world."

  const emailExamples = [
    "researcher@university.edu",
    "scientist@lab.org",
    "innovator@startup.co",
    "student@college.edu",
    "developer@tech.com",
    "analyst@research.org"
  ]

  // Load animation trigger
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Typewriter effect for main heading
  useEffect(() => {
    if (!isLoaded) return
    
    let index = 0
    const timer = setInterval(() => {
      if (index < headingText.length) {
        setMainHeading(headingText.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
      }
    }, 40)
    return () => clearInterval(timer)
  }, [isLoaded])


  useEffect(() => {
    let index = 0
    const currentEmail = emailExamples[currentPlaceholder]
    setDisplayedPlaceholder("")
    
    const timer = setInterval(() => {
      if (index < currentEmail.length) {
        setDisplayedPlaceholder(currentEmail.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
        setTimeout(() => {
          setCurrentPlaceholder((prev) => (prev + 1) % emailExamples.length)
        }, 2000)
      }
    }, 100)
    
    return () => clearInterval(timer)
  }, [currentPlaceholder])

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText(fullText.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
      }
    }, 60)
    return () => clearInterval(timer)
  }, [])

  async function handleSubmit() {
    if (!email.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from("waitlist-beta")
        .insert([{ email }])

      if (error) {
        console.error("Supabase insert error:", error.message)
        alert("There was a problem signing up. Please try again.")
        setIsSubmitting(false)
        return
      }

      console.log("Email submitted to Supabase:", email)
      
      setTimeout(() => {
        setDone(true)
        setIsSubmitting(false)
      }, 800)
    } catch (error) {
      console.error("Error submitting email:", error)
      alert("Something went wrong. Please try again later.")
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit()
  }

  if (done) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        paddingTop: "80px",
        fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <Header currentPage={currentPage} onNavigate={setCurrentPage} />
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
          minHeight: "calc(100vh - 80px)"
        }}>
          <div 
            style={{ 
              textAlign: "center", 
              maxWidth: "512px",
              animation: "successSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards"
            }}
          >
            <div 
              style={{ 
                marginBottom: "32px", 
                display: "flex", 
                justifyContent: "center",
                animation: "successBounce 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.3s forwards"
              }}
            >
              <Image
                src="/research-illustration.png"
                alt="Logo"
                width={200}
                height={200}
                style={{ 
                  objectFit: "contain",
                  filter: "drop-shadow(0 10px 25px rgba(0, 0, 0, 0.1))"
                }}
                onError={() => console.error('Next.js Image failed to load')}
                priority
              />
            </div>
            <h2 style={{
              fontSize: "48px",
              fontWeight: "700",
              color: "black",
              marginBottom: "24px",
              animation: "successFadeIn 0.6s ease-out 0.6s both"
            }}>
              <span style={{ 
                color: "#ff6b35",
                background: "linear-gradient(135deg, #ff6b35, #ff8c42)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>Looking forward to having you!</span>
            </h2>
            <p style={{
              fontSize: "20px",
              color: "#6b7280",
              fontWeight: "500",
              animation: "successFadeIn 0.6s ease-out 0.9s both"
            }}>
              Check your inbox in the coming weeks.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, sans-serif",
      paddingTop: "80px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 24px"
    }}>
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "80px",
        maxWidth: "1200px",
        width: "100%",
        marginBottom: "80px",
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? "translateY(0)" : "translateY(30px)",
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        <div 
          style={{ 
            flexShrink: 0,
            animation: isLoaded ? "slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both" : "none"
          }}
        >
          <div style={{
            position: "relative",
            transition: "transform 0.3s ease-out"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05) rotate(2deg)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1) rotate(0deg)"
          }}
          >
            <Image
              src="/research-illustration.png"
              alt="Research illustration"
              width={400}
              height={400}
              priority
              style={{ 
                objectFit: "contain", 
                display: "block",
                filter: "drop-shadow(0 15px 35px rgba(0, 0, 0, 0.1))"
              }}
              onError={() => console.error('Main image failed to load')}
            />
          </div>
        </div>

        <div 
          style={{ 
            flex: 1, 
            maxWidth: "600px",
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s"
          }}
        >
          <h1 style={{
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: "700",
            color: "#1a1a1a",
            lineHeight: "1.1",
            margin: "0",
            background: "linear-gradient(135deg, #1a1a1a 0%,rgb(11, 11, 11) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            minHeight: "1.2em"
          }}>
            {mainHeading}
            {mainHeading.length < headingText.length && isLoaded && (
              <span style={{ 
                animation: "pulse 1s infinite",
                background: "linear-gradient(135deg, #1a1a1a 0%, #4a5568 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>|</span>
            )}
          </h1>
        </div>
      </div>

      <div 
        style={{ 
          width: "100%", 
          maxWidth: "500px",
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s"
        }}
      >
        <div 
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
            border: "1px solid rgba(226, 232, 240, 0.6)",
            padding: "6px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            position: "relative",
            overflow: "hidden"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)"
            e.currentTarget.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.15)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px)"
            e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}
        >
          <div style={{
            position: "absolute",
            top: 0,
            left: "-100%",
            width: "100%",
            height: "100%",
            background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
            animation: "shimmer 3s infinite"
          }} />
          
          <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
            <input
              type="email"
              required
              placeholder={displayedPlaceholder + (displayedPlaceholder.length < emailExamples[currentPlaceholder].length ? "|" : "")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyPress}
              style={{
                flex: 1,
                padding: "16px 20px",
                fontSize: "20px",
                background: "transparent",
                color: "#1a1a1a",
                border: "none",
                outline: "none",
                transition: "all 0.3s ease"
              }}
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!email.trim() || isSubmitting}
              style={{
                padding: "16px 20px",
                background: email.trim() && !isSubmitting ? 
                  "linear-gradient(135deg, #ff6b35, #ff8c42)" : "#d1d5db",
                color: "white",
                fontWeight: "600",
                borderRadius: "12px",
                border: "none",
                cursor: email.trim() && !isSubmitting ? "pointer" : "not-allowed",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transform: isSubmitting ? "scale(0.95)" : "scale(1)",
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                if (email.trim() && !isSubmitting) {
                  e.currentTarget.style.transform = "scale(1.05)"
                  e.currentTarget.style.boxShadow = "0 10px 25px rgba(255, 107, 53, 0.4)"
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = "scale(1)"
                  e.currentTarget.style.boxShadow = "none"
                }
              }}
            >
              {isSubmitting ? (
                <div style={{
                  width: "18px",
                  height: "18px",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  borderTop: "2px solid white",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }} />
              ) : (
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div 
          style={{ 
            textAlign: "center", 
            marginTop: "32px",
            animation: isLoaded ? "fadeInUp 0.6s ease-out 1s both" : "none"
          }}
        >
          <p style={{ 
            color: "#6b7280", 
            fontSize: "20px",
            transition: "color 0.3s ease"
          }}>
            Join <span style={{ 
              color: "#ff6b35", 
              fontWeight: "600",
              background: "linear-gradient(135deg, #ff6b35, #ff8c42)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              position: "relative"
            }}>the waitlist</span> to have early access to the beta.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes successSlideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes successBounce {
          from {
            opacity: 0;
            transform: scale(0.3) rotate(-10deg);
          }
          50% {
            transform: scale(1.1) rotate(5deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        
        @keyframes successFadeIn {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}