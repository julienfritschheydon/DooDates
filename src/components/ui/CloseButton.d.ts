import * as React from "react";
interface CloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Visually hidden label for screen readers */
    ariaLabel?: string;
    /** If true, positions the button absolutely at top-right */
    absoluteTopRight?: boolean;
    /** Icon size in tailwind units (default 5 => w-5 h-5) */
    iconSize?: 4 | 5 | 6;
}
export declare function CloseButton({ ariaLabel, absoluteTopRight, iconSize, className, ...props }: CloseButtonProps): import("react/jsx-runtime").JSX.Element;
export default CloseButton;
