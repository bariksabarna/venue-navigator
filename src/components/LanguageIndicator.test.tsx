import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageIndicator } from './LanguageIndicator';

describe('LanguageIndicator Component', () => {
  it('renders the display name of the language', () => {
    render(<LanguageIndicator language="hi" displayName="हिंदी" />);
    expect(screen.getByText('हिंदी')).toBeInTheDocument();
  });
});
