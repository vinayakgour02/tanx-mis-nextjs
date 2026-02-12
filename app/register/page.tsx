'use client'

import { OrganizationRegistrationForm } from '@/components/forms/OrganizationRegistrationForm'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function RegisterPage() {
  const router = useRouter()
  
  useEffect(() => {
    const status = localStorage.getItem("orgStatus")
    if (status === "UNDER_REVIEW") {
      router.replace("/under-review")
    } 
  }, [router])
  
  return (
    <div className="min-h-screen bg-slate-50 relative selection:bg-orange-100 selection:text-orange-900">
      
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-orange-400 opacity-20 blur-[100px]"></div>
        <div className="absolute right-0 bottom-0 -z-10 h-[310px] w-[310px] rounded-full bg-blue-400 opacity-20 blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Let's build your <span className="text-orange-600">Workspace</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Complete your organization profile and select a plan to unlock the full potential of our platform.
          </p>
        </div>
        
        <OrganizationRegistrationForm />
      </div>
    </div>
  )
}