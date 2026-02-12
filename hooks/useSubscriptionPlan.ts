"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import {Organization} from "@/types/organization"

type SubscriptionPlan = {
  id: number
  name: string
  type: string
  description?: string
  price?: number
  durationInDays: number
  projectsAllowed?: number
  PagesAllowed?: number
}

type OrganizationSubscription = {
  id: number
  organizationId: string
  planId: number
  startDate: string
  endDate: string
  isActive: boolean
  paymentStatus: string
  paymentMode?: string
  referenceNumber?: string
  notes?: string
  plan: SubscriptionPlan
}

export function useOrganizationSubscription() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrganization = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch("/api/organizations/profile", {
        method: "GET",
      })


      if (!res.ok) {
        throw new Error(`Failed to load organization: ${res.statusText}`)
      }

      const data = await res.json()
      setOrganization(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load organization"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrganization()
  }, [fetchOrganization])

  return {
    organization,
    subscription: organization?.subscription ?? null,
    subscriptionPlan: organization?.subscriptionPlan ?? null,
    loading,
    error,
    refetch: fetchOrganization,
  }
}
