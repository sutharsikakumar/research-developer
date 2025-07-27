"use client"
import Link from "next/link"
import { FaLinkedin, FaTwitter, FaGithub } from "react-icons/fa"

type Page = "home" | "conversation"

interface FooterProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

export default function Footer({ currentPage, onNavigate }: FooterProps) {
  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onNavigate("home")
  }

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      {/* ⬆ wider horizontal & vertical padding */}
      <div className="px-8 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <button
              onClick={handleHomeClick}
              className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity"
              type="button"
            >
              <h2 className="text-2xl font-bold text-orange-800">Unmeasured</h2>
            </button>
            {/* ⬆ larger tagline text */}
            <p className="text-gray-600 mb-4 max-w-md text-lg md:text-xl">
              Meaningful research that goes beyond the surface.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.linkedin.com/company/your‑linkedin‑slug"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-orange-800 transition-colors"
                aria-label="Unmeasured on LinkedIn"
              >
                <FaLinkedin size={24} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* ⬆ larger bottom text */}
            <p className="text-gray-500 text-base md:text-lg">
              © {new Date().getFullYear()} Unmeasured. All rights reserved.
            </p>
            <p className="text-gray-500 text-base md:text-lg mt-2 md:mt-0">
              Made with ❤️ by the Unmeasured Team
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
