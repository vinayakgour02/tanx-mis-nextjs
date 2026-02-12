"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, Moon, Sun, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"

interface HeaderProps {
  isDark: boolean
  toggleTheme: () => void
}

export function Header({ isDark, toggleTheme }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { data: session, status } = useSession()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { label: "About SIA", href: "/" },
    // { label: "About", href: "/about" },
    { label: "Features", href: "/features" },
    { label: "MEL Rating", href: "/assessment" },
    { label: "Learning Hub", href: "/documentation" },
  ]

  return (
    <>
      {/* Floating Header */}
      <header className={`fixed top-4 left-4 right-4 z-50 transition-all duration-500 ${scrolled ? "top-2" : "top-4"}`}>
        <div className={`mx-auto max-w-7xl transition-all duration-500 ${scrolled ? "scale-[0.98]" : "scale-100"}`}>
          <div className="relative overflow-hidden rounded-2xl md:rounded-3xl backdrop-blur-2xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/20 shadow-2xl shadow-black/5 dark:shadow-black/20">
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-gray-900/20"></div>

            {/* Animated border gradient */}
            <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-r from-[#FF7A00]/20 via-transparent to-[#FF5722]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative flex h-14 md:h-16 items-center justify-between px-4 md:px-6 lg:px-8">
              <div className="flex items-center gap-2 animate-fade-in">
                <div className="relative">
                  <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#FF7A00] to-[#FF5722] bg-clip-text text-transparent">
                    tanX
                  </span>
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#FF7A00]/20 to-[#FF5722]/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>

              <nav className="hidden md:flex items-center gap-1 lg:gap-2 ">
                {navItems.map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="relative px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#FF7A00] transition-all duration-300 rounded-xl hover:bg-white/20 dark:hover:bg-gray-800/20 group"
                  >
                    {label}
                    <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-[#FF7A00] to-[#FF5722] transition-all duration-300 group-hover:w-3/4 transform -translate-x-1/2 rounded-full"></span>
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-2 md:gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="relative rounded-xl hover:bg-white/20 dark:hover:bg-gray-800/20 transition-all duration-300 h-8 w-8 md:h-10 md:w-10 group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF7A00]/10 to-[#FF5722]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {isDark ? (
                    <Sun className="h-4 w-4 md:h-5 md:w-5 relative z-10" />
                  ) : (
                    <Moon className="h-4 w-4 md:h-5 md:w-5 relative z-10" />
                  )}
                </Button>

                {status === 'authenticated' ? (
                  <Button className="relative overflow-hidden bg-gradient-to-r from-[#FF7A00] to-[#FF5722] hover:from-[#FF5722] hover:to-[#FF7A00] text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl px-3 md:px-6 py-1.5 md:py-2 text-xs md:text-sm font-medium group">
                    <Link href="/org-dashboard" className="relative z-10">SIA Dashboard</Link>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className="hidden lg:inline-flex hover:bg-white/20 dark:hover:bg-gray-800/20 transition-all duration-300 text-sm rounded-xl px-4 py-2 cursor-pointer"
                    >
                      <Link href='/login'>
                        Log In
                      </Link>
                    </Button>

                    <Button className="relative overflow-hidden bg-gradient-to-r from-[#FF7A00] to-[#FF5722] hover:from-[#FF5722] hover:to-[#FF7A00] text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl px-3 md:px-6 py-1.5 md:py-2 text-xs md:text-sm font-medium group">
                      <Link href="/register" className="relative z-10">Get Started</Link>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Button>
                  </>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-8 w-8 rounded-xl hover:bg-white/20 dark:hover:bg-gray-800/20 transition-all duration-300"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed top-20 left-4 right-4 z-40 md:hidden animate-slide-down">
          <div className="relative overflow-hidden rounded-2xl backdrop-blur-2xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/20 shadow-2xl shadow-black/5 dark:shadow-black/20">
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/10 to-white/5 dark:from-gray-900/20 dark:via-gray-900/10 dark:to-gray-900/5"></div>

            <nav className="relative py-6 px-4 flex flex-col gap-2">
              {navItems.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="relative px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#FF7A00] transition-all duration-300 rounded-xl hover:bg-white/20 dark:hover:bg-gray-800/20 group"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="relative z-10">{label}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF7A00]/5 to-[#FF5722]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                </Link>
              ))}

              <div className="border-t border-white/10 dark:border-gray-700/20 pt-4 mt-2">
                {status === 'authenticated' ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-white/20 dark:hover:bg-gray-800/20 transition-all duration-300 text-sm rounded-xl px-4 py-3 cursor-pointer"
                  >
                    <Link href="/org-dashboard" onClick={() => setIsMenuOpen(false)}>SIA Dashboard</Link>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-white/20 dark:hover:bg-gray-800/20 transition-all duration-300 text-sm rounded-xl px-4 py-3 cursor-pointer" 
                  >
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>Log In</Link>
                  </Button>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Backdrop blur overlay when mobile menu is open */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  )
}
