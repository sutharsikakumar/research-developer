"use client"
import { useState } from "react"

import Header from "./components/header"

// Pages
import HomePage from "./pages/home-page"
import PastProjectsPage, { type Project } from "./pages/past-projects-page"
import ProjectDetailPage from "./pages/project-detail-page"
import ConversationPage from "./pages/conversation-page"

type Page = "home" | "past-project" | "conversation"

interface Message {
  role: "user" | "assistant"
  content: string
}

const initialMockProjects: Project[] = [
  {
    id: "1",
    title: "something with drug discovery",
    date: "2024-01-15",
    description: "Research on novel drug discovery methods using AI and machine learning approaches.",
    conversations: 12,
  },
  {
    id: "2",
    title: "something with quantum computing",
    date: "2024-01-10",
    description: "Exploration of quantum computing applications in cryptography and optimization.",
    conversations: 8,
  },
  {
    id: "3",
    title: "something with quantum computing",
    date: "2024-01-05",
    description: "Advanced quantum algorithms for solving complex computational problems.",
    conversations: 15,
  },
]

export default function ResearchHelper() {
  const [currentPage, setCurrentPage] = useState<Page>("home")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>(initialMockProjects)


  const [conversationTopic, setConversationTopic] = useState("")
  const [conversationMessages, setConversationMessages] = useState<Message[]>([])

  const handleNavigate = (page: Page) => {
    setCurrentPage(page)
    setSelectedProject(null)
  }

  const handleTopicSubmit = (topic: string) => {

    const newProject: Project = {
      id: Date.now().toString(), 
      title: topic,
      date: new Date().toISOString().split("T")[0], 
      description: `Research exploration on ${topic}. This project was created to investigate and analyze various aspects of this topic.`,
      conversations: 1, 
    }


    setProjects((prevProjects) => [newProject, ...prevProjects])

    setConversationTopic(topic)
    setConversationMessages([])
    setCurrentPage("conversation")
  }

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project)
  }

  const handleProjectBack = () => {
    setSelectedProject(null)
  }

  const handleSendMessage = (message: string) => {
    const newMessages = [...conversationMessages, { role: "user" as const, content: message }]
    setConversationMessages(newMessages)


    if (conversationTopic) {
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.title === conversationTopic ? { ...project, conversations: project.conversations + 1 } : project,
        ),
      )
    }


    setTimeout(() => {
      setConversationMessages([
        ...newMessages,
        {
          role: "assistant" as const,
          content: `I understand you're interested in ${conversationTopic}. Let me help you explore this topic further. What specific aspect would you like to focus on?`,
        },
      ])
    }, 1000)
  }

  const handleConversationBack = () => {
    setCurrentPage("home")
  }

  return (
    <div>
      <Header currentPage={currentPage} onNavigate={handleNavigate} />

      {selectedProject ? (
        <ProjectDetailPage project={selectedProject} onBack={handleProjectBack} />
      ) : (
        <>
          {currentPage === "home" && <HomePage onSubmit={handleTopicSubmit} />}
          {currentPage === "past-project" && (
            <PastProjectsPage projects={projects} onProjectClick={handleProjectClick} />
          )}
          {currentPage === "conversation" && (
            <ConversationPage
              topic={conversationTopic}
              messages={conversationMessages}
              onSendMessage={handleSendMessage}
              onBack={handleConversationBack}
            />
          )}
        </>
      )}
    </div>
  )
}
