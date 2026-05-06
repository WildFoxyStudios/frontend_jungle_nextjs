import * as React from "react";
export interface ErrorStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    title?: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
}
export declare function ErrorState({ title, description, action, className, ...props }: ErrorStateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=error-state.d.ts.map