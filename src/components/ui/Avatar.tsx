import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { buildAvatarImageUri } from '@/lib/avatar-url';

import { Text } from './Text';
import { alpha, theme } from './theme';

export interface AvatarProps {
  uri?: string | null;
  cacheKey?: string | number | null;
  name?: string | null;
  size?: number;
  rounded?: boolean;
  style?: StyleProp<ImageStyle>;
}

function buildInitials(name?: string | null) {
  if (!name) return 'SO';

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'SO';
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export function Avatar({
  uri,
  cacheKey,
  name,
  size = 52,
  rounded = true,
  style,
}: AvatarProps) {
  const radius = rounded ? size / 2 : Math.min(size * 0.22, theme.radius.md);
  const dimensionStyle: ImageStyle = {
    width: size,
    height: size,
    borderRadius: radius,
  };
  const imageUri = buildAvatarImageUri(uri, cacheKey);

  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={[styles.image, dimensionStyle, style]}
      />
    );
  }

  return (
    <View style={[styles.placeholder, dimensionStyle as StyleProp<ViewStyle>, style as StyleProp<ViewStyle>]}>
      <Text variant="label" style={[styles.initials, { fontSize: size * 0.32 }]}>
        {buildInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: theme.border.regular,
    borderColor: theme.colors.borderSubtle,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentSoft,
    borderWidth: theme.border.regular,
    borderColor: alpha(theme.colors.accent, 0.2),
  },
  initials: {
    color: theme.colors.accent,
  },
});
