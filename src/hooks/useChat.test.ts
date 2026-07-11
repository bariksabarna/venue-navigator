import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from './useChat';
import { parseIntent, generateResponse } from '../lib/gemini';
import type { AccessibilityPrefs, LiveEvent } from '../types';

// Mock gemini module
vi.mock('../lib/gemini', () => ({
  parseIntent: vi.fn(),
  generateResponse: vi.fn(),
}));

const mockPrefs: AccessibilityPrefs = {
  profile: 'none',
  highContrast: false,
  largeText: false,
  voiceOutput: false,
};

const mockEvents: LiveEvent[] = [];

describe('useChat hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
