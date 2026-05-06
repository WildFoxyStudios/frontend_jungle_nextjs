import * as React from "react";
export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    icon?: React.ReactNode;
    title: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
}
export declare function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=empty-state.d.ts.map