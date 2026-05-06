"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "../lib/utils";
const containerSize = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    full: "max-w-none",
};
export function PageContainer({ size = "lg", className, ...props }) {
    return (_jsx("div", { className: cn("mx-auto w-full px-4 sm:px-6 py-4 sm:py-6", containerSize[size], className), ...props }));
}
/** Alias for `PageContainer` (semantic name for “main content width” in layouts). */
export const ContentFrame = PageContainer;
export function PageSection({ title, description, actions, bare, className, children, ...props }) {
    return (_jsxs("section", { className: cn("mb-6", !bare && "border bg-card shadow-sm", className), ...props, children: [(title || description || actions) && (_jsxs("header", { className: cn("flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", !bare && "border-b bg-muted px-4 py-3 sm:px-6"), children: [_jsxs("div", { className: "min-w-0", children: [title && (_jsx("h2", { className: "text-lg sm:text-xl font-extrabold leading-tight tracking-tight truncate", children: title })), description && (_jsx("p", { className: "text-sm text-muted-foreground", children: description }))] }), actions && _jsx("div", { className: "flex items-center gap-2", children: actions })] })), _jsx("div", { className: cn(!bare && "p-4 sm:p-6"), children: children })] }));
}
const gapSize = {
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
};
export function ResponsiveStack({ gap = "md", direction = "row", align = "stretch", className, ...props }) {
    return (_jsx("div", { className: cn("flex flex-wrap", direction === "col" ? "flex-col" : "flex-row", align === "center" && "items-center", align === "start" && "items-start", align === "end" && "items-end", align === "stretch" && "items-stretch", gapSize[gap], className), ...props }));
}
//# sourceMappingURL=page-section.js.map