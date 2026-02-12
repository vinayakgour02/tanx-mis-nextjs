"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"

import { ChevronLeft, ChevronRight, Check, FileText, Users, Target, Loader2 } from "lucide-react"
import assessmentData from "./assessment-data.json" // Updated import

// Helper component for form steps
const Step = ({ children, isActive }: { children: React.ReactNode; isActive: boolean }) => {
  return isActive ? <div className="w-full">{children}</div> : null
}

// Main component
export default function AssessmentForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false) // For submission loading state
  const [isCompleted, setIsCompleted] = useState(false) // Added completion state
  const [assessmentId, setAssessmentId] = useState<string | null>(null) // Track saved assessment ID
  const [formData, setFormData] = useState({
    organizationName: "",
    email: "",
    phone: "",
    headName: "",
    assessments: assessmentData.reduce(
      (acc, area) => {
        acc[area.id] = Array(area.indicators.length).fill(null)
        return acc
      },
      {} as Record<string, (number | null)[]>,
    ),
  })

  // New states to control collapsing behavior
  const indicatorRefs = useRef<Record<string, Record<number, HTMLDivElement | null>>>({})

  const totalSteps = assessmentData.length + 1 // +1 for the initial info step

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAssessmentChange = (areaId: string, indicatorIndex: number, value: number) => {
    // clone assessments and set the new value
    const nextAssessments = { ...formData.assessments, [areaId]: [...formData.assessments[areaId]] }
    nextAssessments[areaId][indicatorIndex] = value
    setFormData({ ...formData, assessments: nextAssessments })

    const area = assessmentData.find((a) => a.id === areaId)!
    const isLast = indicatorIndex >= area.indicators.length - 1

    if (!isLast) {
      centerQuestion(areaId, indicatorIndex + 1)
    }

    // auto-advance to the next step when this area is fully answered
    const areaIndex = assessmentData.findIndex((a) => a.id === areaId)
    const allAnswered = nextAssessments[areaId].every((v) => v !== null)
    if (areaIndex !== -1 && currentStep === areaIndex + 1 && allAnswered) {
      setTimeout(() => {
        if (currentStep === areaIndex + 1) {
          setCurrentStep(Math.min(currentStep + 1, totalSteps - 1))
        }
      }, 200)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "PDF generation failed.")
      }

      // Check if assessment ID is returned in response headers
      const responseAssessmentId = response.headers.get("X-Assessment-ID")
      if (responseAssessmentId) {
        setAssessmentId(responseAssessmentId)
        console.log(`Assessment saved with ID: ${responseAssessmentId}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url

      const disposition = response.headers.get("content-disposition")
      let filename = `MEL_Assessment_Report.pdf`
      if (disposition?.includes("attachment")) {
        const filenameMatch = /filename="([^"]+)"/.exec(disposition)
        if (filenameMatch?.[1]) {
          filename = filenameMatch[1]
        }
      }
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      setIsCompleted(true)
    } catch (err: any) {
      console.error("Failed to generate report:", err)
      alert(`Error: ${err.message || "Failed to generate report"}`) // Show error to user
    } finally {
      setIsLoading(false)
    }
  }

  const simulateStepFilling = async () => {
    for (let step = 0; step < totalSteps; step++) {
      setCurrentStep(step)
      if (step === 0) {
        setFormData((prev) => ({
          ...prev,
          organizationName: "Auto Org",
          phone: "7879647362",
          email: "vinayakgour2004@gmail.com",
          headName: "Jane Doe",
        }))
      } else {
        const area = assessmentData[step - 1]
        setFormData((prev) => ({
          ...prev,
          assessments: {
            ...prev.assessments,
            [area.id]: area.indicators.map(() => (Math.random() > 0.5 ? 1 : 0)),
          },
        }))
      }
      await new Promise((res) => setTimeout(res, 200)) // small delay
    }
  }

  const progressPercentage = (currentStep / (totalSteps - 1)) * 100
  const resetForm = () => {
    setIsCompleted(false)
    setCurrentStep(0)
    setAssessmentId(null) // Reset assessment ID
    setFormData({
      organizationName: "",
      email: "",
      phone: "",
      headName: "",
      assessments: assessmentData.reduce(
        (acc, area) => {
          acc[area.id] = Array(area.indicators.length).fill(null)
          return acc
        },
        {} as Record<string, (number | null)[]>,
      ),
    })
  }

  const isInfoStepValid = formData.organizationName && formData.email && formData.headName && formData.phone

  const centerQuestion = (areaId: string, qIndex: number) => {
    const el = indicatorRefs.current[areaId]?.[qIndex]
    if (!el) return

    // Wait for layout to be ready, then compute a true centered scroll
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect()
      const targetY = window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2
      window.scrollTo({ top: Math.max(targetY, 0), behavior: "smooth" })

      // Focus after we start scrolling to keep keyboard flow correct
      requestAnimationFrame(() => {
        const focusable = el.querySelector<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        )
        focusable?.focus()
      })
    })
  }

  const scrollToFirstQuestionInStep = (stepIndex: number) => {
    if (stepIndex < 1) return // step 0 is org info
    const area = assessmentData[stepIndex - 1]
    centerQuestion(area.id, 0)
  }

  // When currentStep changes, start at that step's first (unanswered) question and center it
  useEffect(() => {
    scrollToFirstQuestionInStep(currentStep)
  }, [currentStep])

  const CustomToggle = ({
    areaId,
    indicatorIndex,
    currentValue,
    onChange,
  }: {
    areaId: string
    indicatorIndex: number
    currentValue: number | null
    onChange: (value: number) => void
  }) => {
    return (
      <div className="flex items-center justify-center space-x-3">
        <button
          type="button"
          onClick={() => onChange(0)}
          className={`relative flex items-center justify-center px-6 py-3 rounded-2xl font-medium text-sm transition-all duration-300 transform hover:scale-105 ${
            currentValue === 0
              ? "bg-red-500 text-white shadow-lg shadow-red-200 border-2 border-red-500"
              : "bg-white text-red-600 border-2 border-red-200 hover:border-red-300 hover:bg-red-50"
          }`}
        >
          <Check size={16} className="mr-2" />
          No
          {currentValue === 0 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
          )}
        </button>

        <button
          type="button"
          onClick={() => onChange(1)}
          className={`relative flex items-center justify-center px-6 py-3 rounded-2xl font-medium text-sm transition-all duration-300 transform hover:scale-105 ${
            currentValue === 1
              ? "bg-green-500 text-white shadow-lg shadow-green-200 border-2 border-green-500"
              : "bg-white text-green-600 border-2 border-green-200 hover:border-green-300 hover:bg-green-50"
          }`}
        >
          <Check size={16} className="mr-2" />
          Yes
          {currentValue === 1 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen flex flex-col items-center justify-start font-sans p-4 sm:p-6">
      <div className="w-full max-w-3xl bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6 sm:p-8 md:p-10 my-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-50/30 rounded-full -translate-y-20 translate-x-20 blur-3xl"></div>

        {/* Success State */}
        {isCompleted ? (
          <div className="text-center py-12 relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full mb-6 shadow-lg">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Assessment Completed!</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Your MEL assessment has been successfully completed and your report has been generated.
            </p>
            {/* {assessmentId && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-green-800 font-medium">Assessment saved to database</p>
                <p className="text-green-600 text-sm mt-1">Assessment ID: <code className="bg-green-100 px-2 py-1 rounded">{assessmentId}</code></p>
              </div>
            )} */}
            <button
              onClick={resetForm}
              className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-[#FF7A00] to-orange-600 text-white font-semibold rounded-2xl hover:from-orange-600 hover:to-orange-700 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <FileText size={16} className="mr-2" />
              Start New Assessment
            </button>
          </div>
        ) : (
          <>
            {/* Assessment Form Content */}
            {/* <button
              type="button"
              onClick={simulateStepFilling}
              className="mb-6 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105 relative z-10"
            >
              Auto-Fill Form (Test)
            </button> */}

        <div className="text-center mb-8 sm:mb-10 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-18 sm:h-18 bg-gradient-to-br from-orange-100 to-orange-200 rounded-3xl mb-4 shadow-lg">
            <FileText className="w-8 h-8 sm:w-9 sm:h-9 text-[#FF7A00]" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-2 tracking-tight">
            MEL system Assessment - 5 star rating
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">Brief Methodology</p>
        </div>

        <div className="mb-8 sm:mb-10 relative z-10">
          <div className="relative">
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#FF7A00] via-orange-500 to-orange-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="absolute top-0 left-0 w-full h-full flex justify-between items-center">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shadow-lg ${
                    currentStep >= index
                      ? "bg-gradient-to-br from-[#FF7A00] to-orange-600 text-white scale-110"
                      : "bg-white text-slate-400 border-2 border-slate-200"
                  }`}
                >
                  {currentStep > index ? <Check size={12} className="sm:w-4 sm:h-4" /> : index + 1}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between mt-3">
            <span className="text-xs sm:text-sm font-semibold text-slate-700">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[#FF7A00]">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="overflow-hidden relative min-h-[400px] sm:min-h-[450px] z-10">
          <Step isActive={currentStep === 0}>
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 rounded-2xl mb-4">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Organization Details</h2>
              <p className="text-gray-600 text-sm sm:text-base">Tell us about your organization to get started</p>
            </div>
            <div className="space-y-5 max-w-md mx-auto">
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  name="organizationName"
                  id="organizationName"
                  value={formData.organizationName}
                  onChange={handleInfoChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF7A00] focus:ring-2 focus:ring-orange-100 transition-all duration-200 text-sm sm:text-base bg-white"
                  placeholder="Enter your organization name"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInfoChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF7A00] focus:ring-2 focus:ring-orange-100 transition-all duration-200 text-sm sm:text-base bg-white"
                  placeholder="your.email@organization.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="phone"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleInfoChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF7A00] focus:ring-2 focus:ring-orange-100 transition-all duration-200 text-sm sm:text-base bg-white"
                  placeholder="1234567891"
                  required
                />
              </div>
              <div>
                <label htmlFor="headName" className="block text-sm font-medium text-gray-700 mb-2">
                  Head of Organization
                </label>
                <input
                  type="text"
                  name="headName"
                  id="headName"
                  value={formData.headName}
                  onChange={handleInfoChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF7A00] focus:ring-2 focus:ring-orange-100 transition-all duration-200 text-sm sm:text-base bg-white"
                  placeholder="Full name of the head"
                  required
                />
              </div>
            </div>
          </Step>

          {assessmentData.map((area, index) => (
            <Step key={area.id} isActive={currentStep === index + 1}>
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl mb-4 shadow-lg">
                  <Target className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 px-2">{area.title}</h2>
                <p className="text-slate-600 text-sm sm:text-base px-2">
                  Evaluate each indicator based on your organization's current state
                </p>
              </div>

              <div className="flex items-center justify-end mb-4">
                <span className="text-xs sm:text-sm text-slate-600">
                  Answered {formData.assessments[area.id].filter((v) => v !== null).length}/{area.indicators.length}
                </span>
              </div>

              <div className="space-y-4 sm:space-y-5">
                {area.indicators.map((indicator, iIndex) => {
                  const currentValue = formData.assessments[area.id][iIndex]

                  return (
                    <div key={iIndex}>
                      <div
                        ref={(el) => {
                          indicatorRefs.current[area.id] = indicatorRefs.current[area.id] || {}
                          indicatorRefs.current[area.id][iIndex] = el
                        }}
                        className="bg-white/70 backdrop-blur-sm p-5 sm:p-6 rounded-3xl border border-slate-200/50 hover:border-slate-300/50 hover:shadow-lg transition-all duration-300 group overflow-hidden"
                      >
                        <p className="text-slate-800 font-medium mb-5 leading-relaxed text-sm sm:text-base">
                          <span className="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-br from-[#FF7A00] to-orange-600 text-white text-xs font-bold rounded-full mr-3 flex-shrink-0 shadow-md">
                            {iIndex + 1}
                          </span>
                          {indicator}
                        </p>

                        <CustomToggle
                          areaId={area.id}
                          indicatorIndex={iIndex}
                          currentValue={currentValue}
                          onChange={(value) => handleAssessmentChange(area.id, iIndex, value)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Step>
          ))}

          <div className="mt-8 sm:mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border-2 border-slate-300 text-sm font-semibold rounded-2xl text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              <ChevronLeft size={16} className="mr-2" />
              Previous
            </button>

            {currentStep < totalSteps - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={currentStep === 0 && !isInfoStepValid}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-2xl text-white bg-gradient-to-r from-[#FF7A00] to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                Next Step
                <ChevronRight size={16} className="ml-2" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 text-sm font-semibold rounded-2xl text-white transition-all duration-200 transform hover:scale-105 ${
                  isLoading
                    ? "bg-gradient-to-r from-orange-600 to-orange-700 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#FF7A00] to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg"
                } focus:outline-none focus:ring-4 focus:ring-orange-200`}
              >
                {isLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Check size={16} className="mr-2" />}
                {isLoading ? "Submitting..." : "Submit Assessment"}
              </button>
            )}
          </div>
        </form>
        </>
        )}
      </div>
    </div>
  )
}
