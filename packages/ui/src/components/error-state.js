"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertTriangle } from "lucide-react";
import { cn } from "../lib/utils";
export function ErrorState({ title = "Something broke", description = "An unexpected error happened. Try again or refresh the page.", action, className, ...props }) {
    return (_jsxs("div", { role: "alert", className: cn("mx-auto flex max-w-md flex-col items-center justify-center gap-3 border bg-destructive p-6 text-center text-destructive-foreground shadow-md", className), ...props, children: [_jsx("div", { className: "grid h-12 w-12 place-items-center border bg-card text-foreground shadow-xs", children: _jsx(AlertTriangle, { className: "h-6 w-6" }) }), _jsx("h3", { className: "text-lg font-extrabold uppercase leading-tight tracking-tight", children: title }), description ? (_jsx("p", { className: "text-sm font-medium opacity-95", children: description })) : null, action ? _jsx("div", { className: "mt-2", children: action }) : null] }));
}
//# sourceMappingURL=error-state.js.map