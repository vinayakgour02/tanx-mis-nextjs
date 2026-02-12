# Organization Dashboard Features Documentation

The Organization Dashboard is a comprehensive project management and tracking system designed for NGOs and development organizations. It provides tools for managing projects, programs, objectives, indicators, and organizational activities.

## Dashboard Overview

The org-dashboard serves as the central hub for organizational management with a role-based permission system that controls access to different features based on user roles and permissions.

### Main Navigation Structure

The dashboard is organized into several main sections:

- **Dashboard Home**: Overview and statistics
- **Projects**: Complete project lifecycle management
- **Programs**: Program-level planning and tracking
- **Objectives**: Goal setting and objective management
- **Activities**: Task and activity tracking
- **Indicators**: Performance measurement and monitoring
- **Reports**: Data analysis and reporting

## Projects Module

The Projects module is the core feature of the system, providing comprehensive project management capabilities.

### Project Creation Process

Projects are created through a multi-tab form interface with the following tabs:

#### 1. Basic Details Tab
- **Project Information**:
  - Project Name (required)
  - Project Code (optional)
  - Description (required)
  - Theme (optional, e.g., Education, Healthcare)
  - Status (required): Draft, Planned, Active, On Hold, Completed, Cancelled

- **Financial Details**:
  - Total Budget (required)
  - Currency selection (INR, USD, EUR, etc.)

- **Timeline**:
  - Start Date (required)
  - End Date (required)

- **Impact Metrics**:
  - Direct Beneficiaries count
  - Indirect Beneficiaries count

- **Program Association**:
  - Link project to existing programs through ProgramSelect component

#### 2. Funding Tab
- **Funding Sources Management**:
  - Add multiple funding sources
  - Select from existing donors or create new ones
  - Specify funding amount and year
  - Support for multiple currencies
  - Dynamic addition/removal of funding entries

- **Donor Management Integration**:
  - Create new donors through NewDonorDialog
  - Automatic population of donor information
  - Support for different donor types and codes

#### 3. Additional Tabs (Referenced but not detailed in current codebase)
- Location/Intervention Areas
- Team Assignment
- Objectives Mapping
- Activities Planning

### Project Management Features

#### Project Listing and Filtering
- **Search Functionality**: Search by project name, description, or code
- **Status Filtering**: Filter projects by their current status
- **Tabular Display**: Comprehensive project information in sortable table format

#### Project Status Management
- **Real-time Status Updates**: Change project status directly from the project list
- **Status-based Color Coding**: Visual indicators for different project states
- **Permission-based Controls**: Only users with admin permissions can modify statuses

#### Project Actions
- **View Project**: Detailed project information display
- **Edit Project**: Modify project details (admin only)
- **Delete Project**: Remove projects with confirmation dialog (admin only)

### Project Data Structure

Each project contains comprehensive information including:

```typescript
interface Project {
  // Basic Information
  id: string;
  name: string;
  code?: string;
  description: string;
  status: 'DRAFT' | 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  theme?: string;
  
  // Financial
  totalBudget: number;
  currency: string;
  funding: FundingSource[];
  
  // Timeline
  startDate: Date;
  endDate: Date;
  
  // Impact
  directBeneficiaries?: number;
  indirectBeneficiaries?: number;
  
  // Relationships
  program?: Program;
  objectives: Objective[];
  indicators: Indicator[];
  activities: Activity[];
  team: TeamMember[];
  interventionAreas: Location[];
  attachments: Attachment[];
  reports: Report[];
  tasks: Task[];
}
```

## Programs Module

The Programs module handles higher-level program management that can encompass multiple projects.

### Program Management Features

- **Program Creation**: Define programs with comprehensive details including:
  - Basic information (name, description, theme, sector)
  - Financial planning (budget allocation)
  - Timeline management (start and end dates)
  - Performance metrics (baseline, targets)

- **Program Listing**: 
  - View all organizational programs
  - Sort by creation date
  - Serialized data handling for proper display

- **Integration with Projects**: 
  - Projects can be associated with programs
  - Program information is displayed in project details
  - Hierarchical relationship management

### Program Data Structure

```typescript
interface Program {
  id: string;
  name: string;
  theme: string;
  sector: string;
  description?: string;
  budget?: Decimal;
  baseline?: Decimal;
  target?: Decimal;
  startDate?: Date;
  endDate?: Date;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Objectives Module

The Objectives module provides comprehensive goal setting and tracking capabilities across different organizational levels.

### Objective Management Features

#### Multi-level Objective System
- **Organization Level**: High-level organizational objectives
- **Program Level**: Program-specific goals
- **Project Level**: Project-specific objectives

#### Objective Hierarchy
- **Goal**: Highest level objectives
- **Outcome**: Mid-level results
- **Output**: Direct deliverables
- **Activity**: Specific actions

### Objectives Dashboard

#### Statistics Overview
The objectives page provides comprehensive statistics including:
- **Total Objectives Count**: Aggregate count across all levels
- **Type-based Statistics**:
  - Project Objectives count
  - Program Objectives count
  - Organization Objectives count
- **Level-based Statistics**:
  - Goals count
  - Outcomes count
  - Outputs count
  - Activities count

#### Objective Creation
- **Multi-level Creation**: Create objectives at organization, program, or project level
- **Flexible Assignment**: Associate objectives with specific projects or programs
- **Code System**: Optional coding system for objective identification

#### Objectives Table
- **Comprehensive View**: All objectives displayed in a unified table
- **Filtering and Sorting**: Filter by type, level, or search criteria
- **Detailed Information**: Code, type, associated project/program, level, and description

### Objective Data Structure

```typescript
interface Objective {
  id: string;
  code?: string;
  level: 'Goal' | 'Outcome' | 'Output' | 'Activity';
  description: string;
  organizationId?: string;
  projectId?: string;
  programId?: string;
  project?: { name: string };
  program?: { name: string };
  createdAt: Date;
}
```

## Permission System

The system implements a robust role-based permission system using the `usePermissions` hook.

### Permission Types
- **Admin Permissions**: Full CRUD operations on projects, programs, and objectives
- **View Permissions**: Read-only access to organizational data
- **Role-based Access**: Different permission levels based on user roles

### Permission Implementation
```typescript
const { can } = usePermissions();
const canAdminProjects = can('projects', 'admin');
```

### UI Permission Controls
- **Conditional Rendering**: UI elements shown/hidden based on permissions
- **Action Restrictions**: CRUD operations restricted to authorized users
- **Status Updates**: Only admin users can modify project/program statuses

## Data Management

### API Integration
- **RESTful API Endpoints**: Well-structured API endpoints for all modules
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Proper loading indicators during data operations

### Database Integration
- **Prisma ORM**: Database operations using Prisma
- **Relationship Management**: Proper foreign key relationships between entities
- **Data Serialization**: Proper handling of complex data types (Decimal, Date)

### State Management
- **React State**: Local state management for UI interactions
- **Form State**: React Hook Form for complex form handling
- **Real-time Updates**: Dynamic updates after CRUD operations

## User Interface Features

### Design System
- **Component Library**: Consistent UI components using shadcn/ui
- **Responsive Design**: Mobile-friendly layouts
- **Accessibility**: ARIA-compliant components
- **Dark Mode Support**: Theme-aware component styling

### User Experience
- **Search and Filter**: Comprehensive search and filtering capabilities
- **Bulk Operations**: Support for batch operations where applicable
- **Confirmation Dialogs**: Safety confirmations for destructive operations
- **Toast Notifications**: User feedback for all operations

### Form Handling
- **Multi-step Forms**: Complex forms broken into manageable tabs
- **Validation**: Client-side and server-side validation
- **Dynamic Fields**: Add/remove form fields as needed
- **Auto-save**: Preservation of form data during navigation

## Integration Features

### Donor Management Integration
- **Donor Database**: Comprehensive donor information management
- **Funding Tracking**: Link funding sources to projects
- **Multiple Donors**: Support for multiple funding sources per project

### Geographic Integration
- **Location Tracking**: Intervention area management
- **Multi-level Geography**: State, District, Block, Gram Panchayat, Village levels

### Team Management
- **Team Assignment**: Assign team members to projects
- **Role Definitions**: Define team member roles and responsibilities
- **Hierarchical Structure**: Support for different team levels

## Reporting and Analytics

### Data Visualization
- **Statistics Cards**: Key metrics display
- **Progress Tracking**: Visual progress indicators
- **Trend Analysis**: Time-based data analysis

### Export Capabilities
- **Data Export**: Export project and program data
- **Report Generation**: Generate various organizational reports
- **Custom Reporting**: Flexible reporting based on filters

## Security Features

### Data Protection
- **Session Management**: Secure session handling
- **Role-based Access**: Granular permission system
- **Data Validation**: Input validation and sanitization

### Audit Trail
- **Change Tracking**: Track modifications to projects and programs
- **User Activity**: Log user interactions
- **Data Integrity**: Ensure data consistency across operations

## Mobile Responsiveness

The entire dashboard is designed to work seamlessly across devices:
- **Responsive Tables**: Adaptive table layouts for mobile devices
- **Touch-friendly Interface**: Optimized for touch interactions
- **Progressive Enhancement**: Works on both desktop and mobile browsers

## Performance Optimization

### Database Optimization
- **Efficient Queries**: Optimized database queries with proper joins
- **Pagination**: Implement pagination for large datasets
- **Caching**: Strategic caching of frequently accessed data

### Frontend Optimization
- **Code Splitting**: Lazy loading of components
- **Bundle Optimization**: Efficient JavaScript bundling
- **Image Optimization**: Optimized asset delivery

This comprehensive system provides organizations with a complete solution for managing their projects, programs, and objectives while maintaining data integrity, user security, and excellent user experience.
