"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { 
  Check, 
  Loader2, 
  Building2, 
  MapPin, 
  CreditCard, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2,
  Phone,
  HelpCircle,
  Mail
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// ---------------- Configuration ----------------

// Aligned strictly with the backend enum requirements
const PLAN_VALUES = ["DEMO", "BASIC_ANNUAL", "PREMIUM_ANNUAL", "ADVANCE_ANNUAL"] as const;

const subscriptionPlans = [
  {
    value: "DEMO",
    label: "Trial Version",
    tier: "Single Project",
    price: 0,
    originalPrice: 0,
    savings: 0,
    features: [
      "Single Project",
      "Free for 12 months",
      "Full platform access"
    ],
    highlight: "Free Trial",
    color: "blue"
  },
  {
    value: "BASIC_ANNUAL",
    label: "Basic Plan",
    tier: "10 Projects",
    price: 118000,
    originalPrice: 141600, // From doc: 12216 * 10 = ~122k, but doc says 1,41,600 total
    savings: 23600,
    features: [
      "Up to 10 Projects",
      "Base rate @ ₹1000/proj/mo",
      "tanX Annual Offer"
    ],
    highlight: "Popular",
    color: "emerald"
  },
  {
    value: "PREMIUM_ANNUAL",
    label: "Premium Plan",
    tier: "20 Projects",
    price: 212400,
    originalPrice: 283200,
    savings: 70800,
    features: [
      "Up to 20 Projects",
      "Base rate @ ₹1000/proj/mo",
      "Best Value Offer"
    ],
    highlight: "Best Value",
    recommended: true,
    color: "orange"
  },
  {
    value: "ADVANCE_ANNUAL",
    label: "Customized",
    tier: "Enterprise",
    price: "custom",
    features: [
      "Above 20 Projects",
      "Custom Quotation",
      "Dedicated Support"
    ],
    highlight: "Scale",
    color: "slate"
  },
]

const commonFeatures = [
  "Create Organization Profile & Result Framework",
  "LFA, Team Assignment, Activity Planning",
  "SIA MIS Mobile App Access (GPS, Photos)",
  "Real-time Reports & Evidences",
  "Dashboards (Plan vs Progress, Indicator Tracking)",
  "Excel Import/Export Capabilities"
]

const onCallServices = [
  "Theory of Change & Result Framework Design",
  "SMART Indicator Design",
  "Logical Framework Analysis (LFA) Development",
  "comprehensive MEL Plan Development",
  "Baseline, Mid-term and Endline Evaluations"
]

const organizationTypes = ["NGO", "CSR", "TRUST", "FOUNDATION", "COMPANY"]

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["NGO", "CSR", "TRUST", "FOUNDATION", "COMPANY"]),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  subscriptionPlan: z.enum(PLAN_VALUES),
})

export function OrganizationRegistrationForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "NGO",
      email: "",
      subscriptionPlan: "DEMO",
      country: "India",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      // Simulation of API call
      await new Promise(resolve => setTimeout(resolve, 1500)) 
      
      console.log("Submitting values:", values) // Debugging

      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) throw new Error("Failed to register")
      
      localStorage.setItem("orgStatus", "UNDER_REVIEW")
      toast.success("Organization registered successfully.")
      router.push("/under-review")
    } catch (error) {
      toast.error("Failed to register organization. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number | string) => {
    if (amount === "custom") return "Contact Us";
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-20 max-w-5xl mx-auto">
        
        {/* --- SECTION 1: ORGANIZATION --- */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                <Building2 size={20} />
              </div>
              <div>
                <CardTitle className="text-lg">Organization Details</CardTitle>
                <CardDescription>Legal information about your entity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme Foundation" className="bg-slate-50 border-slate-200 focus:bg-white transition-colors" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entity Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {organizationTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Official Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contact@org.com" className="bg-slate-50 border-slate-200 focus:bg-white" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input maxLength={10} placeholder="+91..." className="bg-slate-50 border-slate-200 focus:bg-white" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* --- SECTION 2: LOCATION --- */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <MapPin size={20} />
              </div>
              <div>
                <CardTitle className="text-lg">Location</CardTitle>
                <CardDescription>Where is your headquarters located?</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Floor, Building, Street..." 
                      className="resize-none min-h-[80px] bg-slate-50 border-slate-200 focus:bg-white" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State/Province</FormLabel>
                  <FormControl>
                    <Input placeholder="Delhi" className="bg-slate-50 border-slate-200 focus:bg-white" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="India" className="bg-slate-50 border-slate-200 focus:bg-white" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* --- SECTION 3: PLAN SELECTION --- */}
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                <CreditCard size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">SIA MIS Platform Subscription</h2>
                <p className="text-sm text-slate-500">Choose a plan that fits your project scale. Annual tanX Offers available.</p>
              </div>
            </div>
          </div>

          <FormField
            control={form.control}
            name="subscriptionPlan"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {subscriptionPlans.map((plan) => {
                      const isSelected = field.value === plan.value;
                      const isRecommended = plan.recommended;
                      
                      return (
                        <div 
                          key={plan.value}
                          onClick={() => field.onChange(plan.value)}
                          className={cn(
                            "relative group cursor-pointer rounded-2xl border-2 p-5 transition-all duration-200 flex flex-col h-full bg-white",
                            isSelected 
                              ? "border-slate-900 ring-1 ring-slate-900 shadow-xl scale-[1.02] z-10" 
                              : "border-slate-100 hover:border-slate-300 hover:shadow-md",
                            isRecommended && !isSelected ? "border-orange-200 bg-orange-50/30" : ""
                          )}
                        >
                          {/* Badges */}
                          <div className="absolute top-0 right-0 p-3 flex flex-col items-end gap-1">
                            {plan.savings && plan.savings > 0 && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 font-bold text-[10px] px-2">
                                SAVE {formatCurrency(plan.savings || "")}
                              </Badge>
                            )}
                          </div>

                          {/* Header */}
                          <div className="mb-4 pr-6">
                            <h3 className={cn("font-bold text-lg", isSelected ? "text-slate-900" : "text-slate-700")}>
                              {plan.label}
                            </h3>
                            <div className="text-sm font-medium text-slate-500 bg-slate-100 inline-block px-2 py-0.5 rounded-md mt-1">
                              {plan.tier}
                            </div>
                          </div>

                          {/* Pricing */}
                          <div className="mb-6">
                            {typeof plan.price === 'number' && plan.price > 0 ? (
                              <div className="flex flex-col">
                                <span className="text-xs text-slate-400 line-through font-medium">
                                  {formatCurrency(plan.originalPrice || 0)}
                                </span>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-2xl font-bold text-slate-900">{formatCurrency(plan.price)}</span>
                                </div>
                                <span className="text-[10px] text-slate-500 mt-1">
                                  incl. GST / Year
                                </span>
                              </div>
                            ) : plan.price === 0 ? (
                              <div className="flex flex-col pt-4">
                                <span className="text-3xl font-bold text-slate-900">Free</span>
                                <span className="text-xs text-slate-500 mt-1">Trial / 12 Months</span>
                              </div>
                            ) : (
                              <div className="flex flex-col pt-4">
                                <span className="text-xl font-bold text-slate-900">Contact Us</span>
                                <span className="text-xs text-slate-500 mt-1">for quotation</span>
                              </div>
                            )}
                          </div>

                          <Separator className="mb-4" />

                          {/* Features */}
                          <div className="space-y-3 flex-grow">
                            {plan.features.map((feature, idx) => (
                              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                                <CheckCircle2 className={cn("h-4 w-4 shrink-0", isSelected ? "text-slate-900" : "text-slate-400")} />
                                <span className="leading-tight">{feature}</span>
                              </div>
                            ))}
                          </div>
                          
                          {/* Selection Indicator */}
                          <div className="mt-6 pt-2">
                            <div className={cn(
                              "w-full h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors border",
                              isSelected 
                                ? "bg-slate-900 text-white border-slate-900" 
                                : "bg-white text-slate-600 border-slate-200 group-hover:border-slate-300"
                            )}>
                              {isSelected ? "Selected Plan" : "Select Plan"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Included Services Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            
            {/* Common Features Panel */}
            <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-6">
               <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                 <CheckCircle2 className="text-emerald-600 h-5 w-5" />
                 Services Included in All Plans
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                 {commonFeatures.map((feature, i) => (
                   <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                     <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                     {feature}
                   </div>
                 ))}
               </div>
               <div className="mt-6 p-4 bg-white rounded-lg border border-slate-200 text-sm text-slate-600">
                  <span className="font-semibold text-slate-900 block mb-1">Key Benefit:</span>
                  Effective tracking of project progress using real-time reporting and analytical dashboards helps teams in improving decision making and reduces documentation burden.
               </div>
            </div>

            {/* On Call Services & Support */}
            <div className="bg-slate-900 text-slate-100 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="text-orange-400 h-5 w-5" />
                  On-Call Services
                </h4>
                <p className="text-xs text-slate-400 mb-4">Available on request for an additional fee:</p>
                <ul className="space-y-2 mb-6">
                  {onCallServices.slice(0, 4).map((service, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-orange-400 mt-0.5">+</span>
                      {service}
                    </li>
                  ))}
                  <li className="text-xs text-slate-400 italic pl-3">...and more customized support</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Need a custom quote or help?</p>
                <a 
                  href="mailto:ceo@tanxinnovations.com" 
                  className="flex items-center gap-2 text-sm font-medium text-white hover:text-orange-400 transition-colors"
                >
                  <Mail size={16} /> ceo@tanxinnovations.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* --- FOOTER ACTIONS --- */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => router.back()}
            disabled={isLoading}
            className="text-slate-500 hover:text-slate-900"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading} 
            size="lg" 
            className="bg-slate-900 hover:bg-slate-800 text-white min-w-[200px] shadow-lg shadow-slate-900/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Complete Setup <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}