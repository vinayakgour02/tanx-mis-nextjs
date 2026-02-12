"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
} from "recharts";
import { Loader2 } from "lucide-react";

// Custom XAxis tick to wrap long labels
const CustomXAxisTick = ({ x, y, payload }: any) => {
  const label = payload.value;
  const maxChars = 15;
  const words = label.split(" ");
  const lines: string[] = [];
  let line = "";

  words.forEach((word: any) => {
    if ((line + " " + word).trim().length > maxChars) {
      lines.push(line.trim());
      line = word;
    } else {
      line += " " + word;
    }
  });
  lines.push(line.trim());

  return (
    <g transform={`translate(${x},${y + 10})`}>
      {lines.map((line, i) => (
        <text key={i} x={0} y={i * 12} textAnchor="middle" fontSize={10} fill="#555">
          {line}
        </text>
      ))}
    </g>
  );
};

export default function ProgramThemePerformancePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/dashboard/program-performance/theme");
        const json = await res.json();
        setData(json.data);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
    const totalTarget = data.reduce((sum, item) => sum + item.target, 0);
  const totalReported = data.reduce((sum, item) => sum + item.reported, 0);
 const pieData = [
    { name: "Achieved", value: totalReported },
    { name: "Remaining", value: Math.max(totalTarget - totalReported, 0) },
  ];
  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-gray-500" size={32} />
      </div>
    );
const COLORS = ["#f97316", "#bc3908"]; // Achieved = orange, Remaining = light yellow

  return (
      <div className="flex flex-col lg:flex-row gap-6">
<Card className="w-full lg:w-1/3 flex-shrink-0 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Overall Achievement</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex justify-center items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ value }) => value.toLocaleString()} // Show numbers instead of names
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => value.toLocaleString()}
                contentStyle={{
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                payload={pieData.map((item, index) => ({
                  id: item.name,
                  type: "square",
                  value: `${item.name}: ${item.value.toLocaleString()}`,
                  color: COLORS[index],
                }))}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    <Card className="w-full">
      <CardHeader>
        <CardTitle>Program Performance (Target vs Reported)</CardTitle>
      </CardHeader>
       <CardContent className="h-[400px] overflow-x-auto overflow-y-hidden">
        {/* Horizontal scroll wrapper */}
        <div className="min-w-[800px] h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }} barGap={10}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="programTheme" height={70} interval={0} tick={<CustomXAxisTick />} />
              <YAxis
                label={{
                  value: "People",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle", fill: "#555" },
                }}
                tick={{ fontSize: 12, fill: "#555" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <Bar dataKey="target" fill="#d1d5db" name="Target Unit" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="reported" fill="#f97316" name="Reported Unit" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
      </div>
  );
}
