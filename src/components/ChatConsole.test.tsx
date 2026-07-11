import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatConsole } from './ChatConsole';
import type { ChatMessage } from '../types';

const mockMessages: ChatMessage[] = [
  { id: 'm1', role: 'user', content: 'hello', timestamp: new Date().toISOString() },
  { id: 'm2', role: 'assistant', content: 'Hi there!', timestamp: new Date().toISOString() },
];

describe('ChatConsole Component', () => {
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

    const input = screen.getByPlaceholderText(/Type or speak/i);
    fireEvent.change(input, { target: { value: 'where is gate 3' } });

    const form = screen.getByRole('textbox').closest('form');
    expect(form).not.toBeNull();
    if (form) {
      fireEvent.submit(form);
    }

    expect(handleSend).toHaveBeenCalledWith('where is gate 3');
  });
});
