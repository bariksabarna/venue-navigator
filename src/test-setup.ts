/**
 * @fileoverview Test setup — global mocks for jsdom environment.
 * Runs before every test file via vite.config.ts setupFiles.
 */
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Web Speech API (not available in jsdom)
Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: class {
    continuous = false;
    interimResults = false;
    lang = 'en-US';
    onresult: ((e: unknown) => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    onend: (() => void) | null = null;
    start() {}
    stop() {}
    abort() {}
  },
});
Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: (window as unknown as Record<string, unknown>).SpeechRecognition,
});

// Mock SpeechSynthesis
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => []),
    speaking: false,
    pending: false,
    paused: false,
  },
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
