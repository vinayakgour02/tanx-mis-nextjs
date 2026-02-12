"use client";

import { useEffect, useState } from "react";
import { getDonorDashboard } from "@/app/actions/getDonorDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ViewMode = "projects" | "programs" | "coverage";

interface DonorData {
  id: string;
  name: string;
  projectCount: number;
  programCount: number;
  coverageCount: number;
}

export default function DonorDashboard() {
  const [donors, setDonors] = useState<DonorData[]>([]);
  const [mode, setMode] = useState<ViewMode>("projects");

  useEffect(() => {
    (async () => {
      const data = await getDonorDashboard();
      setDonors(data);
    })();
  }, []);

  return (
    <Card className="border-0 shadow-none p-0 h-full flex flex-col">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-lg md:text-xl font-semibold text-gray-800">
          Donor-wise Dashboard
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          View contributions by donor organization
        </p>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        {/* Mode Switch Tabs */}
        <div className="flex gap-2 mb-4">
          {(["projects", "programs", "coverage"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors
                ${
                  mode === m
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-orange-600 border-orange-300 hover:bg-orange-50"
                }`}
            >
              {m === "projects" && "Projects"}
              {m === "programs" && "Programs"}
              {m === "coverage" && "Coverage"}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="h-full rounded-xl border border-gray-300 flex flex-col overflow-hidden">
          <div className="overflow-y-auto flex-1">
            <Table className="border-collapse w-full">
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-orange-500 text-white">
                  <TableHead className="py-3 px-4 font-semibold text-white border border-gray-300 rounded-tl-xl">
                    Donor
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-white text-right border border-gray-300 rounded-tr-xl">
                    {mode === "projects" && "Projects"}
                    {mode === "programs" && "Programs"}
                    {mode === "coverage" && "Districts"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donors.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-gray-500 py-8 border border-gray-300"
                    >
                      No donor data available
                    </TableCell>
                  </TableRow>
                ) : (
                  donors.map((d, i) => {
                    const count =
                      mode === "projects"
                        ? d.projectCount
                        : mode === "programs"
                        ? d.programCount
                        : d.coverageCount;

                    return (
                      <TableRow
                        key={d.id}
                        className={`border border-gray-300 transition-colors ${
                          i % 2 === 0 ? "bg-white" : "bg-orange-50"
                        } hover:bg-orange-100`}
                      >
                        <TableCell
                          className={`py-3 px-4 font-medium text-gray-800 border border-gray-300 ${
                            i === donors.length - 1 ? "rounded-bl-xl" : ""
                          }`}
                        >
                          {d.name}
                        </TableCell>
                        <TableCell
                          className={`py-3 px-4 text-right border border-gray-300 ${
                            i === donors.length - 1 ? "rounded-br-xl" : ""
                          }`}
                        >
                          {count}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
