"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { ArrowRight, Search, MessageCircle, Phone, Mail, Book, Video, Users, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HelpCenter() {
  const [isDark, setIsDark] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

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

  const supportOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Get instant help from our support team",
      availability: "24/7 Available",
      action: "Start Chat",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with our experts",
      availability: "Mon-Fri 9AM-6PM",
      action: "Call Now",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us detailed questions anytime",
      availability: "Response within 4 hours",
      action: "Send Email",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Users,
      title: "Community Forum",
      description: "Connect with other tanX users",
      availability: "Active Community",
      action: "Visit Forum",
      color: "from-[#FF7A00] to-[#FF5722]"
    }
  ]

  const helpCategories = [
    {
      icon: Book,
      title: "Getting Started",
      description: "Learn the basics of using tanX",
      articles: 12
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Step-by-step video guides",
      articles: 25
    },
    {
      icon: Users,
      title: "Account Management",
      description: "Manage your account and billing",
      articles: 8
    },
    {
      icon: MessageCircle,
      title: "Data Collection",
      description: "Set up and manage data collection",
      articles: 18
    }
  ]

  const faqs = [
    {
      question: "How do I get started with tanX?",
      answer: "Getting started with tanX is easy! Simply sign up for an account, complete the onboarding process, and you'll be guided through creating your first project. Our setup wizard will help you configure data collection and create your first dashboard in under 15 minutes."
    },
    {
      question: "What types of data can I collect with tanX?",
      answer: "tanX supports various data types including survey responses, financial data, GPS coordinates, photos, videos, and custom form fields. You can collect data through mobile apps, web forms, API integrations, and file uploads."
    },
    {
      question: "Is my data secure with tanX?",
      answer: "Yes, we take data security very seriously. All data is encrypted in transit and at rest using 256-bit encryption. We're SOC 2 compliant and follow international data protection standards including GDPR compliance."
    },
    {
      question: "Can I export my data from tanX?",
      answer: "Absolutely! You can export your data in various formats including Excel, CSV, PDF, and JSON. You can also use our API to programmatically access your data or set up automated exports."
    },
    {
      question: "How does pricing work?",
      answer: "We offer flexible pricing plans based on the number of projects and data points you need. We have plans for small organizations starting at $29/month, as well as enterprise plans for larger organizations. All plans include a 14-day free trial."
    },
    {
      question: "Do you provide training and onboarding?",
      answer: "Yes! We provide comprehensive onboarding for all new users, including live training sessions, documentation, video tutorials, and ongoing support. Enterprise customers also get dedicated account management and custom training sessions."
    }
  ]

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
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
                    🆘 Help Center
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent leading-tight">
                  How can we{" "}
                  <span className="bg-gradient-to-r from-[#FF7A00] to-[#FF5722] bg-clip-text text-transparent">
                    help you?
                  </span>
                </h1>
                <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Find answers to your questions, get support from our team, and learn how to get the most out of tanX.
                </p>
              </div>

              {/* Search Bar */}
              <div className="max-w-lg mx-auto relative">
                <div className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-lg p-2 flex items-center gap-2">
                  <Search className="w-5 h-5 text-gray-400 ml-2" />
                  <input 
                    type="text" 
                    placeholder="Search for help..." 
                    className="flex-1 bg-transparent border-none outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400"
                  />
                  <Button size="sm" className="bg-gradient-to-r from-[#FF7A00] to-[#FF5722] hover:from-[#FF5722] hover:to-[#FF7A00] text-white">
                    Search
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-6 md:gap-8 pt-6 md:pt-8 border-t border-gray-200/50 dark:border-gray-700/50">
                <div>
                  <div className="text-xl md:text-2xl font-bold text-[#FF7A00]">24/7</div>
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Support</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold text-[#FF7A00]">100+</div>
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Help Articles</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold text-[#FF7A00]">&lt;5min</div>
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Response Time</div>
                </div>
              </div>
            </div>
          </div>

          {/* Smooth transition to next section */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/50"></div>
        </section>

        {/* Support Options */}
        <section className="relative py-20 md:py-32">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="text-center space-y-4 mb-16">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Get Support
                </h2>
                <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                  Choose the support option that works best for you
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {supportOptions.map((option, index) => (
                  <div key={index} className="group">
                    <div className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 h-full">
                      <div className="space-y-4 text-center">
                        <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${option.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <option.icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{option.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400">{option.description}</p>
                          <div className="flex items-center justify-center gap-2 text-sm text-[#FF7A00]">
                            <Clock className="w-4 h-4" />
                            {option.availability}
                          </div>
                        </div>
                        <Button className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF5722] hover:from-[#FF5722] hover:to-[#FF7A00] text-white">
                          {option.action}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Help Categories */}
        <section className="relative py-20 md:py-32 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="text-center space-y-4 mb-16">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Browse by Category
                </h2>
                <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                  Find help articles organized by topic
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {helpCategories.map((category, index) => (
                  <div key={index} className="group cursor-pointer">
                    <div className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="space-y-4 text-center">
                        <div className="w-12 h-12 mx-auto bg-gradient-to-br from-[#FF7A00] to-[#FF5722] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <category.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-[#FF7A00] transition-colors">{category.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">{category.description}</p>
                          <div className="text-sm text-[#FF7A00] font-medium">
                            {category.articles} articles
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="relative py-20 md:py-32">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="text-center space-y-4 mb-16">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Frequently Asked Questions
                </h2>
                <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                  Quick answers to the most common questions
                </p>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 rounded-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-white/20 dark:hover:bg-gray-700/20 transition-colors"
                    >
                      <span className="font-semibold text-gray-900 dark:text-white pr-4">{faq.question}</span>
                      {openFaq === index ? (
                        <ChevronUp className="w-5 h-5 text-[#FF7A00] flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    {openFaq === index && (
                      <div className="px-6 pb-6">
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="relative py-20 md:py-32 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Still Need Help?
                </h2>
                <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                  Our support team is standing by to help you succeed. Reach out to us anytime.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-gradient-to-r from-[#FF7A00] to-[#FF5722] hover:from-[#FF5722] hover:to-[#FF7A00] text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-8 py-6 text-lg group">
                  Contact Support
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" className="border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 backdrop-blur-sm px-8 py-6 text-lg transition-all duration-300 hover:scale-105">
                  Schedule a Call
                </Button>
              </div>

              <div className="pt-8 border-t border-gray-200/50 dark:border-gray-700/50">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="text-center space-y-2">
                    <Mail className="w-6 h-6 mx-auto text-[#FF7A00]" />
                    <div className="font-medium text-gray-900 dark:text-white">Email</div>
                    <div className="text-gray-600 dark:text-gray-400">info@tanxinnovations.com</div>
                  </div>
                  <div className="text-center space-y-2">
                    <Phone className="w-6 h-6 mx-auto text-[#FF7A00]" />
                    <div className="font-medium text-gray-900 dark:text-white">Phone</div>
                    <div className="text-gray-600 dark:text-gray-400">+91 98267 83036</div>
                  </div>
                  <div className="text-center space-y-2">
                    <Clock className="w-6 h-6 mx-auto text-[#FF7A00]" />
                    <div className="font-medium text-gray-900 dark:text-white">Hours</div>
                    <div className="text-gray-600 dark:text-gray-400">24/7 Support Available</div>
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
