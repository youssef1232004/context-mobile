import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../Input';
import { ThemeProvider } from '../../../context/ThemeContext';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('Input', () => {
  it('renders correctly with placeholder', () => {
    const { getByPlaceholderText } = renderWithTheme(<Input placeholder="Enter text" />);
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const onChangeTextMock = jest.fn();
    const { getByPlaceholderText } = renderWithTheme(
      <Input placeholder="Enter text" onChangeText={onChangeTextMock} />
    );
    fireEvent.changeText(getByPlaceholderText('Enter text'), 'Hello');
    expect(onChangeTextMock).toHaveBeenCalledWith('Hello');
  });

  it('displays error message when error prop is provided', () => {
    const { getByText } = renderWithTheme(
      <Input placeholder="Enter text" error="Invalid input" />
    );
    expect(getByText('Invalid input')).toBeTruthy();
  });
});
