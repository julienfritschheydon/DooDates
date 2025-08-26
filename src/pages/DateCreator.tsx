import React from "react";
import { useNavigate } from "react-router-dom";
import PollCreatorComponent from "@/components/PollCreator";

export default function DateCreator() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* No TopNav, no page title: only the calendar creator component */}
      <div className="w-full max-w-4xl mx-auto">
        <PollCreatorComponent onBack={() => navigate("/")} />
      </div>
    </div>
  );
}
