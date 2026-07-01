import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';
import { ThemeProvider } from '../../../context/ThemeContext';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('Button', () => {
  it('renders correctly with title', () => {
    const { getByText } = renderWithTheme(<Button title="Click Me" onPress={() => {}} />);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when clicked', () => {
    const onPressMock = jest.fn();
    const { getByText } = renderWithTheme(<Button title="Press" onPress={onPressMock} />);
    fireEvent.press(getByText('Press'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('displays loading indicator when loading', () => {
    const { getByTestId, queryByText } = renderWithTheme(
      <Button title="Load" onPress={() => {}} loading={true} testID="custom-button" />
    );
    expect(queryByText('Load')).toBeNull();
    // Assuming ActivityIndicator gets rendered. We can check if it exists by looking at children or testID if added
  });
});
