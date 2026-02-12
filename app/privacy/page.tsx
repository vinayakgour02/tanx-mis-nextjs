"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Shield, Calendar, Clock, Lock } from "lucide-react"

export default function Privacy() {
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
                    🔒 Privacy Policy
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent leading-tight">
                  Privacy{" "}
                  <span className="bg-gradient-to-r from-[#FF7A00] to-[#FF5722] bg-clip-text text-transparent">
                    Policy
                  </span>
                </h1>
                <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Your privacy is important to us. Learn how we collect, use, and protect your information.
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

        {/* Privacy Content */}
        <section className="relative py-20 md:py-32">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 rounded-2xl p-8 md:p-12 border border-white/20 dark:border-gray-700/20 shadow-xl">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <div className="space-y-8">
                    <div className="bg-gradient-to-r from-[#FF7A00]/10 to-[#FF5722]/10 rounded-xl p-6 border border-[#FF7A00]/20">
                      <div className="flex items-start gap-3">
                        <Lock className="w-6 h-6 text-[#FF7A00] mt-1 flex-shrink-0" />
                        <div className="space-y-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">Your Privacy Matters</h3>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            We are committed to protecting your personal information and being transparent about how we use it.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">1. Information We Collect</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        We collect information you provide directly to us, such as when you create or modify your account, request customer support, or otherwise communicate with us.
                      </p>
                      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Personal Information</h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                        <li>Name, email address, and contact information</li>
                        <li>Account credentials and profile information</li>
                        <li>Organization details and role information</li>
                        <li>Communication preferences</li>
                      </ul>
                      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Usage Information</h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                        <li>Log data and device information</li>
                        <li>IP addresses and browser information</li>
                        <li>Usage patterns and feature interactions</li>
                        <li>Performance and error data</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">2. How We Use Your Information</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        We use the information we collect to provide, maintain, and improve our services:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                        <li>Provide and deliver the products and services you request</li>
                        <li>Send you technical notices, updates, security alerts, and support messages</li>
                        <li>Respond to your comments, questions, and customer service requests</li>
                        <li>Monitor and analyze trends, usage, and activities in connection with our services</li>
                        <li>Personalize and improve our services and provide content or features</li>
                        <li>Process and complete transactions</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">3. Information Sharing and Disclosure</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        We may share personal information in the following situations:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                        <li>With your consent or at your direction</li>
                        <li>With vendors, consultants, and other service providers</li>
                        <li>In response to a request for information if we believe disclosure is required by law</li>
                        <li>To protect the rights, property, and safety of us, our users, or others</li>
                        <li>In connection with or during negotiation of any merger, sale of assets, financing, or acquisition</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">4. Data Security</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        We take reasonable measures to help protect personal information from loss, theft, misuse, and unauthorized access:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                        <li>256-bit SSL encryption for data in transit</li>
                        <li>AES-256 encryption for data at rest</li>
                        <li>Regular security audits and penetration testing</li>
                        <li>Multi-factor authentication requirements</li>
                        <li>Employee access controls and training</li>
                        <li>SOC 2 Type II compliance</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">5. Data Retention</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        We store the information we collect about you for as long as is necessary for the purpose(s) for which we originally collected it. We may retain certain information for legitimate business purposes or as required by law.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">6. Your Rights and Choices</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        You have certain rights and choices regarding your personal information:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                        <li>Access and update your account information</li>
                        <li>Request deletion of your personal information</li>
                        <li>Object to processing of your personal information</li>
                        <li>Request data portability</li>
                        <li>Opt out of marketing communications</li>
                        <li>Withdraw consent where processing is based on consent</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">7. International Data Transfers</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        If you are accessing our services from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States. We take steps to ensure that your information receives an adequate level of protection.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">8. Cookies and Similar Technologies</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        We use cookies and similar technologies to provide, secure, and improve our services:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                        <li>Essential cookies for basic functionality</li>
                        <li>Analytics cookies to understand usage patterns</li>
                        <li>Performance cookies to optimize our services</li>
                        <li>Security cookies to prevent fraud and abuse</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">9. Third-Party Services</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        Our services may contain links to third-party websites or services. We are not responsible for the privacy practices or content of these third parties. We encourage you to review the privacy policies of any third-party services you access.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">10. Children's Privacy</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        Our services are not directed to children under 16. We do not knowingly collect personal information from children under 16. If we learn that we have collected personal information from a child under 16, we will take steps to delete such information.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">11. Changes to This Privacy Policy</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        We may update this privacy policy from time to time. We will notify you of any material changes by posting the new privacy policy on this page and updating the "last updated" date. We encourage you to review this privacy policy periodically.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">12. Contact Us</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        If you have any questions about this Privacy Policy, please contact us at:
                      </p>
                      <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>Email:</strong> info@tanxinnovations.com<br />
                          <strong>Phone:</strong> +91 98267 83036
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
