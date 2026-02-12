import { BarChart3, Globe, Zap, FileText, Shield, Users } from "lucide-react"

const features = [
  {
    icon: BarChart3,
    title: "Real-Time Dashboards",
    description:
      "Visualize your project data with customizable dashboards that update in real-time with beautiful charts and insights.",
    delay: "100",
  },
  {
    icon: Globe,
    title: "Data Collection from Anywhere",
    description: "Collect data from the field with our mobile app, even in offline environments with automatic sync.",
    delay: "200",
  },
  {
    icon: Zap,
    title: "Logical Framework Analysis",
    description: "Create project specific Logical Framework Analysis (LFA) aligned with NGOs program and organiztion level indicators for effective monitoring.",
    delay: "300",
  },
  {
    icon: FileText,
    title: "Automated Compliance & Reporting",
    description: "Generate donor-ready reports with a single click, ensuring compliance with international standards.",
    delay: "400",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level security with end-to-end encryption, role-based access control, and audit trails.",
    delay: "500",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Seamlessly collaborate with team members, stakeholders, and partners in real-time.",
    delay: "600",
  },
]

export function Features() {
  return (
    <section id="features" className="py-16 md:py-20 lg:py-24 relative bg-gray-50/50 dark:bg-gray-900/50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:20px_20px] opacity-30"></div>

      {/* Smooth transition from hero */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-gray-50/50 dark:from-gray-900/50 to-transparent"></div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-6 md:space-y-8 text-center mb-12 md:mb-16">
          <div className="space-y-4">
            <div className="inline-block rounded-full bg-gradient-to-r from-[#FF7A00]/10 to-[#FF5722]/10 px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm text-[#FF7A00] border border-[#FF7A00]/20 backdrop-blur-sm shadow-lg">
              ✨ Features
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Powerful Tools for Effective Monitoring
            </h2>
            <p className="max-w-[900px] text-lg md:text-xl text-gray-600 dark:text-gray-300">
              Everything you need to track, analyze, and improve your project outcomes with cutting-edge technology.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-12 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl md:rounded-3xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 p-6 md:p-8 border border-white/20 dark:border-gray-700/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 animate-fade-in-up hover:bg-white/80 dark:hover:bg-gray-800/80"
              style={{ animationDelay: `${feature.delay}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF7A00]/5 to-[#FF5722]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex flex-col items-start gap-4 md:gap-6">
                  <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-xl md:rounded-2xl bg-gradient-to-br from-[#FF7A00]/20 to-[#FF5722]/20 text-[#FF7A00] group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <feature.icon className="h-6 w-6 md:h-8 md:w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-gray-900 dark:text-white group-hover:text-[#FF7A00] transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
