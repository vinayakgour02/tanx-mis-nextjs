import { ExcelColumn } from "@/components/excel-table";

export const rawReportColumns: ExcelColumn[] = [
  { key: "id", label: "ID", width: 200 },
  { key: "type", label: "Type" },

  // --- Reporting Metadata ---
  { key: "levelofActivity", label: "Level of Activity" },
  { key: "status", label: "Status" },
  { key: "reportingDate", label: "Reporting Date" },
  { key: "reportingMonth", label: "Reporting Month" },
  { key: "reportingQuarter", label: "Reporting Quarter" },
  { key: "reportingYear", label: "Reporting Year" },
  { key: "createdAt", label: "Created At" },
  { key: "updatedAt", label: "Updated At" },

  // --- Location / GPS ---
  { key: "gpsCoordinates", label: "GPS Coordinates" },

  // --- Core Data ---
  { key: "unitType", label: "Unit Type" },
  { key: "unitReported", label: "Unit Reported" },
  { key: "peopleCount", label: "People Count" },
  { key: "hasLeverage", label: "Has Leverage" },
  { key: "piValue", label: "PI Value" },

  // --- Submission Metadata ---
  { key: "submittedAt", label: "Submitted At" },
  { key: "approvedAt", label: "Approved At" },
  { key: "publishedAt", label: "Published At" },

  // Program / Project / Activity
  { key: "program", label: "Program" },
  { key: "project", label: "Project" },
  { key: "projectCode", label: "Project Code" },
  { key: "activity", label: "Activity" },
  { key: "activityType", label: "Activity Type" },

  // Intervention
  { key: "intervention", label: "Intervention" },
  { key: "subIntervention", label: "Sub Intervention" },

  // Location
  { key: "state", label: "State" },
  { key: "district", label: "District" },
  { key: "block", label: "Block" },
  { key: "gp", label: "Gram Panchayat" },
  { key: "village", label: "Village" },

  // Training
  { key: "trainingParticipants", label: "Training Participants" },

  // Household
  { key: "householdBeneficiary", label: "Household Beneficiary" },
  { key: "householdBenefits", label: "Benefits Count" },

  // Infrastructure
  { key: "infraName", label: "Infrastructure Name" },

  // Creator
  { key: "creator", label: "Creator" },
];

