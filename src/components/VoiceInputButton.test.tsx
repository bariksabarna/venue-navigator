import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VoiceInputButton } from './VoiceInputButton';

describe('VoiceInputButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
