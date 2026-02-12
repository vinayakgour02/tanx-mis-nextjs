// src/config/subscriptionPlans.ts

export const subscriptionPlans = [
  {
    value: "DEMO",
    label: "Trial Version",
    tier: "Single Project",
    billingPeriod: "trial",
    price: 0,
    originalPrice: 0,
    savings: 0,
    durationInDays: 365, // Doc says "up to 12 months"
    projectsAllowed: 1,
    dashboardPages: 1,
    features: [
      "Single Project",
      "Free for 12 months", 
      "Full platform access"
    ],
    recommended: false,
  },
  {
    value: "BASIC_ANNUAL",
    label: "Basic Plan",
    tier: "10 Projects",
    billingPeriod: "annual",
    price: 118000,
    originalPrice: 141600, // Derived from doc: 12216 * 10 is approx, doc explicitly says 1,41,600
    savings: 23600,
    durationInDays: 365,
    projectsAllowed: 10,
    dashboardPages: 1, // Default assumption based on tier
    features: [
      "Up to 10 Projects",
      "Base rate @ ₹1000/project/mo",
      "tanX Annual Offer"
    ],
    recommended: false,
  },
  {
    value: "PREMIUM_ANNUAL",
    label: "Premium Plan",
    tier: "20 Projects",
    billingPeriod: "annual",
    price: 212400,
    originalPrice: 283200, // Derived from doc
    savings: 70800,
    durationInDays: 365,
    projectsAllowed: 20,
    dashboardPages: 5,
    features: [
      "Up to 20 Projects",
      "Base rate @ ₹1000/project/mo",
      "Best Value Offer"
    ],
    recommended: true,
  },
  {
    value: "ADVANCE_ANNUAL",
    label: "Customized",
    tier: "Enterprise",
    billingPeriod: "annual",
    price: "custom", // Special string handling in UI
    originalPrice: 0,
    savings: 0,
    durationInDays: 365,
    projectsAllowed: 999, // Unlimited
    dashboardPages: 999,
    features: [
      "Above 20 Projects",
      "Custom Quotation",
      "Dedicated Support"
    ],
    recommended: false,
  },
]