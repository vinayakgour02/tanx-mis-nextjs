## Organization Example

```json
{
  "name": "Rural Development Trust",
  "type": "NGO",
  "tagline": "Empowering Rural Communities",
  "email": "contact@rdt.org",
  "phone": "+91-9876543210",
  "website": "https://www.rdt.org",
  "linkedin": "https://linkedin.com/company/rural-development-trust",
  
  "address": "123 Development Road, Rural District",
  "pinCode": "500032",
  "district": "Anantapur",
  "state": "Andhra Pradesh",
  "country": "India",
  
  "headName": "Dr. Sarah Johnson",
  "headDesignation": "Executive Director",
  "headPhone": "+91-9876543211",
  "headEmail": "director@rdt.org",
  
  "legalStructure": "Section 8 Company",
  "registrationNumber": "U74999TG2010NPL123456",
  "registrationDate": "2010-03-15",
  "panNumber": "AAATR1234C",
  "certificate12A": "12A-123456",
  "certificate80G": "80G-789012",
  "fcraNumber": "FCRA-123456789"
}
```

## Program Example

```json
{
  "name": "Rural Education Initiative",
  "description": "Comprehensive program to improve education quality in rural areas",
  "objectives": [
    "Enhance access to quality education in rural areas",
    "Improve school infrastructure",
    "Build teacher capacity",
    "Promote digital literacy"
  ],
  "startDate": "2023-04-01",
  "endDate": "2026-03-31",
  "budget": 25000000.00,
  "status": "ACTIVE",
  "priority": "HIGH",
  "sector": "Education",
  "theme": "Rural Development"
}
```

## Project Example

```json
{
  "name": "Digital Classroom Project",
  "code": "DCP-2023",
  "programId": "rural-education-initiative",
  "description": "Implementation of digital classrooms in 50 rural schools",
  "theme": "Education Technology",
  "status": "ACTIVE",
  "startDate": "2023-06-01",
  "endDate": "2024-05-31",
  "directBeneficiaries": 5000,
  "indirectBeneficiaries": 15000,
  "totalBudget": 5000000.00,
  "currency": "INR",
  "goal": "To improve learning outcomes through technology integration in rural schools"
}

```

## Project Objectives Example

```json
[
  {
    "code": "DCP-OBJ-1",
    "level": "Project",
    "description": "Set up smart classrooms in 50 rural schools by March 2024"
  },
  {
    "code": "DCP-OBJ-2",
    "level": "Outcome",
    "description": "Improve student engagement and learning outcomes by 30%"
  },
  {
    "code": "DCP-OBJ-3",
    "level": "Output",
    "description": "Train 200 teachers in digital teaching methodologies"
  }
]
```

## Indicator Example

```json
{
  "level": "PROJECT", //org, program, project (select)
  "theme" : "Education", //(text)
  "name": "Digital Classroom Usage Rate", // (text)
  
  "type": "OUTPUT", // activity, output, outcomes, impact indicator (select) 
  "definition": "Percentage of teaching hours utilizing digital classroom facilities", // txt
  "rationale": "Measures the adoption and integration of digital tools in teaching", // txt
  "dataSource": "Weekly classroom observation reports", // tx
  "frequency": "Monthly", // select
  "unitOfMeasurement": "Percentage", // select
  "disaggregateBy": ["School", "Grade", "Subject"], // by level 1, level 2, level 3,,,,, gender , caste, location, other
// Gender, 
// Age,
// Location

  "baselineValue": "10",
  "target": "80"
}
```

## Plan Example

```json
{
  "code": "DCP-ACT-001",
  "planYear": 2023,
  "activityName": "Teacher Training Workshop",
  "activityType": "Capacity Building",
  "activityDescription": "5-day workshop on digital teaching methods",
  "unitOfMeasurement": "Participants",
  "startMonth": "Apr",
  "endMonth": "May",
  // "annualTarget": 200, sum of all monthly targets
  "perUnitCost": 1000,
  // "totalBudget": 200000, Formula: perUnitCost
  "monthlyTargets": {
    "Apr": 50,
    "May": 50,
    "Jun": 50,
    "Jul": 50,
    "+12"
  },
  "intervention": "Teacher Training",
  "subIntervention": "Digital Skills",
  "objective": "DCP-OBJ-1",
  "attendanceRequired": true,

  // Do not show in UI
  // "piDataRequired": true,
  // "piMeasurement": "Pre-post assessment scores",
}
```

## Result Framework Example

```json
{
  "level": "Goal",
  "description": "Improved learning outcomes in rural schools through technology integration",
  "indicators": "1. Average academic performance\n2. Student engagement levels\n3. Digital literacy rates",
  "targets": "1. 30% improvement in test scores\n2. 80% student engagement\n3. 90% digital literacy",
  "MOV-verification": "1. Annual assessment reports\n2. Classroom observation data\n3. Digital skills assessments",
  "assumptions": "1. Stable internet connectivity\n2. Continued community support\n3. Teacher retention",

}
```

## Project Team Example

```json
[
  {
    "name": "Rajesh Kumar",
    "designation": "Project Manager",
    "department": "Education",
    "employeeId": "EMP-123456",
    "contact": "9876543210",
    "email": "rajesh@example.com",
    "level": "Senior",
    "location": "Anantapur",
    "avatar": "https://example.com/avatar.png"
  },
  {
    "name": "Priya Singh",
    "designation": "M&E Officer",
    "department": "Education",
    "employeeId": "EMP-123456",
    "contact": "9876543211",
    "email": "priya@example.com",
    "level": "Mid-Level",
    "location": "Anantapur",
    "avatar": "https://example.com/avatar.png"
  },
  {
    "name": "John Smith",
    "designation": "Technical Trainer",
    "department": "Education",
    "employeeId": "EMP-123456",
    "contact": "9876543212",
    "email": "john@example.com",
    "level": "Mid-Level",
    "location": "Anantapur",
    "avatar": "https://example.com/avatar.png"
  }
]
```

## Donor Example

```json
{
  "DonorName": "Tech for Education Foundation",
  "DonorType": "CSR",
  "DonorCode": "TEF-2023",
  "DonorDescription": "Corporate foundation focusing on educational technology",
  "DonorWebsite": "https://www.techforeducationfoundation.org",
  "DonorEmail": "info@techforeducationfoundation.org",
  "DonorPhone": "+91-9876543210",
  "DonorAddress": "123 Tech Road, Anantapur",
  "DonorCity": "Anantapur",
  "DonorState": "Andhra Pradesh",
  "DonorCountry": "India"
}
```

## Project Funding Example

```json
{
  "donorId": "tech-for-education-foundation",
  "amount": 5000000.00,
  "currency": "INR",
  "year": 2023,
  "MOU-signed": true,
  "MOU-signed-date": "2023-01-01",
  "MOU-signed-by": "Tech for Education Foundation",
  "MOU-signed-by-designation": "Director",
  "MOU-signed-by-email": "info@techforeducationfoundation.org",
  "MOU-signed-by-phone": "+91-9876543210",
  "MOU-signed-by-address": "123 Tech Road, Anantapur"
}
```

## Measurement Example

```json
{
  "indicatorId": "digital-classroom-usage",
  "value": "65",
  "Month": "Sep",
  "location": "Anantapur District",
  "notes": "Significant improvement observed in teacher adoption"
}
```

## Report Example

```json
{
  "ReportTitle": "Digital Classroom Project - Q2 Progress Report",
  "ReportType": "PROGRESS", // PROGRESS, FINAL, INTERIM
  "ReportApprovalStatus": "APPROVED", // APPROVED, REJECTED, PENDING
  "ReportFrequency": "QUARTERLY", // DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
  "ReportPeriodStart": "2023-07-01",
  "ReportPeriodEnd": "2023-09-30",
  "ReportContent": {
    "executiveSummary": "Project implementation is on track with 25 schools completed",
    "keyAchievements": [
      "Trained 100 teachers",
      "Installed equipment in 25 schools",
      "Student engagement increased by 40%"
    ],
    "challenges": [
      "Internet connectivity issues in 3 locations",
      "Power supply fluctuations"
    ],
    "nextSteps": [
      "Install solar backup systems",
      "Begin phase 2 implementations"
    ]
  }
}
```


```json
MIS reporting (Activity reporting)

{
  "staff": [
    {
      "name": "Rajesh Kumar",
      "designation": "Project Manager",
      "department": "Education",
    }
  ],
  "projects": [
    {
      "name": "Digital Classroom Project",
      "code": "DCP-2023",
      "description": "Implementation of digital classrooms in 50 rural schools"
    }
  ],
  "activities": [
    {
      "name": "Teacher Training Workshop",
      "code": "DCP-ACT-001",
      "description": "5-day workshop on digital teaching methods"
    }
  ],
  "progressReports": [
    {
      "DateofActivity": "2023-07-01",
      "LocationofActivity": "Anantapur",
      // GPS lat-long
      "Latitude": 12.345678,
      "Longitude": 77.891011,

      // Activity Progress
      "AcitvityProgress": "Completed", // Completed, In-Progress, Not-Started
      "NoofUnitReported": 10,
      "NoofPeopleReported": 10, //Male : Female,


      // table based on participants detail // pagintaion developed /// name age designation department uniqueId ?? SC:ST 
      
    }
  ]
}


## Common Workflows

1. **Project Planning**
   - Create program
   - Define projects under program
   - Set objectives and indicators
   - Plan activities

2. **Implementation Monitoring**
   - Track activity progress
   - Record measurements
   - Monitor team performance
   - Document challenges and solutions

3. **Evaluation**
   - Collect indicator data
   - Compare against targets
   - Generate progress reports
   - Analyze impact

4. **Donor Management**
   - Track funding sources
   - Monitor budget utilization
   - Generate donor reports
   - Maintain compliance documentation 