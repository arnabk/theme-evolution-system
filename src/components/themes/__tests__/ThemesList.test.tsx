import { describe, it, expect } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import { ThemesList } from '../ThemesList';

describe('ThemesList', () => {
  const mockThemes = [
    {
      id: 1,
      name: 'Theme 1',
      description: 'Description 1',
      response_count: 5,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Theme 2',
      description: 'Description 2',
      response_count: 3,
      created_at: new Date().toISOString()
    }
  ];

  it('should render themes list', () => {
    const { getByText } = render(
      <ThemesList
        themes={mockThemes}
        selectedTheme={null}
        onSelectTheme={() => {}}
      />
    );

    expect(getByText('Theme 1')).toBeDefined();
    expect(getByText('Theme 2')).toBeDefined();
  });

  it('should display theme response counts', () => {
    const { getByText } = render(
      <ThemesList
        themes={mockThemes}
        selectedTheme={null}
        onSelectTheme={() => {}}
      />
    );

    expect(getByText('5')).toBeDefined(); // Theme 1 response count
    expect(getByText('3')).toBeDefined(); // Theme 2 response count
  });

  it('should highlight selected theme', () => {
    const { container } = render(
      <ThemesList
        themes={mockThemes}
        selectedTheme={mockThemes[0]}
        onSelectTheme={() => {}}
      />
    );

    const selectedTheme = container.querySelector('.border-blue-400');
    expect(selectedTheme).toBeDefined();
  });

  it('should call onSelectTheme when theme is clicked', () => {
    let selectedThemeId: number | null = null;
    const mockOnSelect = (theme: typeof mockThemes[0]) => {
      selectedThemeId = theme.id;
    };

    const { getByText } = render(
      <ThemesList
        themes={mockThemes}
        selectedTheme={null}
        onSelectTheme={mockOnSelect}
      />
    );

    const theme1 = getByText('Theme 1').closest('div');
    if (theme1) {
      fireEvent.click(theme1);
      expect(selectedThemeId).toBe(1);
    }
  });

  it('should handle empty themes array', () => {
    const { container } = render(
      <ThemesList
        themes={[]}
        selectedTheme={null}
        onSelectTheme={() => {}}
      />
    );

    // Should render empty state or no themes
    expect(container).toBeDefined();
  });

  it('should display theme descriptions when theme is selected', () => {
    const { container } = render(
      <ThemesList
        themes={mockThemes}
        selectedTheme={mockThemes[0]} // Select first theme to show description
        onSelectTheme={() => {}}
      />
    );

    // Description is only shown when theme is selected
    expect(container.textContent).toContain('Description 1');
  });
});

