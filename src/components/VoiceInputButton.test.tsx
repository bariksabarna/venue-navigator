import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VoiceInputButton } from './VoiceInputButton';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockInstance: any = null;

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onresult: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onerror: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onend: any = null;
  start() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    mockInstance = this;
  }
  stop() {
    mockInstance = null;
  }
}

describe('VoiceInputButton Component', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalSpeech = (window as any).SpeechRecognition;

  beforeEach(() => {
    vi.clearAllMocks();
    mockInstance = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SpeechRecognition = MockSpeechRecognition;
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SpeechRecognition = originalSpeech;
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
      mockInstance.onresult({
        resultIndex: 0,
        results: [
          {
            isFinal: true,
            0: { transcript: 'Where is Gate 4?' },
          },
        ],
      });
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
      mockInstance.onresult({
        resultIndex: 0,
        results: [
          {
            isFinal: false,
            0: { transcript: 'Where is' },
          },
        ],
      });
    });

    // Expect the interim container to render visually-hidden transcript text
    expect(screen.getByText(/Interim transcript: Where is/i)).toBeInTheDocument();

    // Simulate error event
    act(() => {
      mockInstance.onerror();
    });
    expect(button).not.toHaveClass('listening');

    // Start listening again
    fireEvent.click(button);
    expect(button).toHaveClass('listening');

    // Simulate end event
    act(() => {
      mockInstance.onend();
    });
    expect(button).not.toHaveClass('listening');
  });
});
