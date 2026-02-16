import { FieldValues } from "react-hook-form";

export interface Area {
  id: string;
  name: string;
  children?: Area[];
}

export interface Report {
  id: string;
  areas: Area[];
}

export interface ReportFormValues extends FieldValues {
  selectedAreas: string[];
}
