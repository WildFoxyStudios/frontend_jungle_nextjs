"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "../lib/utils";
export function EmptyState({ icon, title, description, action, className, ...props }) {
    return (_jsxs("div", { className: cn("mx-auto flex max-w-md flex-col items-center justify-center gap-3 border bg-card p-8 text-center shadow-sm", className), ...props, children: [icon ? (_jsx("div", { className: "grid h-12 w-12 place-items-center border bg-secondary text-secondary-foreground shadow-xs", children: icon })) : null, _jsx("h3", { className: "text-lg font-extrabold leading-tight tracking-tight", children: title }), description ? (_jsx("p", { className: "text-sm text-muted-foreground", children: description })) : null, action ? _jsx("div", { className: "mt-2", children: action }) : null] }));
}
//# sourceMappingURL=empty-state.js.map