"use client"

import { useEffect, useState } from "react"
import { BarChart3, LineChart, PieChart, Activity, Database, Server } from "lucide-react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

interface MISLoadingProps {
  message?: string
  showProgress?: boolean
  className?: string
}

export function MISLoading({ message = "Loading system data", showProgress = false, className }: MISLoadingProps) {
  const [progress, setProgress] = useState(13)
  const [currentMessage, setCurrentMessage] = useState("")
  const [messageIndex, setMessageIndex] = useState(0)

  const loadingMessages = [
    "Loading system data",
    "Processing analytics",
    "Preparing dashboard",
    "Fetching reports",
    "Initializing modules",
  ]

  // Simulate progress
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          return 100
        }
        // Randomize progress increments for natural feel
        const increment = Math.floor(Math.random() * 8) + 2
        return Math.min(prevProgress + increment, 100)
      })
    }, 400)

    return () => clearTimeout(timer)
  }, [progress])

  // Rotate through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Typewriter effect for messages
  useEffect(() => {
    const message = loadingMessages[messageIndex]
    let index = 0
    setCurrentMessage("")

    const typingInterval = setInterval(() => {
      if (index < message.length) {
        setCurrentMessage((prev) => prev + message.charAt(index))
        index++
      } else {
        clearInterval(typingInterval)
      }
    }, 50)

    return () => clearInterval(typingInterval)
  }, [messageIndex])

  return (
    <div
      className={cn(
        "flex min-h-[400px] w-full flex-col items-center justify-center gap-8 rounded-lg bg-gradient-to-b from-background to-background/80 p-10",
        className,
      )}
    >
      {/* Logo and spinner */}
      <div className="relative flex items-center justify-center">
        <div className="absolute  rounded-full h-24 w-24" />
        <div className="absolute animate-spin duration-3000 h-20 w-20 rounded-full border-b-2 border-primary" />
        <div className="absolute animate-spin duration-3000 delay-150 h-16 w-16 rounded-full border-l-2 border-primary/70" />
        <div className="z-10 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-primary-foreground shadow-lg">
          <Database className="h-6 w-6" />
        </div>
      </div>

      {/* Data visualization animations */}
      <div className="flex gap-8 items-center">
        <div className="data-icon-container">
          <BarChart3 className="data-icon text-primary/80" />
        </div>
        <div className="data-icon-container delay-300">
          <LineChart className="data-icon text-primary/80" />
        </div>
        <div className="data-icon-container delay-600">
          <PieChart className="data-icon text-primary/80" />
        </div>
        <div className="data-icon-container delay-900">
          <Activity className="data-icon text-primary/80" />
        </div>
        <div className="data-icon-container delay-1200">
          <Server className="data-icon text-primary/80" />
        </div>
      </div>

      {/* Progress indicator */}
      {showProgress && (
        <div className="w-full max-w-md space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{currentMessage}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* Skeleton UI elements */}
      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-1 md:col-span-2 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-24" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8" />
          <Skeleton className="h-40" />
          <Skeleton className="h-8 w-2/3" />
        </div>
      </div>

      <style jsx>{`
        .data-icon-container {
          animation: float 3s ease-in-out infinite;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .data-icon {
          height: 24px;
          width: 24px;
          opacity: 0.8;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-600 {
          animation-delay: 0.6s;
        }
        
        .delay-900 {
          animation-delay: 0.9s;
        }
        
        .delay-1200 {
          animation-delay: 1.2s;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  )
}
