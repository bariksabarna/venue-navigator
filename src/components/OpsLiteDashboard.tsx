/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
import { useEffect, useState } from 'react';
import type { AggregatedCount } from '../types';

interface OpsLiteDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  messages: { content: string; timestamp: string }[];
}

export function OpsLiteDashboard({ isOpen, onClose, messages }: OpsLiteDashboardProps) {
  const [stats, setStats] = useState<AggregatedCount[]>([]);

  useEffect(() => {
    // Generate simulated/aggregated query stats from current messages plus baseline data
    const baselineStats: AggregatedCount[] = [
      { zone: 'gate-3', topic: 'congestion', count: 18, windowStart: new Date().toISOString() },
      { zone: 'gate-1', topic: 'tickets', count: 24, windowStart: new Date().toISOString() },
      { zone: 'center-hub', topic: 'amenities', count: 32, windowStart: new Date().toISOString() },
      { zone: 'gate-5', topic: 'accessibility', count: 12, windowStart: new Date().toISOString() },
    ];

    // Count user messages to increment stats dynamically (for demo purposes)
    const topicCounts: Record<string, number> = { congestion: 0, tickets: 0, amenities: 0, accessibility: 0 };
    messages.forEach((msg) => {
      const txt = msg.content.toLowerCase();
      if (txt.includes('gate') || txt.includes('crowd') || txt.includes('congestion')) {
        topicCounts.congestion++;
      } else if (txt.includes('ticket') || txt.includes('entry') || txt.includes('qr')) {
        topicCounts.tickets++;
      } else if (txt.includes('restroom') || txt.includes('food') || txt.includes('water')) {
        topicCounts.amenities++;
      } else if (txt.includes('wheelchair') || txt.includes('accessible') || txt.includes('ramp')) {
        topicCounts.accessibility++;
      }
    });

    const updatedStats = baselineStats.map((stat) => {
      const increment = topicCounts[stat.topic as keyof typeof topicCounts] || 0;
      return {
        ...stat,
        count: stat.count + increment,
      };
    });

    setStats(updatedStats);
  }, [messages, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="ops-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ops-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ops-panel-inner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 id="ops-title" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 600 }}>
            📊 Ops Lite — Real-time Operational Dashboard
          </h2>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Close Operations Dashboard"
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Anonymized query topic counts by stadium zone. No raw chat contents or user identity information are saved or displayed here.
        </p>

        <div className="ops-grid">
          {stats.map((stat, index) => (
            <div key={index} className="ops-card">
              <div className="ops-count" aria-live="polite">
                {stat.count}
              </div>
              <div className="ops-label">
                Topic: {stat.topic.charAt(0).toUpperCase() + stat.topic.slice(1)}
              </div>
              <div className="ops-zone">
                Zone: {stat.zone.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        <div className="ops-disclaimer">
          This read-only dashboard provides tournament operators and stewards with immediate aggregate insight into areas of passenger/fan friction.
        </div>
      </div>
    </div>
  );
}
