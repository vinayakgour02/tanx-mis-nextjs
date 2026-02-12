"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mail, Home } from "lucide-react"

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      <div className="container px-4 md:px-6 py-16">
        <div className="max-w-2xl mx-auto bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 rounded-2xl p-8 shadow-lg">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Support</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We're here to help. Choose one of the options below to get assistance.
          </p>

          <div className="space-y-4">
            <div className="rounded-xl border border-white/20 dark:border-gray-700/20 bg-white/40 dark:bg-gray-800/40 p-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#FF7A00]" />
                <div>
                  <div className="font-semibold">Email Support</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Response within 1 business day</div>
                </div>
              </div>
              <div className="mt-3">
                <Button asChild className="bg-gradient-to-r from-[#FF7A00] to-[#FF5722] hover:from-[#FF5722] hover:to-[#FF7A00] text-white">
                  <a href="mailto:info@tanxinnovations.com?subject=Support%20Request">Email Us</a>
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-white/20 dark:border-gray-700/20 bg-white/40 dark:bg-gray-800/40 p-4">
              <div className="flex items-center gap-3">
                <Home className="w-5 h-5 text-[#FF7A00]" />
                <div>
                  <div className="font-semibold">Return to Dashboard</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Go back to your organization tools</div>
                </div>
              </div>
              <div className="mt-3">
                <Button variant="outline" asChild>
                  <Link href="/org-dashboard">Open Org Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

