import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChatConsole } from './ChatConsole';
import type { ChatMessage } from '../types';

const mockMessages: ChatMessage[] = [
  { id: 'm1', role: 'user', content: 'hello', timestamp: new Date().toISOString() },
  { id: 'm2', role: 'assistant', content: 'Hi there!', timestamp: new Date().toISOString() },
];

const mockMessagesWithRoute: ChatMessage[] = [
  {
    id: 'm3',
    role: 'assistant',
    content: 'Walk straight ahead.',
    timestamp: new Date().toISOString(),
    route: { path: ['gate-4', 'restroom-a'], totalDistance: 150 },
    language: 'en',
  },
];

describe('ChatConsole Component', () => {
  beforeEach(() => {
    // Ensure SpeechRecognition is undefined so VoiceInputButton returns null (simpler DOM)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SpeechRecognition = undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).webkitSpeechRecognition = undefined;
  });

  it('renders chat history and welcomes user if empty', () => {
    render(
      <ChatConsole
        messages={[]}
        isLoading={false}
        isOffline={false}
        sendMessage={vi.fn()}
        clearMessages={vi.fn()}
        isDeafProfile={false}
      />
    );
    expect(screen.getByText(/Welcome! Ask me anything/i)).toBeInTheDocument();
  });

  it('renders existing messages', () => {
    render(
      <ChatConsole
        messages={mockMessages}
        isLoading={false}
        isOffline={false}
        sendMessage={vi.fn()}
        clearMessages={vi.fn()}
        isDeafProfile={false}
      />
    );
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('calls sendMessage when send button is clicked with text', async () => {
    const handleSend = vi.fn().mockResolvedValue(undefined);
    render(
      <ChatConsole
        messages={[]}
        isLoading={false}
        isOffline={false}
        sendMessage={handleSend}
        clearMessages={vi.fn()}
        isDeafProfile={false}
      />
    );

    const input = screen.getByPlaceholderText(/Type or speak/i);
    fireEvent.change(input, { target: { value: 'where is gate 3' } });

    const form = screen.getByRole('textbox').closest('form');
    expect(form).not.toBeNull();
    if (form) {
      fireEvent.submit(form);
    }

    expect(handleSend).toHaveBeenCalledWith('where is gate 3');
  });

  it('submits on Enter key press without Shift', async () => {
    const handleSend = vi.fn().mockResolvedValue(undefined);
    render(
      <ChatConsole
        messages={[]}
        isLoading={false}
        isOffline={false}
        sendMessage={handleSend}
        clearMessages={vi.fn()}
        isDeafProfile={false}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Find food' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    expect(handleSend).toHaveBeenCalledWith('Find food');
  });

  it('does NOT submit on Shift+Enter key press', async () => {
    const handleSend = vi.fn();
    render(
      <ChatConsole
        messages={[]}
        isLoading={false}
        isOffline={false}
        sendMessage={handleSend}
        clearMessages={vi.fn()}
        isDeafProfile={false}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'multi\nline' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

    expect(handleSend).not.toHaveBeenCalled();
  });

  it('does not call sendMessage when input is empty', () => {
    const handleSend = vi.fn();
    render(
      <ChatConsole
        messages={[]}
        isLoading={false}
        isOffline={false}
        sendMessage={handleSend}
        clearMessages={vi.fn()}
        isDeafProfile={false}
      />
    );

    const form = screen.getByRole('textbox').closest('form');
    if (form) fireEvent.submit(form);
    expect(handleSend).not.toHaveBeenCalled();
  });

  it('does not call sendMessage when isLoading is true', () => {
    const handleSend = vi.fn();
    render(
      <ChatConsole
        messages={[]}
        isLoading={true}
        isOffline={false}
        sendMessage={handleSend}
        clearMessages={vi.fn()}
        isDeafProfile={false}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test query' } });
    const form = input.closest('form');
    if (form) fireEvent.submit(form);
    expect(handleSend).not.toHaveBeenCalled();
  });

  it('shows loading indicator when isLoading is true', () => {
    render(
      <ChatConsole
        messages={[]}
        isLoading={true}
        isOffline={false}
        sendMessage={vi.fn()}
        clearMessages={vi.fn()}
        isDeafProfile={false}
      />
    );
    expect(screen.getByLabelText(/Assistant is typing/i)).toBeInTheDocument();
  });

  it('shows offline banner when isOffline is true', () => {
    render(
      <ChatConsole
        messages={[]}
        isLoading={false}
        isOffline={true}
        sendMessage={vi.fn()}
        clearMessages={vi.fn()}
        isDeafProfile={false}
      />
    );
    expect(screen.getByText(/You are currently offline/i)).toBeInTheDocument();
  });

  it('shows offline placeholder in textarea when offline', () => {
    render(
      <ChatConsole
        messages={[]}
        isLoading={false}
        isOffline={true}
        sendMessage={vi.fn()}
        clearMessages={vi.fn()}
        isDeafProfile={false}
      />
    );
    expect(screen.getByPlaceholderText(/Offline mode/i)).toBeInTheDocument();
  });

  it('renders route summary in messages that have a route', () => {
    render(
      <ChatConsole
        messages={mockMessagesWithRoute}
        isLoading={false}
        isOffline={false}
        sendMessage={vi.fn()}
        clearMessages={vi.fn()}
        isDeafProfile={false}
      />
    );
    expect(screen.getByText(/Calculated Route/i)).toBeInTheDocument();
    expect(screen.getByText(/150 meters/i)).toBeInTheDocument();
  });

  it('renders language tag in messages that have a language', () => {
    render(
      <ChatConsole
        messages={mockMessagesWithRoute}
        isLoading={false}
        isOffline={false}
        sendMessage={vi.fn()}
        clearMessages={vi.fn()}
        isDeafProfile={false}
      />
    );
    // Language tag appended to timestamp in message-meta
    expect(screen.getByText(/\(en\)/i)).toBeInTheDocument();
  });

  it('calls clearMessages when Reset is clicked', () => {
    const handleClear = vi.fn();
    render(
      <ChatConsole
        messages={mockMessages}
        isLoading={false}
        isOffline={false}
        sendMessage={vi.fn()}
        clearMessages={handleClear}
        isDeafProfile={false}
      />
    );
    const resetBtn = screen.getByRole('button', { name: /Clear chat messages/i });
    fireEvent.click(resetBtn);
    expect(handleClear).toHaveBeenCalled();
  });

  it('updates input when set-chat-input custom event fires', () => {
    render(
      <ChatConsole
        messages={[]}
        isLoading={false}
        isOffline={false}
        sendMessage={vi.fn()}
        clearMessages={vi.fn()}
        isDeafProfile={false}
      />
    );

    act(() => {
      const event = new CustomEvent('set-chat-input', { detail: 'Tell me about Gate 4' });
      window.dispatchEvent(event);
    });

    const input = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(input.value).toBe('Tell me about Gate 4');
  });

  it('calls scrollIntoView when messages are added', async () => {
    const scrollIntoViewMock = vi.fn();
    // Assign mock before render so the ref picks it up
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    const { rerender } = render(
      <ChatConsole
        messages={[]}
        isLoading={false}
        isOffline={false}
        sendMessage={vi.fn()}
        clearMessages={vi.fn()}
        isDeafProfile={false}
      />
    );

    await act(async () => {
      rerender(
        <ChatConsole
          messages={mockMessages}
          isLoading={false}
          isOffline={false}
          sendMessage={vi.fn()}
          clearMessages={vi.fn()}
          isDeafProfile={false}
        />
      );
    });

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('sets input from voice transcript via VoiceInputButton onTranscript callback', async () => {
    // Enable SpeechRecognition so VoiceInputButton renders its button
    const mockRecognition = {
      start: vi.fn(),
      stop: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      abort: vi.fn(),
      continuous: false,
      interimResults: false,
      lang: '',
      onresult: null,
      onerror: null,
      onend: null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SpeechRecognition = vi.fn(() => mockRecognition);

    render(
      <ChatConsole
        messages={[]}
        isLoading={false}
        isOffline={false}
        sendMessage={vi.fn()}
        clearMessages={vi.fn()}
        isDeafProfile={false}
      />
    );

    // Simulate a voice result by calling the onresult handler directly
    const voiceBtn = screen.getByRole('button', { name: /start voice input/i });
    fireEvent.click(voiceBtn);

    // Simulate speech recognition result with isFinal: true
    await act(async () => {
      if (mockRecognition.onresult) {
        const mockEvent = {
          resultIndex: 0,
          results: {
            length: 1,
            0: {
              isFinal: true,
              0: { transcript: 'where is the exit' },
            },
          },
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mockRecognition.onresult as any)(mockEvent);
      }
    });

    const input = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(input.value).toBe('where is the exit');

    // cleanup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SpeechRecognition = undefined;
  });
});

