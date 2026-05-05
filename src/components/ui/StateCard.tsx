import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from './Button';
import { Surface, type SurfaceTone } from './Surface';
import { Text } from './Text';
import { alpha, theme } from './theme';

export interface StateCardProps {
  title: string;
  description?: string;
  tone?: SurfaceTone;
  loading?: boolean;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  actionLabel?: string;
  onActionPress?: () => void;
}

export function StateCard({
  title,
  description,
  tone = 'default',
  loading = false,
  icon,
  actionLabel,
  onActionPress,
}: StateCardProps) {
  const iconColors = getIconColors(tone);

  return (
    <Surface tone={tone} elevated={tone === 'default'} style={styles.surface}>
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.accent} />
        ) : null}
        {!loading && icon ? (
          <View style={[styles.iconWrap, { backgroundColor: iconColors.backgroundColor }]}>
            <MaterialCommunityIcons name={icon} size={20} color={iconColors.color} />
          </View>
        ) : null}
        <Text variant="title">{title}</Text>
        {description ? (
          <Text variant="body" style={styles.description}>
            {description}
          </Text>
        ) : null}
        {actionLabel && onActionPress ? (
          <Button title={actionLabel} variant="outline" size="small" onPress={onActionPress} />
        ) : null}
      </View>
    </Surface>
  );
}

function getIconColors(tone: SurfaceTone) {
  switch (tone) {
    case 'danger':
      return {
        backgroundColor: alpha(theme.colors.danger, 0.12),
        color: theme.colors.danger,
      };
    case 'success':
      return {
        backgroundColor: alpha(theme.colors.success, 0.12),
        color: theme.colors.success,
      };
    case 'warning':
      return {
        backgroundColor: alpha(theme.colors.warning, 0.12),
        color: theme.colors.warning,
      };
    case 'dark':
      return {
        backgroundColor: alpha(theme.colors.white, 0.14),
        color: theme.colors.textOnDark,
      };
    default:
      return {
        backgroundColor: theme.colors.accentSoft,
        color: theme.colors.accent,
      };
  }
}

const styles = StyleSheet.create({
  surface: {
    padding: theme.spacing.xl,
  },
  container: {
    gap: theme.spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    color: theme.colors.textMuted,
  },
});
