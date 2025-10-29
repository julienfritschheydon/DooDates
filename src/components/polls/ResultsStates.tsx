import React from "react";

export function ResultsLoading({ label = "Chargement des résultats..." }: { label?: string }) {
  return (
    <div className="w-full flex items-center justify-center py-16">
      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
        <svg
          className="animate-spin h-5 w-5 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function ResultsEmpty({
  message,
  action,
}: {
  message: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="w-full bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
      <div className="text-gray-700 dark:text-gray-200">{message}</div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
