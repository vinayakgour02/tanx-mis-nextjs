"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Hourglass } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function UnderReviewPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if localStorage has orgStatus
    const status = localStorage.getItem("orgStatus")
    if (!status || status !== "UNDER_REVIEW") {
      // If no status, redirect back to registration
      router.replace("/register")
    }
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md space-y-6">
        <Hourglass className="mx-auto h-16 w-16 text-yellow-500" />
        <h1 className="text-2xl font-bold">Your Organization is Under Review</h1>
        <p className="text-muted-foreground">
          Thank you for registering 🎉 <br /> Our team will verify your details and approve your
          account shortly.
        </p>

        <div className="rounded-lg border p-4 bg-muted/30">
          <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
            <CheckCircle className="h-5 w-5" />
            <span>Submission received successfully</span>
          </div>
        </div>

        <Button onClick={() => router.push("/")}>Go to Home</Button>
      </div>
    </div>
  )
}
