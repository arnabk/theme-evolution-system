import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { QuestionDisplay } from '../QuestionDisplay';

describe('QuestionDisplay', () => {
  it('should render question when provided', () => {
    const question = 'What are your thoughts on remote work?';
    const { getByText } = render(<QuestionDisplay question={question} />);
    
    expect(getByText('Current Survey Question')).toBeDefined();
    expect(getByText(question)).toBeDefined();
    expect(getByText('Active Question')).toBeDefined();
  });

  it('should show empty state when question is empty', () => {
    const { getByText } = render(<QuestionDisplay question="" />);
    
    expect(getByText('No question generated yet')).toBeDefined();
    expect(getByText(/Click 🎯 Generate Question to start/)).toBeDefined();
  });

  it('should handle long questions', () => {
    const longQuestion = "This is a very long question that might span multiple lines and contain a lot of text to test how the component handles longer content and ensures proper rendering.";
    const { getByText } = render(<QuestionDisplay question={longQuestion} />);
    
    expect(getByText(longQuestion)).toBeDefined();
  });

  it('should handle special characters in question', () => {
    const specialQuestion = "What's your opinion on AI & ML? (Please be specific!)";
    const { getByText } = render(<QuestionDisplay question={specialQuestion} />);
    
    expect(getByText(specialQuestion)).toBeDefined();
  });

  it('should display correct heading', () => {
    const { getByText } = render(<QuestionDisplay question="Test question?" />);
    
    expect(getByText('Current Survey Question')).toBeDefined();
    expect(getByText('📋')).toBeDefined();
  });

  it('should show active indicator when question exists', () => {
    const { getByText } = render(<QuestionDisplay question="Test question?" />);
    
    const activeIndicator = getByText('Active Question');
    expect(activeIndicator).toBeDefined();
  });

  it('should show warning icon when no question', () => {
    const { getByText } = render(<QuestionDisplay question="" />);
    
    expect(getByText('⚠️')).toBeDefined();
  });
});

