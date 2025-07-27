"use client"

import Image from "next/image"

type Page = "home" | "conversation"

interface HeaderProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center cursor-pointer gap-3" onClick={() => onNavigate("home")}>
          <h1 className="text-xl font-bold text-gray-800">
            Unmeasured
          </h1>
        </div>
      </div>
    </header>
  )
}