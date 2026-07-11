/**
 * @fileoverview Tests for VoiceInputButton component.
 *
 * Covers: speech recognition button rendering, deaf profile hiding,
 * start/stop toggle, interim results, error/end handlers, and fallback APIs.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VoiceInputButton } from './VoiceInputButton';

interface SpeechWindow extends Window {
  SpeechRecognition?: unknown;
  webkitSpeechRecognition?: unknown;
}

interface MockSpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

let mockInstance: MockSpeechRecognition | null = null;

function setMockInstance(instance: MockSpeechRecognition | null) {
  mockInstance = instance;
}

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  onresult: ((event: MockSpeechRecognitionEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  onend: (() => void) | null = null;
  constructor() {
    setMockInstance(this);
  }
  start() {}
  stop() {
    setMockInstance(null);
  }
}
const testWindow = window as unknown as SpeechWindow;

describe('VoiceInputButton Component', () => {
  const originalSpeech = testWindow.SpeechRecognition;

  beforeEach(() => {
    vi.clearAllMocks();
    mockInstance = null;
    testWindow.SpeechRecognition = MockSpeechRecognition;
  });

  afterEach(() => {
    testWindow.SpeechRecognition = originalSpeech;
  });

  it('renders speech recognition button', () => {
    const handleTranscript = vi.fn();
    render(<VoiceInputButton onTranscript={handleTranscript} />);
    expect(screen.getByRole('button', { name: /start voice input/i })).toBeInTheDocument();
  });

  it('hides button when isDeafProfile is true', () => {
    const handleTranscript = vi.fn();
    const { container } = render(
      <VoiceInputButton onTranscript={handleTranscript} isDeafProfile={true} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('toggles listening state and calls onTranscript when speech is recognized', () => {
    const handleTranscript = vi.fn();
    render(<VoiceInputButton onTranscript={handleTranscript} />);

    const button = screen.getByRole('button', { name: /start voice input/i });
    expect(button).not.toHaveClass('listening');

    // Click to start listening
    fireEvent.click(button);
    expect(button).toHaveClass('listening');
    expect(mockInstance).not.toBeNull();

    // Simulate final result
    act(() => {
      if (mockInstance?.onresult) {
        mockInstance.onresult({
          resultIndex: 0,
          results: {
            length: 1,
            0: {
              isFinal: true,
              0: { transcript: 'Where is Gate 4?' },
            },
          },
        });
      }
    });

    expect(handleTranscript).toHaveBeenCalledWith('Where is Gate 4?');

    // Click to stop listening
    fireEvent.click(button);
    expect(button).not.toHaveClass('listening');
  });

  it('displays interim results and handles end/error events', () => {
    const handleTranscript = vi.fn();
    render(<VoiceInputButton onTranscript={handleTranscript} />);

    const button = screen.getByRole('button');

    // Start listening
    fireEvent.click(button);

    // Simulate interim result
    act(() => {
      if (mockInstance?.onresult) {
        mockInstance.onresult({
          resultIndex: 0,
          results: {
            length: 1,
            0: {
              isFinal: false,
              0: { transcript: 'Where is' },
            },
          },
        });
      }
    });

    // Expect the interim container to render visually-hidden transcript text
    expect(screen.getByText(/Interim transcript: Where is/i)).toBeInTheDocument();

    // Simulate error event
    act(() => {
      if (mockInstance?.onerror) {
        mockInstance.onerror();
      }
    });
    expect(button).not.toHaveClass('listening');

    // Start listening again
    fireEvent.click(button);
    expect(button).toHaveClass('listening');

    // Simulate end event
    act(() => {
      if (mockInstance?.onend) {
        mockInstance.onend();
      }
    });
    expect(button).not.toHaveClass('listening');
  });

  it('falls back to webkitSpeechRecognition when SpeechRecognition is undefined', () => {
    testWindow.SpeechRecognition = undefined;
    testWindow.webkitSpeechRecognition = MockSpeechRecognition;

    const handleTranscript = vi.fn();
    render(<VoiceInputButton onTranscript={handleTranscript} />);

    // Should still render with webkit fallback
    expect(screen.getByRole('button', { name: /start voice input/i })).toBeInTheDocument();

    testWindow.webkitSpeechRecognition = undefined;
  });

  it('returns null when no SpeechRecognition API is available', () => {
    testWindow.SpeechRecognition = undefined;
    testWindow.webkitSpeechRecognition = undefined;

    const handleTranscript = vi.fn();
    const { container } = render(<VoiceInputButton onTranscript={handleTranscript} />);
    expect(container.firstChild).toBeNull();
  });
});
