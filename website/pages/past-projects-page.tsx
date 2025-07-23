"use client"

export interface Project {
  id: string
  title: string
  date: string
  description: string
  conversations: number
}

interface PastProjectsPageProps {
  projects: Project[]
  onProjectClick: (project: Project) => void
}

export default function PastProjectsPage({ projects, onProjectClick }: PastProjectsPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <main className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 text-center mb-12">project files</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <div
                key={project.id}
                onClick={() => onProjectClick(project)}
                className={`p-8 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  index === 1 ? "bg-gray-300" : "bg-green-200"
                }`}
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{project.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-700">
                  <div className="flex items-center gap-1">
                    <span>📅</span>
                    <span>{new Date(project.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>💬</span>
                    <span>{project.conversations} conversations</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty cards */}
            {[...Array(3)].map((_, index) => (
              <div key={`empty-${index}`} className="p-8 rounded-2xl bg-green-200 opacity-50">
                <div className="h-20"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
