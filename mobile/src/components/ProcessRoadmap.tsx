import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { RECRUITMENT_STAGES_SUMMARY } from '../data/mockData';

export const ProcessRoadmap: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="shield-check" size={20} color={colors.emerald.primary} />
        <Text style={styles.title}>নিরাপদ অভিবাসন ও স্বচ্ছ প্রসেস</Text>
      </View>
      <Text style={styles.subtitle}>
        সরকারি নীতিমালা ও বিএমইটি (BMET) অনুমোদিত ধাপে ধাপে ভিসা কার্যক্রম
      </Text>

      <View style={styles.stepsList}>
        {RECRUITMENT_STAGES_SUMMARY.map((st, i) => (
          <View key={i} style={styles.stepCard}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNum}>{st.step}</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>{st.title}</Text>
              <Text style={styles.stepDesc}>{st.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: colors.background.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 3,
    marginBottom: 14,
    lineHeight: 16,
  },
  stepsList: {
    gap: 10,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.page,
    borderRadius: 12,
    padding: 10,
    gap: 12,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.navy.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    color: colors.gold.badge,
    fontSize: 12,
    fontWeight: '800',
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  stepDesc: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 1,
  },
});
