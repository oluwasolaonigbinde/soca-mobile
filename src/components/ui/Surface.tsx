import React from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { theme } from './theme';

export type SurfaceTone = 'default' | 'tint' | 'accent' | 'danger' | 'success' | 'warning' | 'dark';

export interface SurfaceProps extends ViewProps {
  tone?: SurfaceTone;
  elevated?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

const toneStyles: Record<SurfaceTone, ViewStyle> = {
  default: {
    backgroundColor: theme.colors.surface,
    borderWidth: theme.border.hairline,
    borderColor: theme.colors.borderSubtle,
  },
  tint: {
    backgroundColor: theme.colors.surfaceTint,
    borderColor: theme.colors.border,
    borderWidth: theme.border.regular,
  },
  accent: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
    borderWidth: theme.border.regular,
  },
  danger: {
    backgroundColor: theme.colors.dangerSoft,
    borderColor: theme.colors.danger,
    borderWidth: theme.border.regular,
  },
  success: {
    backgroundColor: theme.colors.successSoft,
    borderColor: theme.colors.success,
    borderWidth: theme.border.regular,
  },
  warning: {
    backgroundColor: theme.colors.warningSoft,
    borderColor: theme.colors.warning,
    borderWidth: theme.border.regular,
  },
  dark: {
    backgroundColor: theme.colors.surfaceDark,
    borderWidth: theme.border.hairline,
    borderColor: theme.colors.borderSubtle,
  },
};

export function Surface({
  tone = 'default',
  elevated = false,
  padded = true,
  style,
  children,
  ...rest
}: SurfaceProps) {
  const flattenedStyle = StyleSheet.flatten(style);
  const { outerStyle, innerStyle } = splitSurfaceStyle(flattenedStyle);
  const borderRadius =
    typeof flattenedStyle?.borderRadius === 'number'
      ? flattenedStyle.borderRadius
      : theme.radius.lg;

  return (
    <View
      style={[styles.shadowFrame, { borderRadius }, outerStyle, elevated && styles.elevated]}
      {...rest}
    >
      <View
        style={[
          styles.base,
          { borderRadius },
          toneStyles[tone],
          padded && styles.padded,
          innerStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const OUTER_STYLE_KEYS = new Set<keyof ViewStyle>([
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginHorizontal',
  'marginVertical',
  'alignSelf',
  'flex',
  'flexBasis',
  'flexGrow',
  'flexShrink',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'start',
  'end',
  'zIndex',
]);

function splitSurfaceStyle(style: ViewStyle | undefined) {
  if (!style) {
    return {
      outerStyle: undefined,
      innerStyle: undefined,
    };
  }

  const outerStyle: ViewStyle = {};
  const innerStyle: ViewStyle = {};

  for (const [key, value] of Object.entries(style)) {
    if (OUTER_STYLE_KEYS.has(key as keyof ViewStyle)) {
      (outerStyle as Record<string, unknown>)[key] = value;
      continue;
    }

    (innerStyle as Record<string, unknown>)[key] = value;
  }

  return {
    outerStyle,
    innerStyle,
  };
}

const styles = StyleSheet.create({
  shadowFrame: {
    borderRadius: theme.radius.lg,
  },
  base: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  padded: {
    padding: theme.spacing.xl,
  },
  elevated: {
    ...theme.shadows.card,
  },
});
