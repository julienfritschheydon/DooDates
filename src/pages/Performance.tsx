import React from "react";
import { PerformanceDashboard } from "../components/performance/PerformanceDashboard";

const Performance = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <PerformanceDashboard />
      </div>
    </div>
  );
};

export default Performance;
