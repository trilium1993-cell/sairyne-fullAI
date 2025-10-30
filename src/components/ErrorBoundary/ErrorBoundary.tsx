/**
 * Error Boundary Component
 * Ловит ошибки React и предотвращает полный краш UI
 * Критично для JUCE WebView - без этого падение = черный экран
 */

import React, { Component, ReactNode } from 'react';
import { logToJuce } from '../../services/audio';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Обновляем state чтобы следующий рендер показал fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Логируем ошибку
    console.error('❌ Error Boundary caught error:', {
      component: this.props.componentName || 'Unknown',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Отправляем в JUCE для логирования (если доступно)
    try {
      logToJuce(
        `React Error in ${this.props.componentName || 'Unknown'}: ${error.message}`,
        'error'
      );
    } catch (e) {
      // Если JUCE недоступен, ничего страшного
      console.warn('Could not log to JUCE:', e);
    }

    // Сохраняем errorInfo для отображения
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Если есть кастомный fallback - показываем его
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Иначе показываем дефолтный UI
      return (
        <div className="flex items-center justify-center w-full h-full bg-[#0a0a0a] text-white p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-4 text-red-500">
              Something went wrong
            </h1>
            <p className="text-gray-400 mb-2">
              {this.props.componentName && (
                <span className="text-purple-400">
                  Component: {this.props.componentName}
                  <br />
                </span>
              )}
              <span className="text-red-400">
                {this.state.error?.message || 'Unknown error'}
              </span>
            </p>

            {/* Показываем stack только в dev режиме */}
            {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-300">
                  Show error details
                </summary>
                <pre className="mt-2 p-3 bg-[#1a1a1a] rounded text-xs text-gray-400 overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

