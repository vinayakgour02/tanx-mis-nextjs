'use client'

import { Suspense } from 'react'
import { LoginForm } from './login-form'
import { Command } from 'lucide-react' // Using Command icon as a placeholder logo
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* LEFT COLUMN: Branding & Aesthetic */}
      <div className="hidden bg-orange-600 lg:flex flex-col relative justify-between p-10 text-white overflow-hidden">
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-40 w-80 h-80 bg-gradient-to-br from-orange-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-gray-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-gradient-to-br from-gray-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

        <div className="absolute inset-0 bg-orange-600 dark:bg-gray-900">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

      </div>

      
        
        {/* Logo Area */}
        <div className="relative z-10 flex items-center text-lg font-medium">
          <Image src="/sia.png" alt="SIA MIS Logo" width={32} height={32} className="mr-2 rounded-full" />
          SIA MIS
        </div>

        {/* Testimonial / Value Prop Area */}
        <div className="relative z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-md text-zinc-200">
              &ldquo;Tracking progress, activities, and outcomes is now consistent and data-driven across all programs.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>

      {/* RIGHT COLUMN: The Form */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto grid w-full max-w-[400px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground text-zinc-500">
              Enter your email below to login to your account
            </p>
          </div>

          <Suspense fallback={<div className="text-orange-600 text-center text-sm">Loading form...</div>}>
            <LoginForm />
          </Suspense>

          <p className="px-8 text-center text-sm text-zinc-500">
            By clicking continue, you agree to our{" "}
            <a href="/terms" className="underline underline-offset-4 hover:text-orange-600">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline underline-offset-4 hover:text-orange-600">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}