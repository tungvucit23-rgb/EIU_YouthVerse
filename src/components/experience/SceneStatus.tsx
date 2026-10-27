"use client";

import { Component, type ReactNode } from "react";

export function SceneLoadingScreen() {
  return <div className="scene-loading" role="status"><span className="loading-track"><span /></span>Đang chuẩn bị cánh buồm…</div>;
}

export class SceneErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}
