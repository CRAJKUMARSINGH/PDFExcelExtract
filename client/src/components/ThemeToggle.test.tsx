import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';

// Mock the ThemeProvider
const mockSetTheme = vi.fn();
vi.mock('./ThemeProvider', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
  }),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Moon: ({ className }: { className?: string }) => <div data-testid="moon-icon" className={className} />,
  Sun: ({ className }: { className?: string }) => <div data-testid="sun-icon" className={className} />,
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render theme toggle button', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByTestId('button-theme-toggle');
    expect(button).toBeInTheDocument();
  });

  it('should show sun and moon icons', () => {
    render(<ThemeToggle />);
    
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
  });

  it('should call setTheme when clicked', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByTestId('button-theme-toggle');
    fireEvent.click(button);
    
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('should have screen reader text', () => {
    render(<ThemeToggle />);
    
    expect(screen.getByText('Toggle theme')).toBeInTheDocument();
  });
});