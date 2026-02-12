"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { ArrowRight, BarChart3, Target, Users, Globe, Shield, Zap, TrendingUp, Database, FileText, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Features() {
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

  const features = [
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Get instant insights with live dashboards that update automatically as your project data flows in.",
      benefits: ["Live data visualization", "Custom dashboard creation", "Automated reporting", "Performance tracking"]
    },
    {
      icon: Target,
      title: "Plan v/s Progress Analysis",
      description: "Create Project LFA, Plans and Reporting against Plan helps in effective monitoring of project indicators and milestones.",
      benefits: ["SMART goal framework", "RAG Ratings (Traffic Light)","Progress monitoring", "Milestone alerts", "Achievement analytics"]
    },
    {
      icon: Users,
      title: "Collaborative Workspace",
      description: "Bring your entire team together with role-based access and collaborative project management tools.",
      benefits: ["Team collaboration", "Role-based permissions", "Communication tools", "Task assignment"]
    },
    {
      icon: Globe,
      title: "Multi-location Support",
      description: "Manage projects across different locations with centralized reporting and location-specific insights.",
      benefits: ["Global project view", "Location analytics", "Multi-currency support", "Regional reporting"]
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Your data is protected with bank-level security, encryption, and compliance with international standards.",
      benefits: ["256-bit encryption", "SOC 2 compliance", "GDPR ready", "Regular security audits"]
    },
    {
      icon: Zap,
      title: "Logical Framework Analysis",
      description: "Create project specific Logical Framework Analysis (LFA) aligned with NGOs program and organiztion level indicators for effective monitoring.",
      benefits: [
        "Impact measurement & scoring",
        "Outcome & beneficiary tracking",
        "Data-driven social reporting",
        "Enhanced donor & stakeholder trust"
      ]
    }
    
  ]

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
                  <span className="px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-lg font-medium bg-gradient-to-r from-[#FF7A00]/10 to-[#FF5722]/10 text-[#FF7A00] border border-[#FF7A00]/20 backdrop-blur-sm shadow-lg">
                    🚀 Easily Customizable for NGOs and CSRs needs
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent leading-tight">
                  Results Oriented  {" "}
                  <span className="bg-gradient-to-r from-[#FF7A00] to-[#FF5722] bg-clip-text text-transparent">
                    Monitoring & Evalutions Systems
                  </span>
                </h1>
                <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                SIA is featured with Logical Frame Analysis (LFA) concept to monitor input/activities, output, outcomes and impact level indicators through systmatic use of ICT technologies.
                </p>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-6 md:gap-8 pt-6 md:pt-8 border-t border-gray-200/50 dark:border-gray-700/50">
                <div>
                  <div className="text-xl md:text-2xl font-bold text-[#FF7A00]">50+</div>
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Features</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold text-[#FF7A00]">24/7</div>
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Monitoring</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold text-[#FF7A00]">99.9%</div>
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Uptime</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold text-[#FF7A00]">10min</div>
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Setup Time</div>
                </div>
              </div>
            </div>
          </div>

          {/* Smooth transition to next section */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/50"></div>
        </section>

        {/* Core Features Section */}
        <section className="relative py-20 md:py-32">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="text-center space-y-4 mb-16">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Core Features
                </h2>
                <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                  Everything you need to monitor, evaluate, and optimize your projects
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {features.map((feature, index) => (
                  <div key={index} className="group">
                    <div className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 h-full">
                      <div className="space-y-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#FF7A00] to-[#FF5722] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <feature.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                        </div>
                        <div className="space-y-2">
                          {feature.benefits.map((benefit, benefitIndex) => (
                            <div key={benefitIndex} className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-[#FF7A00] flex-shrink-0" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Additional Features Section */}
        <section className="relative py-20 md:py-32 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="text-center space-y-4 mb-16">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Additional Capabilities
                </h2>
                <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                  Advanced tools to take your monitoring and evaluation to the next level
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    icon: TrendingUp,
                    title: "Advanced Analytics",
                    description: "Deep dive into your data with advanced statistical analysis and trend identification."
                  },
                  {
                    icon: Database,
                    title: "Data Integration",
                    description: "Connect with 500+ external tools and databases for comprehensive data collection."
                  },
                  {
                    icon: FileText,
                    title: "Custom Reports",
                    description: "Generate professional reports with customizable templates and automated scheduling."
                  },
                  {
                    icon: Clock,
                    title: "Time Tracking",
                    description: "Monitor project timelines and resource allocation with built-in time tracking tools."
                  }
                ].map((feature, index) => (
                  <div key={index} className="backdrop-blur-xl bg-white/30 dark:bg-gray-800/30 rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-[#FF7A00] to-[#FF5722] rounded-lg flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison Section */}
        <section className="relative py-20 md:py-32">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-5xl mx-auto">
              <div className="text-center space-y-4 mb-16">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Why Choose tanX?
                </h2>
                <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                  See how we compare to traditional monitoring and evaluation approaches
                </p>
              </div>

              <div className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 rounded-2xl p-8 border border-white/20 dark:border-gray-700/20 shadow-xl">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✗</span>
                      </div>
                      Traditional M&E
                    </h3>
                    <ul className="space-y-2">
                      {[
                        "Manual data collection and entry",
                        "Limited real-time insights",
                        "Time-consuming report generation",
                        "Scattered data across multiple systems",
                        "High operational costs",
                        "Prone to human error"
                      ].map((item, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-[#FF7A00] to-[#FF5722] rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      SIA MIS Platform
                    </h3>
                    <ul className="space-y-2">
                      {[
                        "Automated data collection and processing",
                        "Real-time dashboards and insights",
                        "One-click professional reports",
                        "Centralized data management",
                        "Cost-effective scaling",
                        "AI-powered accuracy and validation"
                      ].map((item, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <div className="w-2 h-2 bg-[#FF7A00] rounded-full"></div>
                          {item}
                        </li>
                      ))}
                    </ul>
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
