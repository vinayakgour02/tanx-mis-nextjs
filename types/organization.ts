export interface Organization {
  id: string;
  name: string;
  type: string;
  tagline?: string;
  description?: string;
  logo?: string;

  // Contact Information
  email: string | null;
  phone: string | null;
  website?: string | null;
  linkedin?: string | null;

  // Address
  address?: string | null;
  pinCode?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;

  // Organization Head
  headName?: string | null;
  headDesignation?: string | null;
  headPhone?: string | null;
  headEmail?: string | null;

  // Legal Registration
  legalStructure?: string | null;
  registrationNumber?: string | null;
  registrationDate?: string | null;
  registrationDoc?: string | null;

  // Tax & Compliance
  panNumber?: string | null;
  panDoc?: string | null;
  tinNumber?: string | null;
  tinDoc?: string | null;
  certificate12A?: string | null;
  certificate12ADoc?: string | null;
  certificate80G?: string | null;
  certificate80GDoc?: string | null;
  csrNumber?: string | null;
  csrDoc?: string | null;
  fcraNumber?: string | null;
  fcraDoc?: string | null;

  // Status & Audit
  hasAuditedFinancials: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  subscriptionPlan?: SubscriptionPlan | null
  subscription?: OrganizationSubscription | null
} 

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