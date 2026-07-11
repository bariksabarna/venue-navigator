import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from './useChat';
import { parseIntent, generateResponse } from '../lib/gemini';
import { findShortestPath } from '../lib/pathfinding';
import { clearCache } from '../lib/cache';
import type { AccessibilityPrefs, LiveEvent } from '../types';

// Mock gemini module
vi.mock('../lib/gemini', () => ({
  parseIntent: vi.fn(),
  generateResponse: vi.fn(),
}));

// Mock pathfinding module
vi.mock('../lib/pathfinding', () => ({
  findShortestPath: vi.fn().mockReturnValue({
    success: true,
    data: { path: ['sec-101', 'gate-4'], totalDistance: 100 },
  }),
  pathToLabels: vi.fn().mockReturnValue(['Section 101', 'Gate 4 (SE)']),
}));

const mockPrefs: AccessibilityPrefs = {
  profile: 'none',
  highContrast: false,
  largeText: false,
  voiceOutput: false,
};

const mockEvents: LiveEvent[] = [];

describe('useChat hook', () => {
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    vi.clearAllMocks();
    clearCache();
    // Mock SpeechSynthesis safely
    if (typeof window !== 'undefined') {
      if (!window.speechSynthesis) {
        Object.defineProperty(window, 'speechSynthesis', {
          value: {
            speak: vi.fn(),
            cancel: vi.fn(),
            getVoices: vi.fn().mockReturnValue([]),
          },
          writable: true,
          configurable: true,
        });
      } else {
        vi.spyOn(window.speechSynthesis, 'speak').mockImplementation(() => {});
      }
      if (!window.SpeechSynthesisUtterance) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).SpeechSynthesisUtterance = function (text: string) {
          return { text, lang: '' };
        };
      }
    }
    // Restore default online state
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      configurable: true,
    });
  });

  it('initializes with empty messages and not loading', () => {
    const onLanguageDetected = vi.fn();
    const onRouteComputed = vi.fn();
    const { result } = renderHook(() =>
      useChat(mockPrefs, mockEvents, onLanguageDetected, onRouteComputed)
    );

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('sends user message and appends assistant response', async () => {
    const onLanguageDetected = vi.fn();
    const onRouteComputed = vi.fn();

    vi.mocked(parseIntent).mockResolvedValue({
      language: 'en',
      intent: 'smalltalk',
      destination_node_id: null,
      current_node_id: null,
      faq_topic: null,
      reading_level: 'standard',
    });

    vi.mocked(generateResponse).mockResolvedValue('Hello, I am Setu!');

    const { result } = renderHook(() =>
      useChat(mockPrefs, mockEvents, onLanguageDetected, onRouteComputed)
    );

    await act(async () => {
      await result.current.sendMessage('hello');
    });

    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[0].content).toBe('hello');
    expect(result.current.messages[1].content).toBe('Hello, I am Setu!');
    expect(onLanguageDetected).toHaveBeenCalledWith('en');
  });

  it('triggers route computation callback on navigate intent', async () => {
    const onLanguageDetected = vi.fn();
    const onRouteComputed = vi.fn();

    vi.mocked(parseIntent).mockResolvedValue({
      language: 'en',
      intent: 'navigate',
      destination_node_id: 'gate-4',
      current_node_id: 'sec-101',
      faq_topic: null,
      reading_level: 'standard',
    });

    vi.mocked(generateResponse).mockResolvedValue('Go to gate 4.');

    const { result } = renderHook(() =>
      useChat(mockPrefs, mockEvents, onLanguageDetected, onRouteComputed)
    );

    await act(async () => {
      await result.current.sendMessage('how do I get to gate 4 from sec-101?');
    });

    expect(onRouteComputed).toHaveBeenCalled();
    const lastCall = onRouteComputed.mock.calls[onRouteComputed.mock.calls.length - 1];
    expect(lastCall[0]).not.toBeNull(); // Computed route object
    expect(lastCall[1]).toContain('Gate 4 (SE)');
  });

  it('handles offline mode correctly', async () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
    });

    const onLanguageDetected = vi.fn();
    const onRouteComputed = vi.fn();

    const { result } = renderHook(() =>
      useChat(mockPrefs, mockEvents, onLanguageDetected, onRouteComputed)
    );

    await act(async () => {
      await result.current.sendMessage('hello offline');
    });

    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[1].content).toContain('offline');
    expect(parseIntent).not.toHaveBeenCalled();
  });

  it('hits response cache on repeated query', async () => {
    const onLanguageDetected = vi.fn();
    const onRouteComputed = vi.fn();

    vi.mocked(parseIntent).mockResolvedValue({
      language: 'en',
      intent: 'smalltalk',
      destination_node_id: null,
      current_node_id: null,
      faq_topic: null,
      reading_level: 'standard',
    });

    vi.mocked(generateResponse).mockResolvedValue('Cached Hello!');

    const { result } = renderHook(() =>
      useChat(mockPrefs, mockEvents, onLanguageDetected, onRouteComputed)
    );

    // Call 1
    await act(async () => {
      await result.current.sendMessage('hello again');
    });

    // Call 2
    await act(async () => {
      await result.current.sendMessage('hello again');
    });

    // The second time, it should hit the cache and not call Gemini generators again
    expect(parseIntent).toHaveBeenCalledTimes(1);
    expect(generateResponse).toHaveBeenCalledTimes(1);
  });

  it('handles API errors gracefully', async () => {
    const onLanguageDetected = vi.fn();
    const onRouteComputed = vi.fn();

    vi.mocked(parseIntent).mockRejectedValue(new Error('Network Fail'));

    const { result } = renderHook(() =>
      useChat(mockPrefs, mockEvents, onLanguageDetected, onRouteComputed)
    );

    await act(async () => {
      await result.current.sendMessage('hello crash');
    });

    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[1].content).toContain('steward');
  });

  it('speaks assistant response when voice output is enabled', async () => {
    const onLanguageDetected = vi.fn();
    const onRouteComputed = vi.fn();

    vi.mocked(parseIntent).mockResolvedValue({
      language: 'en',
      intent: 'smalltalk',
      destination_node_id: null,
      current_node_id: null,
      faq_topic: null,
      reading_level: 'standard',
    });

    vi.mocked(generateResponse).mockResolvedValue('Speaking now!');

    const voicePrefs = { ...mockPrefs, voiceOutput: true };

    const { result } = renderHook(() =>
      useChat(voicePrefs, mockEvents, onLanguageDetected, onRouteComputed)
    );

    await act(async () => {
      await result.current.sendMessage('hello speech');
    });

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it('clears messages and resets route', async () => {
    const onLanguageDetected = vi.fn();
    const onRouteComputed = vi.fn();

    const { result } = renderHook(() =>
      useChat(mockPrefs, mockEvents, onLanguageDetected, onRouteComputed)
    );

    // Add some initial messages
    vi.mocked(parseIntent).mockResolvedValue({
      language: 'en',
      intent: 'smalltalk',
      destination_node_id: null,
      current_node_id: null,
      faq_topic: null,
      reading_level: 'standard',
    });
    vi.mocked(generateResponse).mockResolvedValue('Blah');

    await act(async () => {
      await result.current.sendMessage('test clear');
    });

    expect(result.current.messages.length).toBe(2);

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages.length).toBe(0);
    expect(onRouteComputed).toHaveBeenLastCalledWith(null, []);
  });

  it('handles online and offline window events', () => {
    const onLanguageDetected = vi.fn();
    const onRouteComputed = vi.fn();

    const { result } = renderHook(() =>
      useChat(mockPrefs, mockEvents, onLanguageDetected, onRouteComputed)
    );

    expect(result.current.isOffline).toBe(false);

    // Trigger offline
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOffline).toBe(true);

    // Trigger online
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.isOffline).toBe(false);
  });

  it('handles failed pathfinding route computation', async () => {
    const onLanguageDetected = vi.fn();
    const onRouteComputed = vi.fn();

    vi.mocked(parseIntent).mockResolvedValue({
      language: 'en',
      intent: 'navigate',
      destination_node_id: 'gate-4',
      current_node_id: 'sec-101',
      faq_topic: null,
      reading_level: 'standard',
    });

    vi.mocked(findShortestPath).mockReturnValueOnce({ success: false, error: { type: 'NO_PATH_FOUND', from: 'sec-101', to: 'gate-4' } });
    vi.mocked(generateResponse).mockResolvedValue('Unable to find route.');

    const { result } = renderHook(() =>
      useChat(mockPrefs, mockEvents, onLanguageDetected, onRouteComputed)
    );

    await act(async () => {
      await result.current.sendMessage('navigate fail query');
    });

    expect(onRouteComputed).toHaveBeenCalledWith(null, []);
  });

  it('handles FAQ intent and retrieves relevant FAQs', async () => {
    const onLanguageDetected = vi.fn();
    const onRouteComputed = vi.fn();

    vi.mocked(parseIntent).mockResolvedValue({
      language: 'en',
      intent: 'faq',
      destination_node_id: null,
      current_node_id: null,
      faq_topic: 'tickets',
      reading_level: 'standard',
    });

    vi.mocked(generateResponse).mockResolvedValue('Here is FAQ info.');

    const { result } = renderHook(() =>
      useChat(mockPrefs, mockEvents, onLanguageDetected, onRouteComputed)
    );

    await act(async () => {
      await result.current.sendMessage('do I need tickets?');
    });

    expect(result.current.messages[1].content).toBe('Here is FAQ info.');
  });
});
