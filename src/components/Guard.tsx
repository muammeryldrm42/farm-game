'use client';
// A part of the screen that fails to draw (a bug in a window, say) must not take the whole game
// down with it: React would otherwise clear everything and leave the player on an empty screen.
// `onError` tidies up (closes the window that failed) and the part is drawn again; one that keeps
// failing is left out (`fallback`) until the game is opened again.
import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; onError?: (e: unknown) => void; fallback?: ReactNode }

export class Guard extends Component<Props, { failed: boolean }> {
  state = { failed: false };
  private fails: number[] = [];

  static getDerivedStateFromError() { return { failed: true }; }

  componentDidCatch(e: unknown) {
    console.error(e);
    this.props.onError?.(e);
    // drawn again a moment later; three failures within ten seconds and it stays out
    const now = Date.now();
    this.fails = [...this.fails.filter((t) => now - t < 10000), now];
    if (this.fails.length < 3) setTimeout(() => this.setState({ failed: false }), 50);
  }

  render() { return this.state.failed ? (this.props.fallback ?? null) : this.props.children; }
}
