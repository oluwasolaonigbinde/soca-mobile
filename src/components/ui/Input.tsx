import React from 'react';
import {
    StyleSheet,
    TextInput,
    type TextInputProps,
    type TextStyle,
} from 'react-native';

export interface InputProps extends TextInputProps {
  style?: TextStyle;
}

export function Input({ style, ...rest }: InputProps) {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor="#999"
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111',
    backgroundColor: '#fff',
  },
});
