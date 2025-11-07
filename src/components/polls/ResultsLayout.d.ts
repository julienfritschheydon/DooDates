import React from "react";
interface KPI {
    label: string;
    value: React.ReactNode;
}
interface ResultsLayoutProps {
    title: string;
    subtitle?: React.ReactNode;
    actions?: React.ReactNode;
    kpis?: KPI[];
    children: React.ReactNode;
    onClose?: () => void;
}
export default function ResultsLayout({ title, subtitle, actions, kpis, children, onClose, }: ResultsLayoutProps): import("react/jsx-runtime").JSX.Element;
export {};
