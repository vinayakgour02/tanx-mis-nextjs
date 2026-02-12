"use client";

import { useEffect, useState } from "react";
import { getProgramProjects } from "@/app/actions/getProgramProjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Program {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  theme: string | null;
  status: string;
  priority: string;
  sector: string | null;
  startDate: Date | null;
  endDate: Date | null;
  budget: any;
  baseline: any;
  target: any;
  projectId: string | null;
  activityId: string | null;
  _count: { projects: number };
}

export default function ProgramProjectsTable() {
  const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    (async () => {
      const data = await getProgramProjects();
      setPrograms(data);
    })();
  }, []);

  return (
    <Card className="border-0 shadow-none p-0 h-full flex flex-col">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-lg md:text-xl font-semibold text-gray-800">
          Programs & Projects
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Overview of programs and their associated projects
        </p>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <div className="h-full rounded-xl border border-gray-300 flex flex-col overflow-hidden">
          <div className="overflow-y-auto flex-1">
            <Table className="border-collapse w-full">
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-orange-500 text-white">
                  <TableHead className="py-3 px-4 font-semibold text-white border border-gray-300 rounded-tl-xl">
                    Program
                  </TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-white text-right border border-gray-300 rounded-tr-xl">
                    Projects
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-gray-500 py-8 border border-gray-300"
                    >
                      No programs found
                    </TableCell>
                  </TableRow>
                ) : (
                  programs.map((program, i) => (
                    <TableRow
                      key={program.id}
                      className={`border border-gray-300 transition-colors ${
                        i % 2 === 0 ? "bg-white" : "bg-orange-50"
                      } hover:bg-orange-100`}
                    >
                      <TableCell
                        className={`py-3 px-4 font-medium text-gray-800 border border-gray-300 ${
                          i === programs.length - 1 ? "rounded-bl-xl" : ""
                        }`}
                      >
                        <div className="flex items-start">
                          <div>
                            <div className="font-medium">{program.name}</div>
                            {program.sector && (
                              <div className="text-xs text-gray-500 mt-1">
                                {program.sector}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell
                        className={`py-3 px-4 text-right border border-gray-300 ${
                          i === programs.length - 1 ? "rounded-br-xl" : ""
                        }`}
                      >
                        <span className="inline-flex items-center justify-center text-sm font-bold  text-orange-800">
                          {program._count.projects}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
