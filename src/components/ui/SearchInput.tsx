import React from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import { Input, type InputProps } from './Input';

export interface SearchInputProps extends Omit<InputProps, 'searchIcon'> {
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<TextStyle>;
}

export function SearchInput({
  placeholder = 'Search...',
  containerStyle,
  ...rest
}: SearchInputProps) {
  return (
    <Input searchIcon placeholder={placeholder} containerStyle={containerStyle} {...rest} />
  );
}
