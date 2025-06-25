import React from "react";
import PollCreatorComponent from "@/components/PollCreator";
import TopNav from "../components/TopNav";
import { useNavigate } from "react-router-dom";

const PollCreator = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="w-full max-w-4xl mx-auto">
        <PollCreatorComponent onBack={() => navigate("/")} />
      </div>
    </div>
  );
};

export default PollCreator;
