"use client";

import { useEffect, useState } from "react";
import { Loader2, Download } from "lucide-react";
import ExcelTable from "@/components/excel-table";
import { useOrganizationId } from "@/hooks/useOrganizationId";
import { activityColumns } from "../components/columns";
import * as XLSX from "xlsx";

export default function ActivitiesPage() {
  const [data, setData] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FILTER STATES
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [indicatorFilter, setIndicatorFilter] = useState("");
  const [objectiveFilter, setObjectiveFilter] = useState("");
  const [activityTypeFilter, setActivityTypeFilter] = useState(""); // NEW

  const { organizationId } = useOrganizationId();

  // ---------------------------
  // LOAD RAW DATA
  // ---------------------------
  useEffect(() => {
    if (!organizationId) return;

    async function load() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/raw-activity?organizationId=${organizationId}`,
          { credentials: "include" }
        );

        const json = await res.json();
        if (!json.success) throw new Error(json.message);

        const flat = json.data.map((a: any) => ({
          id: a.id,
          code: a.code || "-",
          name: a.name || "-",
          type: a.type || "-",
          status: a.status || "-",
          description: a.description || "-",

          startDate: a.startDate?.substring(0, 10) || "-",
          endDate: a.endDate?.substring(0, 10) || "-",

          project: a.project?.name || "-",
          projectCode: a.project?.code || "-",
          programs: a.programs?.map((p: any) => p.name).join(", ") || "-",

          objectiveLevel: a.objective?.level || "-",
          objectiveCode: a.objective?.code || "-",
          objectiveDescription: a.objective?.description || "-",

          indicatorName: a.indicator?.name || "-",
          indicatorType: a.indicator?.type || "-",
          indicatorLevel: a.indicator?.level || "-",
          indicatorUnit: a.indicator?.unitOfMeasure || "-",
          indicatorDefinition: a.indicator?.definition || "-",
          indicatorRationale: a.indicator?.rationale || "-",
          indicatorFrequency: a.indicator?.frequency || "-",
          indicatorDataSource: a.indicator?.dataSource || "-",
          indicatorBaseline: a.indicator?.baselineValue || "-",
          indicatorTarget: a.indicator?.target || "-",

          intervention: a.Intervention?.name || "-",
          subIntervention: a.subInterventionRel?.name || "-",

          unitOfMeasure: a.unitOfMeasure || "-",
          targetUnit: a.targetUnit || "-",
          costPerUnit: a.costPerUnit || "-",
          totalBudget: a.totalBudget || "-",
          annualTarget: a.annualTarget || "-",
          monthlyTargets: a.monthlyTargets
            ? JSON.stringify(a.monthlyTargets)
            : "-",

          leverage: a.leverage || "-",
          attendanceRequired: a.attendanceRequired ? "Yes" : "No",
          piDataRequired: a.piDataRequired ? "Yes" : "No",
          piMeasurement: a.piMeasurement || "-",

          reportCount: a.reports?.length || 0,
          attachmentCount: a.attachments?.length || 0,
          assignedUsers: a.users?.length || 0,
          planCount: a.Plan?.length || 0,

          createdAt: a.createdAt?.substring(0, 10),
          updatedAt: a.updatedAt?.substring(0, 10),
        }));

        setData(flat);
        setFiltered(flat);
      } catch (err: any) {
        setError(err.message || "Failed to load activities");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [organizationId]);

  // ---------------------------
  // FILTER LOGIC
  // ---------------------------
  useEffect(() => {
    let f = data;

    if (projectFilter) f = f.filter((d) => d.project === projectFilter);
    if (statusFilter) f = f.filter((d) => d.status === statusFilter);
    if (indicatorFilter) f = f.filter((d) => d.indicatorName === indicatorFilter);
    if (objectiveFilter) f = f.filter((d) => d.objectiveCode === objectiveFilter);
    if (activityTypeFilter) f = f.filter((d) => d.type === activityTypeFilter);

    setFiltered(f);
  }, [
    projectFilter,
    statusFilter,
    indicatorFilter,
    objectiveFilter,
    activityTypeFilter,
    data,
  ]);

  // ---------------------------
  // EXCEL DOWNLOAD FUNCTION
  // ---------------------------
  const downloadExcel = () => {
    const rows = filtered.map((row) => {
      const obj: any = {};
      activityColumns.forEach((col) => {
        obj[col.label] = row[col.key];
      });
      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Activities");

    XLSX.writeFile(workbook, "activities.xlsx");
  };

  // ---------------------------
  // UI
  // ---------------------------
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
          Raw Activity Data
        </h1>
        <p className="text-gray-500 mt-1">
          Filter activities and export data easily
        </p>
      </div>

      {/* MAIN CARD */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-6">
        {/* FILTERS */}
        <div className="flex gap-4 flex-wrap items-end">
          {/* Project */}
          <select
            className="border border-gray-300 bg-white text-gray-800 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="">All Projects</option>
            {Array.from(new Set(data.map((d) => d.project))).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            className="border border-gray-300 bg-white text-gray-800 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            {Array.from(new Set(data.map((d) => d.status))).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Activity Type — NEW */}
          <select
            className="border border-gray-300 bg-white text-gray-800 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            value={activityTypeFilter}
            onChange={(e) => setActivityTypeFilter(e.target.value)}
          >
            <option value="">All Activity Types</option>
            {Array.from(new Set(data.map((d) => d.type))).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Indicator */}
          <select
            className="border border-gray-300 bg-white text-gray-800 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            value={indicatorFilter}
            onChange={(e) => setIndicatorFilter(e.target.value)}
          >
            <option value="">All Indicators</option>
            {Array.from(new Set(data.map((d) => d.indicatorName))).map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>

          {/* Objective */}
          <select
            className="border border-gray-300 bg-white text-gray-800 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            value={objectiveFilter}
            onChange={(e) => setObjectiveFilter(e.target.value)}
          >
            <option value="">All Objectives</option>
            {Array.from(new Set(data.map((d) => d.objectiveCode))).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

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
          <ExcelTable columns={activityColumns} data={filtered} />
        </div>
      </div>
    </div>
  );
}
