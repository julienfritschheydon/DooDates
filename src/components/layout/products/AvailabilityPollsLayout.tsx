import React from "react";
import { AvailabilityPollsSidebar } from "./AvailabilityPollsSidebar";

interface AvailabilityPollsLayoutProps {
    children: React.ReactNode;
}

export const AvailabilityPollsLayout: React.FC<AvailabilityPollsLayoutProps> = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <AvailabilityPollsSidebar />
            <main className="flex-1 overflow-y-auto h-screen">
                {children}
            </main>
        </div>
    );
};
