import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { priorityColors } from '../config/theme';

const PriorityBadge = ({ priority = 'medium', size = 'medium' }) => {
  const normalized = priority ? priority.toLowerCase() : 'medium';
  const config = priorityColors[normalized] || priorityColors.medium;
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          paddingHorizontal: isSmall ? 6 : 8,
          paddingVertical: isSmall ? 2 : 3,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: config.text,
            fontSize: isSmall ? 10 : 11,
          },
        ]}
      >
        {normalized.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default PriorityBadge;
