import * as React from "react";
export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "md" | "lg" | "xl" | "full";
}
export declare function PageContainer({ size, className, ...props }: PageContainerProps): import("react/jsx-runtime").JSX.Element;
/** Alias for `PageContainer` (semantic name for “main content width” in layouts). */
export declare const ContentFrame: typeof PageContainer;
export interface PageSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
    title?: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    bare?: boolean;
}
export declare function PageSection({ title, description, actions, bare, className, children, ...props }: PageSectionProps): import("react/jsx-runtime").JSX.Element;
export interface ResponsiveStackProps extends React.HTMLAttributes<HTMLDivElement> {
    gap?: "xs" | "sm" | "md" | "lg" | "xl";
    direction?: "row" | "col";
    align?: "start" | "center" | "end" | "stretch";
}
export declare function ResponsiveStack({ gap, direction, align, className, ...props }: ResponsiveStackProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=page-section.d.ts.map