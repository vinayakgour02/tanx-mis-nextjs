"use client";

import { useRef } from "react";

export interface ExcelColumn {
  key: string;
  label: string;
  width?: number;
}

interface ExcelTableProps {
  columns: ExcelColumn[];
  data: any[];
}

export default function ExcelTable({ columns, data }: ExcelTableProps) {
  const mainScrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full">
      {/* Table Container (only scrollbar) */}
      <div
        ref={mainScrollRef}
        className="
          overflow-auto 
          border 
          rounded-xl 
          bg-white 
          shadow 
          max-h-[75vh] 
          thin-scrollbar
        "
      >
        <table className="border-collapse text-sm" style={{ tableLayout: "fixed" }}>

          {/* Header */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-orange-500 text-white">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ minWidth: col.width || 160 }}
                  className="
                    px-3 py-2 
                    text-left 
                    font-semibold 
                    whitespace-nowrap
                    border-r border-orange-600
                  "
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {data.map((row, i) => (
              <tr
                key={i}
                className={`
                  ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} 
                  hover:bg-gray-100 
                  transition
                `}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{ minWidth: col.width || 160 }}
                    className="
                      px-3 py-2
                      border-t border-gray-200 
                      border-r border-gray-100
                      whitespace-nowrap
                    "
                  >
                    {row[col.key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Scrollbar CSS */}
      <style>
        {`
          .thin-scrollbar::-webkit-scrollbar {
            height: 6px;
            width: 6px;
          }
          .thin-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
          }
          .thin-scrollbar::-webkit-scrollbar-thumb {
            background: #c9c9c9;
            border-radius: 10px;
          }
          .thin-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #b3b3b3;
          }
        `}
      </style>
    </div>
  );
}
