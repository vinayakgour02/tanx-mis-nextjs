import CoverageMap from "@/components/coverageMap";
import DonorDashboard from "@/components/DonorWiseDashboard";
import IndicatorsTable from "@/components/IndicatorsTabledashboard";
import ProgramProjectsTable from "@/components/projectProgram";

export default function CoverageAndReach() {
  return (
    <div className="flex flex-col h-full p-4 md:p-6 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Coverage & Reach Dashboard</h1>
        <p className="text-gray-600 mt-1">View your organization's project coverage and impact metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Left Column: Map */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">Geographic Coverage</h2>
          </div>
          <div className="h-[850px] rounded-lg overflow-hidden">
            <CoverageMap />
          </div>
        </div>

        {/* Right Column (stacked) */}
        <div className="flex flex-col lg:col-span-2 gap-6 h-[950px]">
          {/* Program / Project / Coverage */}
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 flex-1 overflow-hidden">
            <ProgramProjectsTable />
          </div>

          {/* Donor Wise Dashboard */}
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 flex-1 overflow-hidden">
            <DonorDashboard />
          </div>
        </div>
      </div>

      {/* Indicators Table - Full Width */}
      <div className="mt-6 bg-white rounded-xl shadow-lg p-4 md:p-6">
        <IndicatorsTable />
      </div>
    </div>
  );
}