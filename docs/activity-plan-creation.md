# Activity Plan Creation Process

## Overview
Activity plans define monthly targets for project activities within specific financial years and intervention areas. The process links activities to locations and sets time-bound implementation targets.

## Step-by-Step Process

### 1. **Project Selection**
- Choose a project from the available list
- System automatically fetches:
  - Project activities (filtered by project)
  - Intervention areas (project-specific locations)
  - Available financial years (based on project duration)

### 2. **Financial Year Selection**  
- Select target financial year for the plan
- Quick option: "Current FY" button for immediate selection
- Only activities overlapping with selected FY are available

### 3. **Activity Addition**
- Select activities from filtered list (excludes already planned activities)
- System automatically:
  - Calculates month intersection between activity dates and FY
  - Creates monthly target structure for the overlap period
  - Sets initial target based on activity's `targetUnit`

### 4. **Monthly Target Configuration**
Each added activity displays a table with:
- **Unit of Measure**: Activity's measurement unit
- **Monthly Columns**: Each month in the activity-FY intersection
- **Target Values**: Editable numeric inputs for each month
- **Total Validation**: Shows total vs. activity target (red if exceeded)

### 5. **Intervention Area Assignment**
- **Required**: Each activity must be assigned to an intervention area
- Dropdown shows: `Village, Gram Panchayat, Block, District, State`
- Areas are project-specific locations with hierarchical structure

### 6. **Validation & Submission**
System validates:
- ✅ Plan year selected
- ✅ At least one activity added  
- ✅ All activities have intervention areas assigned

## Data Structure

### ActivityPlan Object
```typescript
{
  activityId: string,           // Reference to project activity
  unitOfMeasure: string,        // Measurement unit
  activityTarget: number,       // Overall target from activity
  months: string[],             // Array of "YYYY-MM" strings
  monthlyTargets: {             // Month-wise targets
    "2024-04": 10,
    "2024-05": 15,
    // ...
  },
  interventionAreaId: string    // Location assignment
}
```

### API Payload
```typescript
{
  activityId: string,
  unitOfMeasure: string,
  activityTarget: number,
  monthlyTargets: Record<string, number>,
  planYearStart: string,        // ISO date
  planYearEnd: string,          // ISO date  
  projectId: string,
  interventionAreaId: string
}
```

## Key Features

- **Automatic Date Calculation**: System finds intersection between activity dates and financial year
- **Real-time Validation**: Monthly totals validated against activity targets
- **Location Hierarchy**: Intervention areas show full location path
- **Responsive Interface**: Horizontally scrollable table for many months
- **Bulk Operations**: Multiple activities can be planned simultaneously

## Business Rules

1. **Activity Overlap**: Only activities overlapping with selected FY are available
2. **Unique Assignment**: Each activity can only be planned once per FY
3. **Location Requirement**: All activities must have intervention area assignments
4. **Target Validation**: System warns if monthly totals exceed activity targets
5. **Financial Year Scope**: Plans are scoped to specific financial years (April-March)

## File Locations
- **Main Component**: `/app/org-dashboard/plans/components/create-plan-dialog.tsx`
- **Plan Listing**: `/app/org-dashboard/plans/page.tsx`  
- **API Endpoint**: `/api/plans` (POST method)