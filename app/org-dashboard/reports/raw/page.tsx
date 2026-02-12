"use client";

import { useEffect, useState } from "react";
import { Loader2, Download } from "lucide-react";
import ExcelTable from "@/components/excel-table";
import { rawReportColumns } from "./columns";
import { useOrganizationId } from "@/hooks/useOrganizationId";
import * as XLSX from "xlsx";

export default function RawReportsPage() {
  const [data, setData] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FILTER STATES
  const [projectFilter, setProjectFilter] = useState("");
  const [activityFilter, setActivityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  const { organizationId } = useOrganizationId();

  useEffect(() => {
    if (!organizationId) return;

    async function load() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/reports/raw?organizationId=${organizationId}`,
          { credentials: "include" }
        );

        const json = await res.json();
        if (!json.success) throw new Error(json.message);

        const flat = json.data.map((r: any) => ({
          id: r.id,
          type: r.type || "-",
          levelofActivity: r.levelofActivity || "-",
          status: r.status || "-",

          reportingDate: r.reportingDate?.substring(0, 10),
          reportingMonth: r.reportingMonth || "-",
          reportingQuarter: r.reportingQuarter || "-",
          reportingYear: r.reportingYear || "-",

          createdAt: r.createdAt?.substring(0, 10),
          updatedAt: r.updatedAt?.substring(0, 10),

          gpsCoordinates: r.gpsCoordinates || "-",

          unitType: r.unitType || "-",
          unitReported: r.unitReported || 0,
          peopleCount: r.numberOfPeople || 0,
          hasLeverage: r.hasLeverage ? "Yes" : "No",
          piValue: r.piValue || 0,

          submittedAt: r.submittedAt?.substring(0, 10) || "-",
          approvedAt: r.approvedAt?.substring(0, 10) || "-",
          publishedAt: r.publishedAt?.substring(0, 10) || "-",

          program: r.program?.name || "-",
          project: r.project?.name || "-",
          projectCode: r.project?.code || "-",
          activity: r.activity?.name || "-",
          activityType: r.activity?.type || "-",

          intervention: r.activity?.Intervention?.name || "-",
          subIntervention: r.activity?.subInterventionRel?.name || "-",

          state: r.interventionArea?.state?.name || "-",
          district: r.interventionArea?.district?.name || "-",
          block: r.interventionArea?.blockName?.name || "-",
          gp: r.interventionArea?.gramPanchayat?.name || "-",
          village: r.interventionArea?.villageName?.name || "-",

          trainingParticipants: r.trainingReport?.participants?.length || 0,

          householdBeneficiary: r.householdReport?.beneficiaryName || "-",
          householdBenefits: r.householdReport?.benefits?.length || 0,

          infraName: r.infrastructureReport?.infrastructureName || "-",

          creator: `${r.creator?.firstName || ""} ${
            r.creator?.lastName || ""
          }`,
        }));

        setData(flat);
        setFiltered(flat);
      } catch (err: any) {
        setError(err.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [organizationId]);

  // --------------------------------------
  // FILTER LOGIC
  // --------------------------------------
  useEffect(() => {
    let f = data;

    if (projectFilter) f = f.filter((d) => d.project === projectFilter);
    if (activityFilter) f = f.filter((d) => d.activity === activityFilter);
    if (typeFilter) f = f.filter((d) => d.type === typeFilter);
    if (statusFilter) f = f.filter((d) => d.status === statusFilter);
    if (programFilter) f = f.filter((d) => d.program === programFilter);
    if (yearFilter) f = f.filter((d) => d.reportingYear === yearFilter);
    if (monthFilter) f = f.filter((d) => d.reportingMonth === monthFilter);

    setFiltered(f);
  }, [
    projectFilter,
    activityFilter,
    typeFilter,
    programFilter,
    statusFilter,
    yearFilter,
    monthFilter,
    data,
  ]);

  // --------------------------------------
  // EXCEL DOWNLOAD
  // --------------------------------------
  const downloadExcel = () => {
    const rows = filtered.map((row) => {
      const obj: any = {};
      rawReportColumns.forEach((col) => {
        obj[col.label] = row[col.key];
      });
      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");

    XLSX.writeFile(workbook, "raw_reports.xlsx");
  };

  // --------------------------------------
  // UI
  // --------------------------------------
  if (loading)
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin h-6 w-6 text-primary" />
      </div>
    );

  if (error)
    return <div className="p-6 text-red-600 font-medium">Error: {error}</div>;

  return (
    <div className="min-h-screen p-5 rounded-xl">
      {/* PAGE HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-800">
          Raw Report Data
        </h1>
        <p className="text-gray-500 mt-1">
          Filter reports and export structured monitoring data.
        </p>
      </div>

      {/* MAIN CARD */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-6">
        {/* FILTERS */}
        <div className="flex gap-4 flex-wrap items-end">
          {/* Project */}
          <SelectFilter
            label="Project"
            value={projectFilter}
            onChange={setProjectFilter}
            list={Array.from(new Set(data.map((d) => d.project)))}
          />

          {/* Program */}
          <SelectFilter
            label="Program"
            value={programFilter}
            onChange={setProgramFilter}
            list={Array.from(new Set(data.map((d) => d.program)))}
          />

          {/* Activity */}
          <SelectFilter
            label="Activity"
            value={activityFilter}
            onChange={setActivityFilter}
            list={Array.from(new Set(data.map((d) => d.activity)))}
          />

          {/* Type */}
          <SelectFilter
            label="Type"
            value={typeFilter}
            onChange={setTypeFilter}
            list={Array.from(new Set(data.map((d) => d.type)))}
          />

          {/* Status */}
          <SelectFilter
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            list={Array.from(new Set(data.map((d) => d.status)))}
          />

          {/* Month */}
          <SelectFilter
            label="Month"
            value={monthFilter}
            onChange={setMonthFilter}
            list={Array.from(new Set(data.map((d) => d.reportingMonth)))}
          />

          {/* Year */}
          <SelectFilter
            label="Year"
            value={yearFilter}
            onChange={setYearFilter}
            list={Array.from(new Set(data.map((d) => d.reportingYear)))}
          />

          {/* DOWNLOAD BUTTON */}
          <button
            onClick={downloadExcel}
            className="bg-orange-500 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition shadow-sm"
          >
            <Download size={18} />
            Download Excel
          </button>
        </div>

        {/* TABLE */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <ExcelTable columns={rawReportColumns} data={filtered} />
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------
// SMALL SELECT COMPONENT
// ----------------------------------------
function SelectFilter({
  label,
  value,
  onChange,
  list,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  list: string[];
}) {
  return (
    <select
      className="border border-gray-300 bg-white text-gray-800 px-3 py-2 rounded-lg
                 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{`All ${label}`}</option>
      {list.map(
        (item) =>
          item && (
            <option key={item} value={item}>
              {item}
            </option>
          )
      )}
    </select>
  );
}
