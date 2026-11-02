import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export type TabKey = 'home' | 'jobs' | 'tracking' | 'services' | 'portal';

interface BottomNavBarProps {
  currentTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  jobsCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onTabChange,
  jobsCount = 8,
}) => {
  const tabs: {
    key: TabKey;
    label: string;
    activeIcon: keyof typeof Ionicons.glyphMap;
    inactiveIcon: keyof typeof Ionicons.glyphMap;
    badge?: number;
  }[] = [
    { key: 'home', label: 'হোম', activeIcon: 'home', inactiveIcon: 'home-outline' },
    { key: 'jobs', label: 'চাকরি', activeIcon: 'briefcase', inactiveIcon: 'briefcase-outline', badge: jobsCount },
    { key: 'tracking', label: 'ভিসা ট্র্যাক', activeIcon: 'shield-checkmark', inactiveIcon: 'shield-checkmark-outline' },
    { key: 'services', label: 'যাচাই ও সেবা', activeIcon: 'receipt', inactiveIcon: 'receipt-outline' },
    { key: 'portal', label: 'পোর্টাল', activeIcon: 'person', inactiveIcon: 'person-outline' },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.inactiveIcon}
                  size={20}
                  color={isActive ? colors.navy.primary : colors.text.muted}
                />
                {tab.badge && tab.badge > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]} numberOfLines={1}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
      },
    }),
  },
  container: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrapper: {
    position: 'relative',
    padding: 3,
    borderRadius: 12,
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(30, 41, 59, 0.08)',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: -4,
    backgroundColor: colors.gold.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  tabLabel: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.navy.primary,
    fontWeight: 'bold',
  },
});
