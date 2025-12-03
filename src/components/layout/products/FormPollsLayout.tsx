import React from "react";
import { FormPollsSidebar } from "./FormPollsSidebar";

interface FormPollsLayoutProps {
    children: React.ReactNode;
}

export const FormPollsLayout: React.FC<FormPollsLayoutProps> = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <FormPollsSidebar />
            <main className="flex-1 overflow-y-auto h-screen">
                {children}
            </main>
        </div>
    );
};
