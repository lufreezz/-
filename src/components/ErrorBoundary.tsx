import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-lg w-full border border-red-100">
            <h2 className="text-2xl font-bold text-red-600 mb-4">游戏加载失败 (Game Error)</h2>
            <p className="text-stone-600 mb-4">
              很抱歉，游戏遇到了一个错误。请尝试刷新页面。
              <br/>
              (Sorry, the game encountered an error. Please try refreshing.)
            </p>
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 mb-6 overflow-auto max-h-48">
              <code className="text-xs text-red-500 font-mono">
                {this.state.error?.message || 'Unknown Error'}
              </code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
            >
              刷新页面 (Reload)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
