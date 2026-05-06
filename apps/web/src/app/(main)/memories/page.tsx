import React, { Suspense } from "react";
import { MemoriesClient } from "./MemoriesClient";

export const metadata = {
  title: "Memories | Jungle",
  description: "Relive your past moments and memories.",
};

function ErrorFallback() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
      <p className="text-lg font-semibold">Something went wrong</p>
      <p className="text-muted-foreground">Could not load memories. Please try again.</p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}

class MemoriesErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return React.createElement(ErrorFallback);
    return this.props.children;
  }
}

export default function MemoriesPage() {
  return React.createElement(
    MemoriesErrorBoundary,
    null,
    React.createElement(
      Suspense,
      { fallback: React.createElement('div', { className: 'flex items-center justify-center py-20' }, React.createElement('div', { className: 'h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent' })) },
      React.createElement(MemoriesClient)
    )
  );
}
