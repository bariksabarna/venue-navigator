/**
 * @fileoverview ChatConsole — the primary fan-facing AI chat interface.
 *
 * Renders the message list (with aria-live announcements), the text/voice input
 * form, and a typing indicator while the AI pipeline is running.
 * All styling uses CSS class names defined in index.css — no inline styles.
 *
 * @component
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { VoiceInputButton } from './VoiceInputButton';
import { textToSafeHtml } from '../lib/sanitize';

interface ChatConsoleProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isOffline: boolean;
  sendMessage: (query: string) => Promise<void>;
  clearMessages: () => void;
  isDeafProfile: boolean;
}

/**
 * ChatConsole renders the full chat UI: message history, loading indicator,
 * offline notice, and the text/voice input form.
 */
export function ChatConsole({
  messages,
  isLoading,
  isOffline,
  sendMessage,
  clearMessages,
  isDeafProfile,
}: ChatConsoleProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current?.scrollIntoView) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const query = input;
    setInput('');
    await sendMessage(query);
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInput(transcript);
  };

  return (
    <div className="chat-panel" role="region" aria-label="Stadium concierge assistant chat console">
      <div className="chat-header">
        <span aria-hidden="true" className="chat-header-icon">💬</span>
        <h2 className="chat-header-title">Concierge Chat</h2>
        <button
          type="button"
          onClick={clearMessages}
          className="btn btn-ghost chat-reset-btn"
          aria-label="Clear chat messages"
          disabled={messages.length === 0}
        >
          Reset
        </button>
      </div>

      <div
        className="chat-messages"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.length === 0 && (
          <div className="chat-empty-state">
            <span aria-hidden="true" className="chat-empty-icon">👋</span>
            <p>Welcome! Ask me anything about the venue, events, tickets, or where to find restrooms, food, and gates.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <span className="visually-hidden">
              {msg.role === 'user' ? 'You said:' : 'Assistant says:'}
            </span>
            <div
              className="message-bubble"
              dangerouslySetInnerHTML={{ __html: textToSafeHtml(msg.content) }}
            />
            {msg.route && (
              <div className="message-route-summary">
                <strong>📌 Calculated Route:</strong>
                <p className="message-route-distance">
                  Total distance: {Math.round(msg.route.totalDistance)} meters
                </p>
              </div>
            )}
            <div className="message-meta">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {msg.language && ` (${msg.language})`}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant">
            <div className="message-bubble">
              <div className="message-loading" aria-label="Assistant is typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {isOffline && (
        <div className="offline-notice">
          <span aria-hidden="true">⚠️</span> You are currently offline. Basic maps are cached and operational.
        </div>
      )}

      <form className="chat-input-area" onSubmit={handleSubmit}>
        <div className="chat-input-row">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={isOffline ? 'Offline mode...' : 'Type or speak: "Where is Gate 4?"'}
            className="chat-input"
            maxLength={500}
            rows={1}
            disabled={isLoading}
            aria-label="Send a message to the concierge assistant"
          />

          <VoiceInputButton
            onTranscript={handleVoiceTranscript}
            disabled={isLoading || isOffline}
            isDeafProfile={isDeafProfile}
          />

          <button
            type="submit"
            className="chat-send-btn"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            ➔
          </button>
        </div>
        <div className="chat-char-count">
          {input.length}/500
        </div>
      </form>
    </div>
  );
}
