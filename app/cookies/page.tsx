"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Cookie, Calendar, Clock, Settings, Shield, BarChart } from "lucide-react"

export default function Cookies() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDark])

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 transition-all duration-500">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-gradient-to-br from-green-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <Header isDark={isDark} toggleTheme={toggleTheme} />

      <main className="flex-1 relative">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-20 md:pt-24">
          {/* Grid Background */}
          <div className="absolute inset-0 bg-white dark:bg-gray-900">
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
          </div>

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF7A00]/5 via-transparent to-[#FF5722]/5"></div>
          <div className="absolute top-10 left-1/4 w-32 h-32 md:w-96 md:h-96 bg-[#FF7A00]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-1/4 w-32 h-32 md:w-96 md:h-96 bg-[#FF5722]/10 rounded-full blur-3xl"></div>

          <div className="container px-4 md:px-6 relative z-10 py-20">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <div className="inline-block">
                  <span className="px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium bg-gradient-to-r from-[#FF7A00]/10 to-[#FF5722]/10 text-[#FF7A00] border border-[#FF7A00]/20 backdrop-blur-sm shadow-lg">
                    🍪 Cookie Policy
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent leading-tight">
                  Cookie{" "}
                  <span className="bg-gradient-to-r from-[#FF7A00] to-[#FF5722] bg-clip-text text-transparent">
                    Policy
                  </span>
                </h1>
                <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Learn about how we use cookies and similar technologies to enhance your experience.
                </p>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Last updated: December 1, 2024
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Effective: December 1, 2024
                </div>
              </div>
            </div>
          </div>

          {/* Smooth transition to next section */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/50"></div>
        </section>

        {/* Cookie Content */}
        <section className="relative py-20 md:py-32">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 rounded-2xl p-8 md:p-12 border border-white/20 dark:border-gray-700/20 shadow-xl">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <div className="space-y-8">
                    <div className="bg-gradient-to-r from-[#FF7A00]/10 to-[#FF5722]/10 rounded-xl p-6 border border-[#FF7A00]/20">
                      <div className="flex items-start gap-3">
                        <Cookie className="w-6 h-6 text-[#FF7A00] mt-1 flex-shrink-0" />
                        <div className="space-y-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">About Cookies</h3>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            We use cookies and similar technologies to provide, secure, and improve our services and to show you relevant content and ads.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">What Are Cookies?</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the owners of the site. Cookies help us understand how you use our service and improve your experience.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Types of Cookies We Use</h2>
                      
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-3 mb-3">
                            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Essential Cookies</h3>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                            These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.
                          </p>
                          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <li>Authentication and login state</li>
                            <li>Security and fraud prevention</li>
                            <li>Load balancing and performance</li>
                            <li>User preferences and settings</li>
                          </ul>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-3 mb-3">
                            <BarChart className="w-6 h-6 text-green-600 dark:text-green-400" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics Cookies</h3>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                            These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                          </p>
                          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <li>Page views and user journeys</li>
                            <li>Feature usage statistics</li>
                            <li>Performance metrics</li>
                            <li>Error tracking and debugging</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Third-Party Cookies</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        We may also use third-party cookies from trusted partners to help us:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                        <li>Analyze website traffic and usage patterns (Google Analytics)</li>
                        <li>Provide customer support through chat services</li>
                        <li>Enable social media sharing and integration</li>
                        <li>Process payments securely</li>
                        <li>Deliver relevant content and advertisements</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Cookie Duration</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        We use both session and persistent cookies:
                      </p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Session Cookies</h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            These are temporary cookies that expire when you close your browser. They help maintain your session while you navigate our site.
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Persistent Cookies</h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            These cookies remain on your device for a set period (up to 2 years) and remember your preferences across visits.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Managing Your Cookie Preferences</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        You have several options to control cookies:
                      </p>
                      
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-[#FF7A00]/5 to-[#FF5722]/5 p-4 rounded-lg border border-[#FF7A00]/20">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Browser Settings</h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            Most browsers allow you to control cookies through their settings. You can choose to block or delete cookies, though this may affect your experience on our site.
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-r from-blue-500/5 to-blue-600/5 p-4 rounded-lg border border-blue-500/20">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Cookie Consent Manager</h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            When you first visit our site, you can choose which types of cookies to accept through our cookie banner and preferences center.
                          </p>
                        </div>

                        <div className="bg-gradient-to-r from-green-500/5 to-green-600/5 p-4 rounded-lg border border-green-500/20">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Opt-Out Links</h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            For third-party analytics cookies, you can opt out directly through Google Analytics' opt-out browser add-on or through your ad preferences.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Impact of Disabling Cookies</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        If you choose to disable cookies, you may experience:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                        <li>Difficulty logging in or staying logged in</li>
                        <li>Loss of personalized settings and preferences</li>
                        <li>Reduced functionality of certain features</li>
                        <li>Less relevant content and recommendations</li>
                        <li>Inability to use some interactive features</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Updates to This Policy</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on our website.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Contact Us</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        If you have any questions about our use of cookies or this Cookie Policy, please contact us at:
                      </p>
                      <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>Email:</strong> indo@tanxinnovations.com<br />
                          <strong>Subject:</strong> Cookie Policy Inquiry<br />
                          <strong>Address:</strong> tanX Innovations, Privacy Team<br />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
