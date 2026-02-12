"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Shield, Calendar, Clock } from "lucide-react"

export default function Terms() {
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
                    📋 Legal Document
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent leading-tight">
                  Terms of{" "}
                  <span className="bg-gradient-to-r from-[#FF7A00] to-[#FF5722] bg-clip-text text-transparent">
                    Service
                  </span>
                </h1>
                <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Please read these terms and conditions carefully before using our service.
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

        {/* Terms Content */}
        <section className="relative py-20 md:py-32">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 rounded-2xl p-8 md:p-12 border border-white/20 dark:border-gray-700/20 shadow-xl">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <div className="space-y-8">
                    <div className="bg-gradient-to-r from-[#FF7A00]/10 to-[#FF5722]/10 rounded-xl p-6 border border-[#FF7A00]/20">
                      <div className="flex items-start gap-3">
                        <Shield className="w-6 h-6 text-[#FF7A00] mt-1 flex-shrink-0" />
                        <div className="space-y-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">Agreement to Terms</h3>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            By accessing and using tanX services, you accept and agree to be bound by the terms and provision of this agreement.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        By accessing or using the tanX platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, then you may not access the Service.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">2. Description of Service</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        tanX provides a monitoring and evaluation platform that enables organizations to:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                        <li>Collect and analyze project data</li>
                        <li>Create dashboards and reports</li>
                        <li>Manage project indicators and outcomes</li>
                        <li>Collaborate with team members</li>
                        <li>Access API and integration services</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">3. User Accounts</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                        <li>Safeguarding your account password</li>
                        <li>All activities that occur under your account</li>
                        <li>Notifying us immediately of unauthorized use</li>
                        <li>Ensuring your account information remains current</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">4. Acceptable Use</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        You may not use our Service:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                        <li>For any unlawful purpose or to solicit others to unlawful acts</li>
                        <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                        <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                        <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                        <li>To submit false or misleading information</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">5. Data and Privacy</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use our Service. By using our Service, you agree to the collection and use of information in accordance with our Privacy Policy.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">6. Intellectual Property</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        The Service and its original content, features, and functionality are and will remain the exclusive property of tanX and its licensors. The Service is protected by copyright, trademark, and other laws.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">7. Payment Terms</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        Some parts of the Service are provided for a fee. You will be clearly notified of any fees before they are charged. Payment terms include:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                        <li>Monthly or annual billing cycles</li>
                        <li>Automatic renewal unless cancelled</li>
                        <li>No refunds for partial billing periods</li>
                        <li>Price changes with 30-day notice</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">8. Termination</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will cease immediately.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">9. Limitation of Liability</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        In no event shall tanX, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">10. Changes to Terms</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">11. Contact Information</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        If you have any questions about these Terms of Service, please contact us at:
                      </p>
                      <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>Email:</strong> info@tanxinnovations.com<br />
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
