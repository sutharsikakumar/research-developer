"use client"
import type { Project } from "./past-projects-page"

interface ProjectDetailPageProps {
  project: Project
  onBack: () => void
}

export default function ProjectDetailPage({ project, onBack }: ProjectDetailPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <main className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="mb-8 px-4 py-2 bg-green-200 text-gray-900 rounded-lg hover:bg-green-300 transition-colors"
          >
            ← Back to Projects
          </button>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{project.title}</h1>
            <div className="flex items-center gap-6 mb-6 text-gray-600">
              <div className="flex items-center gap-2">
                <span>📅</span>
                <span>{new Date(project.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💬</span>
                <span>{project.conversations} conversations</span>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Project Description</h2>
              <p className="text-gray-700 leading-relaxed">{project.description}</p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Past Conversations</h2>
              <div className="space-y-4">
                {[...Array(project.conversations)].map((_, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Conversation {index + 1}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(Date.now() - index * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      Discussion about {project.title.toLowerCase()} research findings and methodology...
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
