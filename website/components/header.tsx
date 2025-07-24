"use client"

type Page = "home" | "past-project" | "conversation"

interface HeaderProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-green-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 cursor-pointer" onClick={() => onNavigate("home")}>
          RESEARCHelper
        </h1>
        <nav className="flex items-center space-x-8">
          <button
            onClick={() => onNavigate("past-project")}
            className={`hover:text-gray-900 transition-colors ${
              currentPage === "past-project" ? "text-gray-900 font-semibold" : "text-gray-700"
            }`}
          >
            past projects
          </button>
        </nav>
      </div>
    </header>
  )
}
