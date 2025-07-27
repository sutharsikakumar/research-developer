"use client"
import Image from "next/image"
import Link from "next/link"
import { FaLinkedin } from "react-icons/fa"

type Page = "home" | "conversation"

interface HeaderProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/90 px-6 py-4 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">
        {/* logo / title */}
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-3"
        >
          <h1 className="text-2xl font-bold text-orange-800">Unmeasured</h1>
        </button>

        {/* right‑hand nav */}
        <nav className="flex items-center gap-6">
          {/* About link */}
          <Link
            href="/about"
            className="text-xl font-large text-gray-700 transition hover:text-orange-800"
          >
            About
          </Link>

          {/* LinkedIn icon */}
          <a
            href="https://www.linkedin.com/company/your‑linkedin‑slug"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 transition hover:text-orange-800"
            aria-label="Unmeasured on LinkedIn"
          >
            <FaLinkedin size={50} />
          </a>
        </nav>
      </div>
    </header>
  )
}