import React from "react";
import { DatePollsSidebar } from "./DatePollsSidebar";

interface DatePollsLayoutProps {
    children: React.ReactNode;
}

export const DatePollsLayout: React.FC<DatePollsLayoutProps> = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <DatePollsSidebar />
            <main className="flex-1 overflow-y-auto h-screen">
                {children}
            </main>
        </div>
    );
};
