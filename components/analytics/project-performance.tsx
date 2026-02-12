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
} from "recharts";
import { Loader2 } from "lucide-react";

// Custom tick renderer to wrap long labels
const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const label = payload.value;
  const maxCharsPerLine = 15;
  const words = label.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word: string) => {
    if ((currentLine + " " + word).trim().length > maxCharsPerLine) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += " " + word;
    }
  });
  lines.push(currentLine.trim());

  return (
    <g transform={`translate(${x},${y + 10})`}>
      <title>{label}</title>
      {lines.map((line, i) => (
        <text
          key={i}
          x={0}
          y={i * 12}
          textAnchor="middle"
          fontSize={10}
          fill="#555"
        >
          {line}
        </text>
      ))}
    </g>
  );
};

export default function ProjectPerformancePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/dashboard/project-performance");
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

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-gray-500" size={32} />
      </div>
    );

  return (
    <Card className="w-full ">
      <CardHeader>
        <CardTitle className="mb-10">Project Performance (Target vs Reported)</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] overflow-x-auto overflow-y-hidden">
        {/* Horizontal scroll wrapper */}
        <div className="min-w-[800px] h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              barGap={10} // space between bars in same group
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis
                dataKey="projectName"
                height={70}
                interval={0}
                tick={<CustomXAxisTick />}
              />
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
              <Bar
                dataKey="target"
                fill="#d1d5db"
                name="Target Unit"
                radius={[4, 4, 0, 0]}
                barSize={40} // fixed width for each bar
              />
              <Bar
                dataKey="reported"
                fill="#f97316"
                name="Reported Unit"
                radius={[4, 4, 0, 0]}
                barSize={40} // fixed width for each bar
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
