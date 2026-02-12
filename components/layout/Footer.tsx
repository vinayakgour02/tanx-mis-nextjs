import Link from "next/link"

export function Footer() {
  return (
    <footer className="relative backdrop-blur-xl bg-white/40 dark:bg-gray-900/40 border-t border-white/20 dark:border-gray-700/20 px-8">
      <div className="container flex flex-col gap-8 py-12 md:flex-row md:py-16">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF7A00] to-[#FF5722] shadow-lg">
              <span className="text-lg font-bold text-white">T</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              tanX
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-sm">
            Empowering organizations to track, analyze, and improve project outcomes with cutting-edge technology.
          </p>
        </div>

        {/* Two main headings */}
        <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3">
          {/* Company */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Company</h3>
            <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF7A00] transition-colors">
              Home
            </Link>
            <Link href="/features" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF7A00] transition-colors">
              Features
            </Link>
            <Link href="/about" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF7A00] transition-colors">
              About
            </Link>
            <Link href="/assessment" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF7A00] transition-colors">
              Assessment
            </Link>
            <Link href="https://tanxinnovations.com/blog" target="_self"  className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF7A00] transition-colors">
              Blog
            </Link>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Resources</h3>
            <Link href="/documentation" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF7A00] transition-colors">
              Documentation
            </Link>
            <Link href="/help-center" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF7A00] transition-colors">
              Help Center
            </Link>
            <Link href="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF7A00] transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF7A00] transition-colors">
              Privacy
            </Link>
            <Link href="/cookies" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF7A00] transition-colors">
              Cookies
            </Link>
          </div>

          {/* Connect */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Connect</h3>
            <Link
              href="https://www.linkedin.com/company/tanxinnovations"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#FF7A00] transition-all"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.451 20.451h-3.555v-5.569c0-1.328-.026-3.037-1.849-3.037-1.851 0-2.135 1.445-2.135 2.939v5.667H9.356V9h3.414v1.561h.048c.476-.9 1.637-1.849 3.367-1.849 3.599 0 4.268 2.368 4.268 5.451v6.288zM5.337 7.433a2.062 2.062 0 110-4.124 2.062 2.062 0 010 4.124zm1.777 13.018H3.56V9h3.554v11.451zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.226.792 24 1.771 24h20.451C23.2 24 24 23.226 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
              </svg>
              LinkedIn
            </Link>
            <a
              href="mailto:info@tanxinnovations.com"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF7A00] transition-colors"
            >
              info@tanxinnovations.com
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/20 dark:border-gray-700/20 py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} tanX. All rights reserved.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Made with ❤️ for better monitoring and evaluation
          </p>
        </div>
      </div>
    </footer>
  )
}
