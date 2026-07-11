import { useState } from 'react';
import { useAccessibilityProfile } from './hooks/useAccessibilityProfile';
import { useLanguage } from './hooks/useLanguage';
import { useChat } from './hooks/useChat';
import { MapView } from './components/MapView';
import { ChatConsole } from './components/ChatConsole';
import { AccessibilityPanel } from './components/AccessibilityPanel';
import { LanguageIndicator } from './components/LanguageIndicator';
import { AlertBanner } from './components/AlertBanner';
import { OpsLiteDashboard } from './components/OpsLiteDashboard';
import type { PathResult, LiveEvent } from './types';
import initialLiveEvents from './data/mockLiveEvents.json';

export default function App() {
  const {
    prefs,
    setProfile,
    toggleHighContrast,
    toggleLargeText,
    toggleVoiceOutput,
  } = useAccessibilityProfile();

  const {
    language,
    languageDisplayName,
    setDetectedLanguage,
  } = useLanguage();

  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>(initialLiveEvents as LiveEvent[]);
  const [computedRoute, setComputedRoute] = useState<PathResult | null>(null);
  const [routeLabels, setRouteLabels] = useState<string[]>([]);
  const [isA11yOpen, setIsA11yOpen] = useState(false);
  const [isOpsOpen, setIsOpsOpen] = useState(false);

  const onRouteComputed = (route: PathResult | null, labels: string[]) => {
    setComputedRoute(route);
    setRouteLabels(labels);
  };

  const {
    messages,
    isLoading,
    isOffline,
    sendMessage,
    clearMessages,
  } = useChat(prefs, liveEvents, setDetectedLanguage, onRouteComputed);

  const handleDismissAlert = (id: string) => {
    setLiveEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div
      className="app"
      data-high-contrast={prefs.highContrast ? 'true' : 'false'}
      data-large-text={prefs.largeText ? 'true' : 'false'}
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="app-header" role="banner">
        <a href="/" className="app-logo" aria-label="Setu Stadium Concierge Home">
          <div>
            <h1 className="app-logo-text">Setu</h1>
            <span className="app-logo-sub">FIFA World Cup 2026 Concierge</span>
          </div>
        </a>

        <div className="header-actions">
          <LanguageIndicator language={language} displayName={languageDisplayName} />
          
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setIsA11yOpen(true)}
            aria-label="Open accessibility settings"
          >
            ♿ Accessibility
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setIsOpsOpen(true)}
            aria-label="Open operations dashboard"
          >
            📊 Ops Lite
          </button>
        </div>
      </header>

      <main id="main-content" className="app-main" role="main">
        {/* Map view & active alerts */}
        <section className="map-panel" aria-label="Stadium map and active alerts">
          {liveEvents.length > 0 && (
            <div className="map-alerts" aria-label="Active venue alerts">
              {liveEvents.map((evt) => (
                <AlertBanner key={evt.id} event={evt} onDismiss={handleDismissAlert} />
              ))}
            </div>
          )}

          <MapView route={computedRoute} routeLabels={routeLabels} liveEvents={liveEvents} />
        </section>

        {/* Chat assistant console */}
        <ChatConsole
          messages={messages}
          isLoading={isLoading}
          isOffline={isOffline}
          sendMessage={sendMessage}
          clearMessages={clearMessages}
          isDeafProfile={prefs.profile === 'deaf_hoh'}
        />
      </main>

      {/* Accessibility Panel Modal */}
      <AccessibilityPanel
        isOpen={isA11yOpen}
        onClose={() => setIsA11yOpen(false)}
        prefs={prefs}
        setProfile={setProfile}
        toggleHighContrast={toggleHighContrast}
        toggleLargeText={toggleLargeText}
        toggleVoiceOutput={toggleVoiceOutput}
      />

      {/* Ops Lite Dashboard Modal */}
      <OpsLiteDashboard
        isOpen={isOpsOpen}
        onClose={() => setIsOpsOpen(false)}
        messages={messages}
      />
    </div>
  );
}
