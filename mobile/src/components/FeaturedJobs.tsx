import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { JobCircular } from '../types';
import { AGENCY_INFO } from '../data/mockData';

interface FeaturedJobsProps {
  jobs: JobCircular[];
  onJobPress?: (job: JobCircular) => void;
}

export const FeaturedJobs: React.FC<FeaturedJobsProps> = ({ jobs, onJobPress }) => {
  const handleApply = (job: JobCircular) => {
    Alert.alert(
      'আবেদন ও অনুসন্ধান',
      `পদবী: ${job.titleBn || job.title}\nদেশ: ${job.country}\nকোম্পানি: ${job.companyName}\nবেতন: ${job.salary} ${job.currency}\n\nসরাসরি অফিসে যোগাযোগ বা হটলাইনে কল করুন।`,
      [
        { text: 'বাতিল', style: 'cancel' },
        { 
          text: 'কল করুন', 
          style: 'default',
          onPress: () => Linking.openURL(`tel:${AGENCY_INFO.hotline}`)
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>চলতি রিক্রুটমেন্ট সার্কুলার</Text>
          <Text style={styles.sectionSubtitle}>বাছাইকৃত ও যাচাইকৃত চাকরির সুযোগসমূহ</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{jobs.length} টি ডিমান্ড</Text>
        </View>
      </View>

      <View style={styles.listContainer}>
        {jobs.map((job) => (
          <TouchableOpacity 
            key={job.id} 
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => onJobPress?.(job)}
          >
            {/* Top row: Flag + Country + Deadline */}
            <View style={styles.cardTopRow}>
              <View style={styles.countryBadge}>
                <Text style={styles.flagEmoji}>{job.flag}</Text>
                <Text style={styles.countryNameText}>{job.country}</Text>
              </View>

              <View style={styles.deadlineBadge}>
                <Ionicons name="time-outline" size={12} color={colors.gold.primary} />
                <Text style={styles.deadlineText}>{job.deadline}</Text>
              </View>
            </View>

            {/* Job Title & Company */}
            <Text style={styles.jobTitleBn}>{job.titleBn}</Text>
            <Text style={styles.jobTitleEn}>{job.title}</Text>
            <Text style={styles.companyName}>
              <MaterialCommunityIcons name="domain" size={12} color={colors.text.muted} /> {job.companyName}
            </Text>

            {/* Salary & Vacancy Info */}
            <View style={styles.infoRow}>
              <View style={styles.salaryContainer}>
                <Text style={styles.salaryLabel}>মাসিক আনুমানিক বেতন:</Text>
                <Text style={styles.salaryValue}>{job.salary} <Text style={styles.currencyText}>{job.currency}</Text></Text>
              </View>

              <View style={styles.vacancyContainer}>
                <Text style={styles.vacancyLabel}>পদসংখ্যা:</Text>
                <Text style={styles.vacancyValue}>{job.vacancies} জন</Text>
              </View>
            </View>

            {/* Tags Row */}
            <View style={styles.tagsRow}>
              {job.tags.map((tag, i) => (
                <View key={i} style={styles.tagBadge}>
                  <Text style={styles.tagText}>✓ {tag}</Text>
                </View>
              ))}
            </View>

            {/* Card Footer Button */}
            <View style={styles.cardFooter}>
              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={() => handleApply(job)}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.text.white} />
                <Text style={styles.applyButtonText}>বিস্তারিত ও আবেদন</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: colors.emerald.subtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.emerald.dark,
  },
  listContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: '#102B50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.navy.subtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  flagEmoji: {
    fontSize: 14,
  },
  countryNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navy.primary,
  },
  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold.light,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  deadlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gold.primary,
  },
  jobTitleBn: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
  },
  jobTitleEn: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
    marginTop: 1,
  },
  companyName: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.page,
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  salaryContainer: {
    flex: 1,
  },
  salaryLabel: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  salaryValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.emerald.primary,
    marginTop: 1,
  },
  currencyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  vacancyContainer: {
    alignItems: 'flex-end',
  },
  vacancyLabel: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  vacancyValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  tagText: {
    fontSize: 10,
    color: colors.emerald.dark,
    fontWeight: '600',
  },
  cardFooter: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: 10,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.navy.primary,
    paddingVertical: 9,
    borderRadius: 10,
  },
  applyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.white,
  },
});
