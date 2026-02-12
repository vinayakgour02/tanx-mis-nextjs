import Image from "next/image"
import { ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
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
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center max-w-7xl mx-auto">
          <div className="flex flex-col justify-center space-y-6 md:space-y-8 order-2 lg:order-1">
            <div className="space-y-4 md:space-y-6">
              {/* <div className="inline-block">
                <span className="px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium bg-gradient-to-r from-[#FF7A00]/10 to-[#FF5722]/10 text-[#FF7A00] border border-[#FF7A00]/20 backdrop-blur-sm shadow-lg">
                  🚀 Transform Your Impact
                </span>
              </div> */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent leading-tight">
                
                <span className="bg-gradient-to-r from-[#FF7A00] to-[#FF5722] bg-clip-text text-transparent">
                  Social Impact Analysis - MIS {" "}
                </span>
                <span className="text-black">
                  Platform
                </span>
              </h1>
              <p className="max-w-[600px] text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                tanX Innovations helps NGOs, CSRs, FPOs and developement organizations through providing IT based Innovative solutions that helps in tracking social impact, project management and reportings.
              </p>
            </div>

            {/* <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-gradient-to-r from-[#FF7A00] to-[#FF5722] hover:from-[#FF5722] hover:to-[#FF7A00] text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-6 md:px-8 py-4 md:py-6 text-base md:text-lg group">
                Request Demo
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                className="border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 backdrop-blur-sm px-6 md:px-8 py-4 md:py-6 text-base md:text-lg transition-all duration-300 hover:scale-105 group bg-transparent"
              >
                <Play className="mr-2 h-4 w-4 md:h-5 md:w-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </div> */}

            {/* Stats */}
            <div className="flex flex-wrap gap-6 md:gap-8 pt-6 md:pt-8 border-t border-gray-200/50 dark:border-gray-700/50">
              <div>
                <div className="text-xl md:text-2xl font-bold text-[#FF7A00]">500+</div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Organizations</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-[#FF7A00]">2M+</div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Data Points</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-[#FF7A00]">99.9%</div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Uptime</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center order-1 lg:order-2">
            <div className="relative w-full max-w-lg">
              {/* Floating Elements - Hidden on mobile */}
              <div className="hidden md:block absolute -top-4 -left-4 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-[#FF7A00] to-[#FF5722] rounded-full opacity-60 animate-pulse"></div>
              <div className="hidden md:block absolute -bottom-8 -right-8 w-8 h-8 md:w-12 md:h-12 bg-gradient-to-r from-[#FF5722] to-[#FF7A00] rounded-full opacity-40 animate-pulse delay-1000"></div>

              {/* Main Dashboard Container */}
              <div className="relative">
                <div className="transform md:hover:scale-105 transition-transform duration-700 ease-out">
                  <div className="relative backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 rounded-2xl md:rounded-3xl p-2 md:p-4 border border-white/20 dark:border-gray-700/20 shadow-2xl hover:shadow-3xl transition-all duration-500">
                    {/* Browser Chrome */}
                    <div className="flex items-center gap-2 mb-2 md:mb-4 px-2 md:px-4 py-2 md:py-3 bg-gray-100 dark:bg-gray-700 rounded-t-xl md:rounded-t-2xl">
                      <div className="flex gap-1 md:gap-2">
                        <div className="w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full"></div>
                        <div className="w-2 h-2 md:w-3 md:h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="bg-white dark:bg-gray-600 rounded-full px-2 md:px-4 py-0.5 md:py-1 text-xs text-gray-600 dark:text-gray-300">
                          org-dashboard
                        </div>
                      </div>
                    </div>

                    {/* Dashboard Image */}
                    <div className="relative overflow-hidden rounded-xl md:rounded-2xl">
                      <Image
                        src="/dashboard.png"
                        alt="tanX Dashboard - Real-time analytics and project monitoring"
                        width={600}
                        height={400}
                        className="object-cover w-full h-auto"
                        priority
                      />

                      {/* Overlay Glow */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#FF7A00]/10 via-transparent to-[#FF5722]/10 pointer-events-none"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF7A00]/20 to-[#FF5722]/20 rounded-2xl md:rounded-3xl blur-2xl md:blur-3xl transform rotate-3 md:rotate-6 -z-10"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Smooth transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/50"></div>
    </section>
  )
}
