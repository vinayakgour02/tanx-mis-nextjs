"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Legend,
  Cell,
} from "recharts";

export type PlanProgressItem = {
  id: string;
  subInterventionName: string;
  ytdPlan: number;
  ytdProgress: number;
  unitOfMeasure: string;
  ragRating: string;
  projectName: string;
};

type ProgressBarChartProps = {
  data: PlanProgressItem[];
};

const RAG_COLORS: Record<string, string> = {
  red: "#f87171",
  amber: "#fbbf24",
  green: "#34d399",
  over: "#60a5fa", // special color when progress > plan
};

export const ProgressBarChart: React.FC<ProgressBarChartProps> = ({ data }) => {
  const chartData = data.map((item) => {
    const percent = item.ytdPlan
      ? Math.round((item.ytdProgress / item.ytdPlan) * 100)
      : 0;

    let color = RAG_COLORS[item.ragRating.toLowerCase()] || "#9ca3af";
    if (item.ytdProgress > item.ytdPlan) color = RAG_COLORS.over;

    return {
      name: item.subInterventionName,
      project: item.projectName,
      plan: item.ytdPlan,
      progress: item.ytdProgress,
      percent,
      unit: item.unitOfMeasure,
      color,
    };
  });

  return (
    <div className="w-full p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Sub-Intervention Progress</h2>
      <ResponsiveContainer width="100%" height={chartData.length * 60}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 20, right: 40, bottom: 20, left: 240 }}
          barCategoryGap="20%"
        >
          <XAxis type="number" />
          <YAxis
            type="category"
            dataKey="name"
            width={240}
            tick={{ fontSize: 12, fill: "#374151" }}
            tickFormatter={(val: string) =>
              val.length > 35 ? val.slice(0, 35) + "..." : val
            }
          />
          <Tooltip
            formatter={(value: number, key: string, props: any) => [
              `${value} ${props.payload.unit}`,
              key,
            ]}
            labelFormatter={(label) =>
              chartData.find((d) => d.name === label)?.project || label
            }
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              background: "#f9fafb",
              fontSize: "14px",
            }}
          />
          <Legend verticalAlign="top" height={36} />

          {/* Plan bar */}
          <Bar dataKey="plan" fill="#e5e7eb" barSize={18} name="Planned">
            <LabelList
              dataKey="plan"
              position="right"
              style={{ fontSize: 12, fill: "#6b7280" }}
              formatter={(val: number, entry: any) =>
                `${val} ${entry.unit || ""}`
              }
            />
          </Bar>

          {/* Progress bar */}
          <Bar dataKey="progress" barSize={18} name="Progress">
            {chartData.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.color} />
            ))}
            <LabelList
              dataKey="progress"
              position="insideRight"
              formatter={(val: number, entry: any) =>
                `${entry.percent}% (${val}/${entry.plan} ${entry.unit})`
              }
              style={{ fill: "white", fontWeight: "bold", fontSize: 12 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Custom RAG legend */}
      <div className="flex gap-4 mt-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-400"></span> Behind
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-amber-400"></span> At Risk
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-400"></span> On Track
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-400"></span> Exceeded
        </div>
      </div>
    </div>
  );
};
