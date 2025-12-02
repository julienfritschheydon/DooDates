import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Lazy loaded product components
const DatePollsApp = React.lazy(() => import("@/app/date-polls/DatePollsApp"));
const FormPollsApp = React.lazy(() => import("@/app/form-polls/FormPollsApp"));
const QuizzApp = React.lazy(() => import("@/app/quizz/QuizzApp"));
const AvailabilityPollsApp = React.lazy(
  () => import("@/app/availability-polls/AvailabilityPollsApp"),
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2">Chargement...</span>
  </div>
);

const ProductRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/date-polls/*" element={<DatePollsApp />} />
        <Route path="/form-polls/*" element={<FormPollsApp />} />
        <Route path="/quizz/*" element={<QuizzApp />} />
        <Route path="/availability-polls/*" element={<AvailabilityPollsApp />} />
        <Route path="/" element={<Navigate to="/date-polls" replace />} />
      </Routes>
    </Suspense>
  );
};

export default ProductRoutes;
