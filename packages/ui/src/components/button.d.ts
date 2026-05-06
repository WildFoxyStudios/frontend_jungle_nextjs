import * as React from "react";
import { type VariantProps } from "class-variance-authority";
declare const buttonVariants: (props?: ({
    variant?: "default" | "info" | "success" | "warning" | "destructive" | "link" | "outline" | "secondary" | "accent" | "soft-primary" | "soft-secondary" | "soft-accent" | "soft-success" | "soft-warning" | "soft-info" | "soft-destructive" | "glass" | "ghost" | null | undefined;
    size?: "default" | "touch" | "sm" | "lg" | "xl" | "icon" | "icon-sm" | "touch-icon" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}
declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
export { Button, buttonVariants };
//# sourceMappingURL=button.d.ts.map