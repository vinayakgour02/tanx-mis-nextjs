"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Indicator {
  id: string;
  name: string;
  baselineValue?: string | null;
  target?: string | null;
  achieved?: string | null;
}

export default function IndicatorsTable() {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIndicators() {
      try {
        setError(null);
        const res = await fetch("/api/org-dashboard/indicator", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (!res.ok) {
          throw new Error(`Failed to fetch indicators: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        setIndicators(data);
      } catch (err) {
        console.error("Error fetching indicators:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch indicators");
      } finally {
        setLoading(false);
      }
    }
    fetchIndicators();
  }, []);

  if (loading) {
    return (
      <Card className="border-0 shadow-none p-0">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg md:text-xl font-semibold text-gray-800">
            Organization-Level Indicators
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Key performance indicators for your organization
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-xl border border-gray-300">
            <div className="p-8 text-center text-gray-500">
              Loading indicators...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="border-0 shadow-none p-0">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg md:text-xl font-semibold text-gray-800">
            Organization-Level Indicators
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Key performance indicators for your organization
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-xl border border-gray-300">
            <div className="p-8 text-center text-red-500">
              Error: {error}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-none p-0">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-lg md:text-xl font-semibold text-gray-800">
          Organization-Level Indicators
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Key performance indicators for your organization
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-xl border border-gray-300 overflow-hidden">
          <Table className="border-collapse w-full">
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-orange-500 text-white">
                <TableHead className="py-3 px-4 font-semibold text-white border border-gray-300 rounded-tl-xl w-1/2">
                  Indicator
                </TableHead>
                <TableHead className="py-3 px-4 font-semibold text-white text-center border border-gray-300">
                  Baseline
                </TableHead>
                <TableHead className="py-3 px-4 font-semibold text-white text-center border border-gray-300">
                  Target
                </TableHead>
                <TableHead className="py-3 px-4 font-semibold text-white text-center border border-gray-300 rounded-tr-xl">
                  Achieved
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {indicators.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-gray-500 py-8 border border-gray-300"
                  >
                    No organization-level indicators found
                  </TableCell>
                </TableRow>
              ) : (
                indicators.map((indicator, i) => {
                  const achievedValue = indicator.achieved
                    ? Number(indicator.achieved)
                    : null;

                  return (
                    <TableRow
                      key={indicator.id}
                      className={`border border-gray-300 transition-colors ${
                        i % 2 === 0 ? "bg-white" : "bg-orange-50"
                      } hover:bg-orange-100`}
                    >
                      <TableCell
                        className={`py-3 px-4 font-medium text-gray-800 border border-gray-300 ${
                          i === indicators.length - 1 ? "rounded-bl-xl" : ""
                        }`}
                      >
                        {indicator.name}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center text-gray-700 border border-gray-300">
                        {indicator.baselineValue ?? "-"}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center text-gray-700 border border-gray-300">
                        {indicator.target ?? "-"}
                      </TableCell>
                      <TableCell
                        className={`py-3 px-4 text-center border border-gray-300 ${
                          i === indicators.length - 1 ? "rounded-br-xl" : ""
                        }`}
                      >
                        {achievedValue !== null ? (
                          achievedValue
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
