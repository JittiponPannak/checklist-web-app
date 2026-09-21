"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
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
    console.error("Uncaught component error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-rose-200 text-center space-y-3 shadow-2xs my-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center mx-auto">
            <AlertCircle size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text)]">
              {this.props.fallbackTitle || "เกิดข้อผิดพลาดในการโหลดส่วนประกอบนี้"}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-sm mx-auto leading-relaxed">
              {this.props.fallbackMessage || "ไม่สามารถแสดงผลข้อมูลในส่วนนี้ได้ กรุณาลองโหลดใหม่อีกครั้ง"}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[var(--color-surface-2)] hover:bg-rose-50 text-[var(--color-text)] hover:text-rose-700 border border-[var(--color-border)] hover:border-rose-200 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>ลองใหม่อีกครั้ง</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
