# tanX M&E Organization Dashboard - Comprehensive Documentation

## Overview
This documentation provides a detailed analysis of the tanX Monitoring & Evaluation (M&E) Organization Dashboard, covering all core features, sidebar options, and functionality. This system enables organizations to efficiently manage programs, projects, indicators, and other M&E activities.

## System Architecture

The tanX M&E Dashboard is built using:
- **Next.js**: App Router-based React framework
- **TypeScript**: For type-safe code
- **Prisma**: For database access
- **NextAuth**: For authentication and authorization
- **shadcn/ui**: For UI components

## Core Dashboard Features

### 1. Dashboard Overview (`/org-dashboard`)

The main dashboard provides a comprehensive overview of the organization's activities and data at a glance:

**Key Components:**
- **Welcome Header**: Personalized greeting with organization name
- **Profile Completion Card**: Progress tracking for organization profile completion
- **Statistics Cards**: 
  - Total Projects
  - Active Projects
  - Total Programs
  - Upcoming Activities
  - Team Members
- **Project Trends Chart**: Bar chart visualization of project trends over time
- **Recent Activities Feed**: Chronological list of recent activities with status indicators

**Data Sources:**
- API endpoints for statistics, activities, and project trends
- Auto-calculated profile completion percentage

**User Experience:**
- Conditional display of incomplete profile warnings
- Color-coded status indicators
- Loading state with spinner animation

### 2. Organization Profile (`/org-dashboard/profile`)

The organization profile management page allows users to maintain comprehensive organizational information:

**Key Features:**
- **Profile Completion Tracking**: Visual indicator of profile completeness
- **Multi-section Form**:
  - Basic Information (name, type, contact details)
  - Address Information (location, operational areas)
  - Leadership Information (organization head details)
  - Registration Information (legal registration details)
  - Tax Compliance (PAN, TIN, FCRA, etc.)
  - Document Uploads (certificates and registrations)

**Required Fields:**
```
name, type, email, phone, address, pinCode, district, state, country, 
headName, headEmail, registrationNumber, panNumber
```

**Optional Fields:**
```
website, linkedin, headDesignation, headPhone, description, history, 
foundingPurpose, establishedDate, visionStatement, mission, coreValues, 
legalStructure, registrationDate, registrationDoc, panDoc, tinNumber, 
tinDoc, certificate12A, certificate12ADoc, certificate80G, certificate80GDoc, 
csrNumber, csrDoc, fcraNumber, fcraDoc
```

**Implementation Details:**
- Auto-save functionality
- Real-time validation
- Document upload handling
- Progress calculation algorithm

### 3. Programs Management (`/org-dashboard/programs`)

Programs are high-level organizational initiatives that can contain multiple projects:

**Key Features:**
- **Programs List**: Tabular view with filtering and sorting
- **Program Creation**: Modal dialog with form fields
- **Program Details**:
  - Name and Description
  - Theme/Sector Classification
  - Budget Allocation
  - Timeline (start/end dates)
  - Baseline and Targets
  - Program Objectives

**Data Structure:**
```typescript
interface Program {
  id: string;
  name: string;
  description: string;
  theme: string;
  sector: string;
  budget: string;  // Decimal serialized as string
  baseline: string;  // Decimal serialized as string
  target: string;  // Decimal serialized as string
  startDate: string | null;  // ISO date string
  endDate: string | null;  // ISO date string
  organizationId: string;
}
```

**Implementation Details:**
- Server-side data fetching for programs list
- Permission-based access control
- Program-to-project relationships

### 4. Projects Management (`/org-dashboard/projects`)

Projects are the core operational units in the M&E system:

**Key Features:**
- **Projects Table**: Comprehensive listing with filtering, search, and status filters
- **Project Creation Wizard**: Multi-tab form interface
- **Project Details**:
  - Basic Details (name, code, timeline)
  - Program Assignment
  - Budget and Funding
  - Beneficiaries (direct/indirect)
  - Theme Categorization
  - Team Assignment
  - Objectives and Indicators
  - Intervention Areas

**Project Statuses:**
- Draft
- Planned
- Active
- On Hold
- Completed
- Cancelled

**Advanced Capabilities:**
- **Status Management**: Dynamic status updates with permission control
- **Budget Tracking**: Currency support and formatting
- **Action Buttons**: View, Edit, Delete with permission checks
- **Project Details Expansion**: Comprehensive accordion view

**Implementation Details:**
- Extensive data structure with nested relationships
- Permission-based UI rendering
- Status change API integration
- Confirmation dialogs for destructive actions

**Data Structure:**
```typescript
interface Project {
  id: string;
  name: string;
  code?: string | null;
  description?: string;
  status?: 'DRAFT' | 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  totalBudget?: string;
  currency?: string;
  theme?: string;
  program?: {
    id: string;
    name: string;
    theme: string;
    sector: string;
    startDate: string;
    endDate: string;
  };
  objectives: Array<Objective>;
  indicators: Array<Indicator>;
  team: Array<TeamMember>;
  interventionAreas: Array<InterventionArea>;
  activities: Array<Activity>;
  tasks: Array<Task>;
  attachments: Array<Attachment>;
  reports: Array<Report>;
  funding: Array<Funding>;
  directBeneficiaries?: number;
  indirectBeneficiaries?: number;
}
```

### 5. Indicators (`/org-dashboard/indicators`)

Indicators are key performance metrics used across objectives and projects:

**Key Features:**
- **Indicators Library**: Central repository of all indicators
- **Creation Form**: Comprehensive indicator definition
- **Indicator Details**:
  - Name and Definition
  - Type and Level
  - Unit of Measure
  - Data Source
  - Collection Frequency
  - Baseline and Target Values
  - Disaggregation Options
  - Assignment (Org/Program/Project)

**Implementation Details:**
- Data table with column controls
- Filtering and pagination
- Indicator assignments

### 6. Objectives Framework (`/org-dashboard/objectives`)

The objectives framework provides a hierarchical structure for organizational goals:

**Key Features:**
- **Four-level Structure**:
  - Goal (highest level)
  - Outcome (intermediate results)
  - Output (direct deliverables)
  - Activity (specific tasks)
- **Assignment Options**:
  - Organization-level objectives
  - Program-level objectives
  - Project-level objectives
- **Creation Dialog**: Level selection and description
- **Code-based Identification**: Structured coding system

**Implementation Details:**
- Hierarchical data display
- Parent-child relationships
- Progress tracking

### 7. Activities (`/org-dashboard/activities`)

Activities track specific time-bound tasks:

**Key Features:**
- **Activity Creation**: Dialog with details entry
- **Activity List**: Filterable listing
- **Activity Details**:
  - Title and Description
  - Due Date
  - Activity Type
  - Owner Assignment
  - Status Tracking

**Activity Statuses:**
- Upcoming
- In Progress
- Completed

**Implementation Details:**
- Status update mechanisms
- Assignee selection
- Date handling

### 8. Plans (`/org-dashboard/plans`)

Plans represent strategic or annual planning documents:

**Key Features:**
- **Plan Creation**: Dialog with plan details
- **Plan List**: Timeline and status view
- **Plan Details**:
  - Title and Description
  - Timeframe
  - Status
  - Progress Overview

**Implementation Details:**
- Create plan dialog
- View plan dialog
- Loading state handling

### 9. Team Management (`/org-dashboard/team`)

Team management allows control of user access and permissions:

**Key Features:**
- **Team Member List**: Tabular view with role and status
- **Member Addition**: Dialog with user details and role
- **Member Details**:
  - Name and Contact Info
  - Role Assignment
  - Permission Settings
  - Status Control

**Role Types:**
- Administrator
- Project Manager
- Viewer

**Permission Structure:**
```typescript
interface Permission {
  resource: string;  // e.g., "projects", "indicators"
  action: "read" | "create" | "update" | "delete" | "write" | "admin";
}
```

**Implementation Details:**
- Status toggle with API integration
- Avatar display with fallback
- Permission badges
- Member edit/delete functionality
- Confirmation dialogs

### 10. Intervention Areas (`/org-dashboard/intervention-area`)

Intervention areas define geographic or thematic areas for project implementation:

**Key Features:**
- **Areas Table**: Advanced data table with filters
- **Area Creation**: Dialog with area details
- **Area Details**:
  - State
  - District
  - Block Name
  - Gram Panchayat
  - Village Name

**Implementation Details:**
- Faceted filters
- Column controls
- Data table pagination
- Inline sorting

### 11. Reports (`/org-dashboard/reports`)

Reports provide structured documentation of project outcomes:

**Key Features:**
- **Reports List**: Table with report details
- **Report Creation**: Multi-step wizard
- **Report Types**:
  - Progress Reports
  - Evaluation Reports
  - Donor Reports
  - Impact Assessments

**Implementation Details:**
- Create report dialog
- View report dialog
- Download options

### 12. Analytics (`/org-dashboard/analytics`)

Analytics provide data visualization and insights:

**Key Features:**
- **Dashboard Charts**: Visual representation of data
- **Trend Analysis**: Time-based data visualization
- **Statistical Summaries**: Aggregated metrics
- **Filtering Options**: Customizable views

**Implementation Details:**
- Integration with charting libraries
- Data aggregation

### 13. Settings (`/org-dashboard/settings`)

Settings provide administrative configuration:

**Key Features:**
- **Organizational Preferences**: System-wide settings
- **Access Control**: Permission management
- **Data Management**: Configuration options

**Implementation Details:**
- Admin-only access
- Configuration persistence

## Navigation & UI Components

### Sidebar Navigation

The sidebar provides access to all major features:

**Implementation:**
```typescript
export type SidebarItem = {
  title: string;
  href: string;
  icon: any;
  requiredPermission?: NavPermission;
};

export const sidebarItems: SidebarItem[] = [
  {
    title: "Overview",
    href: "/org-dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Organization Profile",
    href: "/org-dashboard/profile",
    icon: Building2,
    requiredPermission: { resource: "organizations", action: "read" },
  },
  // Additional items...
];
```

**Features:**
- Icon-based navigation
- Permission-based visibility
- Active state indication
- Responsive design

### Header Component

The header provides global UI controls:

**Features:**
- User profile access
- Theme toggle
- Navigation links
- Responsive menu

## Permission System

The system implements a robust permission model:

**Permission Types:**
```typescript
export type NavPermission = {
  resource: string;
  action: "read" | "create" | "update" | "delete" | "write" | "admin";
};
```

**Resources:**
- organizations
- programs
- projects
- indicators
- objectives
- activities
- plans
- team
- intervention-areas
- reports
- analytics
- settings

**Implementation:**
- `usePermissions` hook for permission checks
- Server-side permission validation
- UI adaptation based on permissions

## Data Flow Architecture

The dashboard implements a typical Next.js data flow:

1. **Client-Side State Management**:
   - React useState/useEffect for local state
   - API calls for data fetching
   - Toast notifications for user feedback

2. **Server-Side Data Handling**:
   - Prisma queries for database access
   - NextAuth for authentication
   - API routes for data operations

3. **UI Rendering**:
   - Conditional rendering based on permissions
   - Loading states for asynchronous operations
   - Error handling with user feedback

## User Roles & Permissions

The system supports multiple user roles:

### Administrator
Full access to all features and data management:
- Create, edit, and delete projects
- Manage programs and objectives
- Update project statuses
- Add and remove team members
- Configure organization settings
- Access all reports and analytics

### Project Manager
Manage assigned projects and related activities:
- Edit assigned projects
- View all projects and programs
- Create and manage objectives
- Update project progress
- Generate project reports
- Manage project team members

### Viewer
Read-only access to organizational data:
- View projects and programs
- Access objectives and indicators
- View reports and dashboards
- Export allowed data
- Participate in assigned activities
- Comment on projects

## Best Practices & Implementation Details

### Optimization Techniques
- Efficient data fetching with Promise.all
- Conditional rendering to minimize DOM updates
- Proper key usage for list rendering
- Loading states for improved user experience

### Error Handling
- Toast notifications for user feedback
- Console error logging
- Graceful degradation
- Form validation with error messages

### Security Measures
- Role-based access control
- Permission validation
- API route protection
- Safe data handling

## Conclusion

The tanX M&E Organization Dashboard is a comprehensive system for monitoring and evaluation activities, offering a robust set of features for program and project management, indicator tracking, team coordination, and reporting. Its modular architecture and permission-based design make it suitable for organizations of various sizes and structures.
