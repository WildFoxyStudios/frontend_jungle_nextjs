"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
 children: ReactNode;
 fallback: ReactNode;
};

type State = { error: Error | null };

/**
 * Isolates Millicast / WebRTC failures so one bad SDK or codec path does not blank the whole app shell.
 */
export class LiveVideoErrorBoundary extends Component<Props, State> {
 state: State = { error: null };

 static getDerivedStateFromError(error: Error): State {
 return { error };
 }

 componentDidCatch(error: Error, info: ErrorInfo): void {
 console.error("[live video]", error, info.componentStack);
 if (typeof globalThis.reportError === "function") {
 globalThis.reportError(error);
 }
 }

 render(): ReactNode {
 if (this.state.error) return this.props.fallback;
 return this.props.children;
 }
}
