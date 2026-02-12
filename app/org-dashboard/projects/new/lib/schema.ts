
import * as z from 'zod';

const teamLevels = [
  'PROJECT_MANAGER',
  'TEAM_LEAD',
  'SENIOR_MEMBER',
  'MEMBER',
  'SUPPORT_STAFF',
] as const;

export const currencies = ['INR', 'USD', 'EUR', 'GBP'] as const;

export const projectStatuses = ['DRAFT', 'PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] as const;

export const indicatorTypes = ['OUTPUT', 'OUTCOME', 'IMPACT'] as const;

export const objectiveLevels = ['GOAL', 'OUTCOME', 'OUTPUT'] as const;

export const frequencies = ['MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ONE_TIME'] as const;

export const unitOfMeasures = [
  'PERCENTAGE',
  'COUNT',
  'RATIO',
  'CURRENCY',
  'SCORE',
  'HOURS',
  'DAYS',
  'KILOMETERS',
  'KILOGRAMS',
  'UNITS',
  'OTHER'
] as const;

const projectRoles = [
  'mel',
  'program_department',
  'project_manager',
  'me_officer',
  'field_agent'
] as const;

export const projectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  theme: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
  baseline: z.number().nullable().optional(),
  target: z.number().nullable().optional(),
  
  // Duration
  startDate: z.date(),
  endDate: z.date(),
  
  // Beneficiaries
  directBeneficiaries: z.number().optional(),
  indirectBeneficiaries: z.number().optional(),
  
  // Budget
  totalBudget: z.number().min(0, 'Budget must be a positive number'),
  currency: z.string().default('INR'),
  
  // Project Goal & Objectives
  goal: z.string().nullable().optional(),
  
  // Program
  programIds: z.array(z.string().min(1)).min(1, 'Select at least one program'),
  
  // Objectives
  objectives: z.array(z.object({
    id: z.string().optional(),
    code: z.string().nullable().optional(),
    level: z.enum(objectiveLevels),
    description: z.string(),
    orderIndex: z.number(),
  })),
  
  // Indicators
  indicators: z.array(z.object({
    name: z.string(),
    type: z.enum(['OUTPUT', 'OUTCOME', 'IMPACT']),
    level: z.enum(['ORGANIZATION', 'PROJECT']),
    definition: z.string(),
    rationale: z.string().nullable().optional(),
    dataSource: z.string(),
    frequency: z.string(),
    unitOfMeasure: z.string(),
    disaggregateBy: z.string().nullable().optional(),
    baselineDate: z.date().nullable().optional(),
    baselineValue: z.string().nullable().optional(),
    target: z.string().nullable().optional(),
  })),
  
  // Funding
  funding: z.array(z.object({
    donorId: z.string(),
    amount: z.number().min(0, 'Amount must be a positive number'),
    currency: z.string().default('INR'),
    year: z.number(),
  })),
  
  // Team
  team: z.array(z.object({
    userId: z.string(),
    role: z.enum(projectRoles),
  })),
}).refine(
  (data) => {
    return data.endDate > data.startDate;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

export type ProjectFormValues = z.infer<typeof projectSchema>; 