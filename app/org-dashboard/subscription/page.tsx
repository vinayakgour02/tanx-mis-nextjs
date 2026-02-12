"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Check, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Mail,
  ArrowUpRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useOrganizationSubscription } from "@/hooks/useSubscriptionPlan"
import { subscriptionPlans } from "@/config/subscriptionPlans"

// Static content from Doc
const commonFeatures = [
  "Complete Access to All Features of SIA MIS platform",
  "Training of project team on effective use of platform",
  "Create/update Organization Profile & Result Framework",
  "Create Project Profile, LFA, Assigned Team, Activities",
  "User friendly import and export options (Excel)",
  "Access to Mobile App (GPS, Photos) for all members",
  "Unlimited upload of real-time reports & evidence",
  "Dashboards: Plan vs Progress, Indicator tracking",
  "Download raw data on excel for analysis"
]

const onCallServices = [
  "Theory of change & result framework design",
  "Design of SMART indicators",
  "Logical framework analysis (LFA) development",
  "Comprehensive MEL Plan development",
  "Capacity Building of team on MEL aspects",
  "Baseline, Mid-term and Endline Evaluations"
]

export default function SubscriptionPage() {
  const { organization, subscription, subscriptionPlan, loading } =
    useOrganizationSubscription()

    console.log("subscriptionPlan", subscriptionPlan)

  // Default to the currently active plan value if available, else null
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [recentRequests, setRecentRequests] = useState<any[]>([])
  const [isUpgrading, setIsUpgrading] = useState(false)

  useEffect(() => {
    if (!organization) return
    fetch(`/api/organizations/${organization.id}/subscription/requests`)
      .then((res) => res.json())
      .then((data) => setRecentRequests(data))
      .catch((err) => console.error(err))
  }, [organization])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  if (!organization) {
    return <div className="p-6 text-red-500">Organization not found.</div>
  }

  const daysRemaining =
    subscription?.endDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(subscription.endDate).getTime() -
              new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : null

  const handleUpgrade = async () => {
    if (!selectedPlan) return
    setIsUpgrading(true)

    try {
      const res = await fetch(
        `/api/organizations/${organization.id}/subscription/upgrade`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: selectedPlan }),
        },
      )

      if (!res.ok) throw new Error("Failed to upgrade plan")
      
      // Optional: Add a toast notification here
      window.location.reload()
    } catch (err) {
      console.error(err)
    } finally {
      setIsUpgrading(false)
    }
  }

  const formatCurrency = (amount: number | string) => {
    if (amount === "custom") return "Contact Us";
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount));
  }

  return (
    <div className="p-6 space-y-8 bg-white text-slate-900 max-w-7xl mx-auto">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscription & Billing</h1>
          <p className="text-slate-500 mt-1">Manage your plan, projects limit, and features.</p>
        </div>
        {subscriptionPlan && (
           <Badge variant="outline" className="px-4 py-1 border-orange-200 bg-orange-50 text-orange-700 text-sm">
              Status: {subscription?.isActive ? "Active" : "Inactive"}
           </Badge>
        )}
      </div>

      <Separator />

      {/* Current Plan Card */}
      <Card className="border border-orange-200 shadow-sm bg-orange-50/30 overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-orange-800">
            <Sparkles className="h-5 w-5 text-orange-600" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
               <p className="text-sm text-slate-500 mb-1">Plan Tier</p>
               <p className="text-2xl font-bold text-slate-900">{subscriptionPlan?.name || "No Active Plan"}</p>
               <p className="text-sm text-slate-600">{subscriptionPlan?.type}</p>
            </div>
            
            <div>
               <p className="text-sm text-slate-500 mb-1">Projects Limit</p>
               <div className="flex items-baseline gap-1">
                 <p className="text-2xl font-bold text-slate-900">{subscriptionPlan?.projectsAllowed ?? 0}</p>
                 <span className="text-sm text-slate-500">active projects</span>
               </div>
            </div>

            <div>
               <p className="text-sm text-slate-500 mb-1">Renewal Date</p>
               <p className="text-2xl font-bold text-slate-900">
                 {subscription?.endDate ? format(new Date(subscription.endDate), "dd MMM yyyy") : "N/A"}
               </p>
               {daysRemaining !== null && (
                  <p className="text-sm font-medium text-orange-600">
                    {daysRemaining} days remaining
                  </p>
               )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Section */}
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Available Plans</h2>
          <p className="text-slate-500 text-sm">Select a plan to request an upgrade. Annual tanX offers include significant savings.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {subscriptionPlans.map((plan) => {
            console.log("PLANS: ",plan);
            const isSelected = selectedPlan === plan.value;
            const isCurrent = subscriptionPlan?.type === plan.value;

            return (
              <Card
                key={plan.value}
                onClick={() => !isCurrent && setSelectedPlan(plan.value)}
                className={cn(
                  "relative flex flex-col transition-all duration-200",
                  isCurrent 
                    ? "border-slate-200 bg-slate-50 cursor-default opacity-80" 
                    : "cursor-pointer hover:shadow-lg hover:border-orange-300",
                  isSelected 
                    ? "border-orange-500 ring-1 ring-orange-500 shadow-md bg-white z-10" 
                    : "border-slate-200 bg-white"
                )}
              >
                {/* Savings Badge */}
                {plan.savings > 0 && !isCurrent && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg">
                      SAVE {formatCurrency(plan.savings)}
                    </div>
                  </div>
                )}

                <CardHeader className="pb-4">
                   <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-bold">{plan.label}</CardTitle>
                        <CardDescription className="text-xs uppercase tracking-wider font-medium text-slate-500 mt-1">
                          {plan.tier}
                        </CardDescription>
                      </div>
                   </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-grow">
                   {/* Price */}
                   <div>
                      {typeof plan.price === 'number' && plan.price > 0 ? (
                        <>
                          <div className="text-xs text-slate-400 line-through font-medium">
                            {formatCurrency(plan.originalPrice)}
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-900">{formatCurrency(plan.price)}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">incl. GST / Year</span>
                        </>
                      ) : plan.price === 0 ? (
                        <div className="pt-4">
                          <span className="text-2xl font-bold text-slate-900">Free</span>
                          <p className="text-xs text-slate-500">Trial / 12 Months</p>
                        </div>
                      ) : (
                        <div className="pt-4">
                          <span className="text-xl font-bold text-slate-900">Contact Us</span>
                          <p className="text-xs text-slate-500">for quotation</p>
                        </div>
                      )}
                   </div>

                   <Separator />

                   {/* Features */}
                   <ul className="space-y-2.5">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-slate-600 leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-2">
                   {isCurrent ? (
                     <Button variant="outline" disabled className="w-full bg-slate-100 text-slate-500 border-slate-200">
                        Current Plan
                     </Button>
                   ) : (
                     <Button 
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "w-full",
                          isSelected 
                            ? "bg-orange-600 hover:bg-orange-700 text-white border-transparent" 
                            : "text-slate-600 hover:text-orange-600 hover:border-orange-200"
                        )}
                      >
                        {isSelected ? <><CheckCircle2 className="mr-2 h-4 w-4"/> Selected</> : "Select Plan"}
                     </Button>
                   )}
                </CardFooter>
              </Card>
            )
          })}
        </div>

        <div className="flex justify-end pt-4">
          <Button
            size="lg"
            className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
            onClick={handleUpgrade}
            disabled={!selectedPlan || isUpgrading}
          >
            {isUpgrading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Request...
              </>
            ) : (
              <>
                Request Upgrade <ArrowUpRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Services Included Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-8 border-t border-slate-200">
         {/* Standard Services */}
         <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Included in Subscription</h3>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
               <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                 {commonFeatures.map((service, i) => (
                   <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                     <div className="h-1.5 w-1.5 rounded-full bg-orange-400 mt-2 shrink-0" />
                     {service}
                   </li>
                 ))}
               </ul>
            </div>
         </div>

         {/* On Call Services */}
         <div className="lg:col-span-1">
           <h3 className="text-lg font-semibold text-slate-900 mb-4">On-Call Services</h3>
           <div className="bg-slate-900 rounded-xl p-6 text-slate-100 h-full flex flex-col justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-4 uppercase tracking-wider font-medium">Available on Request</p>
                <ul className="space-y-3">
                  {onCallServices.map((service, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Sparkles className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
                      <span className="leading-tight text-slate-200">{service}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-700">
                 <a href="mailto:ceo@tanxinnovations.com" className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-medium">
                   <Mail size={16} /> Contact for Quotation
                 </a>
              </div>
           </div>
         </div>
      </div>

      {/* Recent Requests Section */}
      <div className="pt-8 border-t border-slate-200">
        <h2 className="text-lg font-semibold mb-4 text-slate-900">Recent Upgrade Requests</h2>
        {recentRequests.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-500">
            No recent subscription requests found.
          </div>
        ) : (
          <div className="rounded-md border border-slate-200 overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {recentRequests.map((req) => (
                <li
                  key={req.id}
                  className="p-4 bg-white hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-2"
                >
                  <div className="flex flex-col">
                     <span className="font-medium text-slate-900">{req.planName}</span>
                     <span className="text-xs text-slate-500">Requested on {format(new Date(req.requestedAt), "dd MMM yyyy, hh:mm a")}</span>
                  </div>
                  
                  <Badge 
                    className={cn(
                      "w-fit",
                      req.status === "APPROVED" && "bg-green-100 text-green-700 hover:bg-green-100",
                      req.status === "PENDING" && "bg-orange-100 text-orange-700 hover:bg-orange-100",
                      req.status === "REJECTED" && "bg-red-100 text-red-700 hover:bg-red-100",
                    )}
                    variant="secondary"
                  >
                    {req.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}