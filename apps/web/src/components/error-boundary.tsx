'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border bg-card p-8">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">Please refresh or try again later.</p>
            <Button onClick={() => this.setState({ hasError: false })}>Retry</Button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
