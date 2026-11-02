import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { AGENCY_INFO } from '../data/mockData';

interface HeaderProps {
  onNotificationPress?: () => void;
  language?: 'bn' | 'en';
  onToggleLanguage?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onNotificationPress,
  language = 'bn',
  onToggleLanguage,
}) => {
  const handleCall = () => {
    Linking.openURL(`tel:${AGENCY_INFO.hotline}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="airplane-takeoff" size={22} color={colors.text.white} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitle}>SHAKIL</Text>
              <Text style={styles.brandTitleGold}> TRAVELS</Text>
            </View>
            <View style={styles.badgeRow}>
              <View style={styles.govtBadge}>
                <Text style={styles.govtBadgeText}>RL-{AGENCY_INFO.license.replace('RL-', '')}</Text>
              </View>
              <Text style={styles.subtext}>Govt. Approved Agency</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {onToggleLanguage && (
            <TouchableOpacity 
              style={styles.langPill}
              onPress={onToggleLanguage}
              activeOpacity={0.8}
            >
              <Text style={[styles.langText, language === 'bn' && styles.langTextActive]}>বাং</Text>
              <Text style={styles.langDivider}>|</Text>
              <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.callButton} 
            onPress={handleCall}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={15} color={colors.text.white} />
            <Text style={styles.callText}>{language === 'bn' ? 'হটলাইন' : 'Call'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={onNotificationPress}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text.white} />
            <View style={styles.dotBadge} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.navy.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.emerald.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.white,
    letterSpacing: 0.5,
  },
  brandTitleGold: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.gold.badge,
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  govtBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  govtBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.emerald.light,
  },
  subtext: {
    fontSize: 10,
    color: colors.text.muted,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 3,
  },
  langText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.muted,
  },
  langTextActive: {
    color: colors.gold.badge,
    fontWeight: '800',
  },
  langDivider: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.emerald.primary,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 16,
  },
  callText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.white,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dotBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.gold.badge,
  },
});
