"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { ArrowRight, Users, Target, Globe, Award } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function About() {
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
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-24">
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
                    🌟 About tanX
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent leading-tight">
                  Transforming Impact Through{" "}
                  <span className="bg-gradient-to-r from-[#FF7A00] to-[#FF5722] bg-clip-text text-transparent">
                    Smart Analytics
                  </span>
                </h1>
                <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  We're on a mission to revolutionize how organizations track, measure, and improve their social impact through cutting-edge monitoring and evaluation technology.
                </p>
              </div>
            </div>
          </div>

          {/* Smooth transition to next section */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/50"></div>
        </section>

        {/* Mission & Vision Section */}
        <section className="relative py-20 md:py-32">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="grid gap-16 lg:grid-cols-2 items-center">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      Our Mission
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                      To empower organizations worldwide with intelligent monitoring and evaluation tools that transform data into actionable insights, enabling them to maximize their positive impact on communities and society.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      Our Vision
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                      A world where every social initiative is equipped with the tools and insights needed to create measurable, lasting change through data-driven decision making.
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-2xl p-8 border border-white/20 dark:border-gray-700/20 shadow-xl">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center space-y-2">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#FF7A00] to-[#FF5722] rounded-full flex items-center justify-center">
                          <Users className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-[#FF7A00]">500+</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Organizations</div>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#FF7A00] to-[#FF5722] rounded-full flex items-center justify-center">
                          <Target className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-[#FF7A00]">2M+</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Projects Tracked</div>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#FF7A00] to-[#FF5722] rounded-full flex items-center justify-center">
                          <Globe className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-[#FF7A00]">50+</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Countries</div>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#FF7A00] to-[#FF5722] rounded-full flex items-center justify-center">
                          <Award className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-[#FF7A00]">99.9%</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Satisfaction</div>
                      </div>
                    </div>
                  </div>
                  {/* Background Glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF7A00]/20 to-[#FF5722]/20 rounded-2xl blur-2xl transform rotate-3 -z-10"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="relative py-20 md:py-32 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-7xl mx-auto text-center space-y-16">
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Our Core Values
                </h2>
                <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                  The principles that guide everything we do
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    title: "Innovation",
                    description: "Constantly pushing boundaries to deliver cutting-edge solutions that address real-world challenges."
                  },
                  {
                    title: "Transparency",
                    description: "Building trust through open communication, clear processes, and honest reporting."
                  },
                  {
                    title: "Impact",
                    description: "Focusing on measurable outcomes that create lasting positive change in communities."
                  },
                  {
                    title: "Collaboration",
                    description: "Working together with partners, clients, and communities to achieve shared goals."
                  },
                  {
                    title: "Excellence",
                    description: "Maintaining the highest standards in everything we deliver, from code to customer service."
                  },
                  {
                    title: "Accessibility",
                    description: "Making powerful tools available to organizations of all sizes and technical capabilities."
                  }
                ].map((value, index) => (
                  <div key={index} className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{value.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{value.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 md:py-32">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Ready to Transform Your Impact?
                </h2>
                <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                  Join hundreds of organizations already using tanX to maximize their social impact through intelligent monitoring and evaluation.
                </p>
              </div>

              <Button className="bg-gradient-to-r from-[#FF7A00] to-[#FF5722] hover:from-[#FF5722] hover:to-[#FF7A00] text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-8 py-6 text-lg group">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
