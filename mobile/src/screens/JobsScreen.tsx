import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Linking,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { ALL_JOBS, JOB_CATEGORIES, POPULAR_DESTINATIONS, AGENCY_INFO } from '../data/mockData';
import { JobCircular } from '../types';
import { ApplicationFormModal } from '../components/ApplicationFormModal';
import { ApiService } from '../services/api';

export const JobsScreen: React.FC = () => {
  const [jobs, setJobs] = useState<JobCircular[]>(ALL_JOBS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [activeJobDetails, setActiveJobDetails] = useState<JobCircular | null>(null);
  const [applyingJob, setApplyingJob] = useState<JobCircular | null>(null);

  useEffect(() => {
    let isMounted = true;
    ApiService.getJobs().then((fetched) => {
      if (isMounted && fetched && fetched.length > 0) {
        setJobs(fetched);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter logic
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.titleBn && job.titleBn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.country.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || job.category === selectedCategory;

    const matchesCountry =
      !selectedCountryCode || job.countryCode === selectedCountryCode;

    return matchesSearch && matchesCategory && matchesCountry;
  });

  const handleApply = (job: JobCircular) => {
    setApplyingJob(job);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>সকল নিয়োগ সার্কুলার</Text>
          <Text style={styles.headerSubtitle}>
            সরকারি অনুমোদিত ও সক্রিয় বৈদেশিক ডিমান্ডসমূহ
          </Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>{jobs.length} টি ডিমান্ড</Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.text.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="পদবী, দেশ বা কোম্পানি খুঁজুন..."
          placeholderTextColor={colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={16} color={colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills */}
      <View style={styles.categoriesSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {JOB_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Country Filter Chips */}
      <View style={styles.countryRow}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.countryScroll}
        >
          <TouchableOpacity
            style={[styles.countryChip, !selectedCountryCode && styles.countryChipActive]}
            onPress={() => setSelectedCountryCode(null)}
          >
            <Text style={[styles.countryChipText, !selectedCountryCode && styles.countryChipTextActive]}>
              সব দেশ ({ALL_JOBS.length})
            </Text>
          </TouchableOpacity>
          {POPULAR_DESTINATIONS.map((c) => {
            const isSelected = selectedCountryCode === c.code;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.countryChip, isSelected && styles.countryChipActive]}
                onPress={() => setSelectedCountryCode(isSelected ? null : c.code)}
              >
                <Text style={styles.countryFlagEmoji}>{c.flag}</Text>
                <Text style={[styles.countryChipText, isSelected && styles.countryChipTextActive]}>
                  {c.nameBn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Jobs List */}
      <ScrollView
        style={styles.jobsList}
        contentContainerStyle={styles.jobsListContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultSummaryRow}>
          <Text style={styles.resultSummaryText}>
            মোট পাওয়া গেছে: <Text style={styles.resultCountBold}>{filteredJobs.length}</Text> টি সার্কুলার
          </Text>
          {(searchQuery || selectedCategory !== 'all' || selectedCountryCode) && (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedCountryCode(null);
              }}
            >
              <Text style={styles.resetFilterText}>রিসেট ফিল্টার</Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredJobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="briefcase-search" size={48} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>কোনো সার্কুলার পাওয়া যায়নি</Text>
            <Text style={styles.emptyDesc}>অন্য কি-ওয়ার্ড বা দেশ নির্বাচন করে আবার চেষ্টা করুন।</Text>
          </View>
        ) : (
          filteredJobs.map((job) => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.countryTag}>
                  <Text style={styles.flagIcon}>{job.flag}</Text>
                  <Text style={styles.countryTagText}>{job.country}</Text>
                </View>
                <View style={styles.deadlineBadge}>
                  <Ionicons name="time-outline" size={12} color={colors.gold.primary} />
                  <Text style={styles.deadlineBadgeText}>{job.deadline}</Text>
                </View>
              </View>

              <Text style={styles.jobTitleBn}>{job.titleBn || job.title}</Text>
              <Text style={styles.jobTitleEn}>{job.title}</Text>
              
              <Text style={styles.companyName}>
                <MaterialCommunityIcons name="domain" size={13} color={colors.text.muted} /> {job.companyName}
              </Text>

              <View style={styles.salaryAndVacancies}>
                <View style={styles.salaryBox}>
                  <Text style={styles.salaryLabel}>মাসিক বেতন</Text>
                  <Text style={styles.salaryValue}>
                    {job.salary} <Text style={styles.currency}>{job.currency}</Text>
                  </Text>
                </View>
                <View style={styles.vacancyBox}>
                  <Text style={styles.vacancyLabel}>খালি পদ</Text>
                  <Text style={styles.vacancyValue}>{job.vacancies} জন</Text>
                </View>
              </View>

              <View style={styles.tagsContainer}>
                {job.tags.map((tag, idx) => (
                  <View key={idx} style={styles.tagPill}>
                    <Text style={styles.tagPillText}>✓ {tag}</Text>
                  </View>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.detailsBtn}
                  onPress={() => setActiveJobDetails(job)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="information-circle-outline" size={16} color={colors.navy.primary} />
                  <Text style={styles.detailsBtnText}>বিস্তারিত</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={() => handleApply(job)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={14} color={colors.text.white} />
                  <Text style={styles.applyBtnText}>আবেদন করুন</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Job Details Modal */}
      {activeJobDetails && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setActiveJobDetails(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.modalCountryBadge}>
                    <Text style={{ fontSize: 16 }}>{activeJobDetails.flag}</Text>
                    <Text style={styles.modalCountryText}>{activeJobDetails.country}</Text>
                  </View>
                  <Text style={styles.modalJobTitle}>{activeJobDetails.titleBn || activeJobDetails.title}</Text>
                  <Text style={styles.modalCompany}>{activeJobDetails.companyName}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setActiveJobDetails(null)}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.detailGrid}>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>মাসিক মূল বেতন</Text>
                    <Text style={styles.gridValue}>{activeJobDetails.salary} {activeJobDetails.currency}</Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>মোট খালি পদ</Text>
                    <Text style={styles.gridValue}>{activeJobDetails.vacancies} জন</Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>আবেদনের শেষ তারিখ</Text>
                    <Text style={styles.gridValue}>{activeJobDetails.deadline}</Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>ক্যাটাগরি</Text>
                    <Text style={styles.gridValue}>{activeJobDetails.category.toUpperCase()}</Text>
                  </View>
                </View>

                <Text style={styles.sectionHeaderInModal}>কোম্পানি প্রদত্ত সুবিধাসমূহ:</Text>
                <View style={styles.benefitList}>
                  <Text style={styles.benefitItem}>✓ থাকা এবং যাতায়াত কোম্পানি বহন করবে</Text>
                  <Text style={styles.benefitItem}>✓ কর্মকালীন স্বাস্থ্যবীমা ও চিকিৎসা সুবিধা</Text>
                  <Text style={styles.benefitItem}>✓ ওভারটাইম কাজের অতিরিক্ত পারিশ্রমিক</Text>
                  <Text style={styles.benefitItem}>✓ চুক্তি শেষে এয়ার টিকিট ও বোনাস</Text>
                </View>

                <Text style={styles.sectionHeaderInModal}>প্রয়োজনীয় কাগজপত্র:</Text>
                <View style={styles.benefitList}>
                  <Text style={styles.benefitItem}>• মূল পাসপোর্ট (ন্যূনতম ২ বছর মেয়াদ)</Text>
                  <Text style={styles.benefitItem}>• সাদা ব্যাকগ্রাউন্ড ছবি (৪ কপি)</Text>
                  <Text style={styles.benefitItem}>• সংশ্লিষ্ট কাজের অভিজ্ঞতা সনদ বা লাইসেন্স</Text>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.modalCallButton}
                  onPress={() => {
                    const job = activeJobDetails;
                    setActiveJobDetails(null);
                    handleApply(job);
                  }}
                >
                  <Ionicons name="call" size={16} color={colors.text.white} />
                  <Text style={styles.modalCallText}>অফিসে যোগাযোগ ও আবেদন</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      {/* Application Form Modal */}
      <ApplicationFormModal
        job={applyingJob}
        visible={!!applyingJob}
        onClose={() => setApplyingJob(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.background.card,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  totalBadge: {
    backgroundColor: colors.emerald.subtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.emerald.dark,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text.primary,
  },
  clearBtn: {
    padding: 4,
  },
  categoriesSection: {
    marginTop: 10,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    backgroundColor: colors.background.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  categoryPillActive: {
    backgroundColor: colors.navy.primary,
    borderColor: colors.navy.primary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  categoryTextActive: {
    color: colors.text.white,
    fontWeight: '700',
  },
  countryRow: {
    marginTop: 8,
  },
  countryScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  countryChipActive: {
    backgroundColor: colors.navy.subtle,
    borderColor: colors.navy.primary,
  },
  countryFlagEmoji: {
    fontSize: 13,
  },
  countryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.primary,
  },
  countryChipTextActive: {
    color: colors.navy.primary,
    fontWeight: '700',
  },
  jobsList: {
    flex: 1,
    marginTop: 8,
  },
  jobsListContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  resultSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  resultSummaryText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  resultCountBold: {
    fontWeight: '800',
    color: colors.navy.primary,
  },
  resetFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.emerald.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 10,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 4,
  },
  jobCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: '#102B50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  countryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.navy.subtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  flagIcon: {
    fontSize: 12,
  },
  countryTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navy.primary,
  },
  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold.light,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  deadlineBadgeText: {
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
  salaryAndVacancies: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background.page,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  salaryBox: {
    flex: 1,
  },
  salaryLabel: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  salaryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.emerald.primary,
    marginTop: 1,
  },
  currency: {
    fontSize: 11,
    fontWeight: '700',
  },
  vacancyBox: {
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagPill: {
    backgroundColor: colors.emerald.subtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.emerald.dark,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: 10,
  },
  detailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.navy.subtle,
    paddingVertical: 8,
    borderRadius: 10,
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy.primary,
  },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.navy.primary,
    paddingVertical: 8,
    borderRadius: 10,
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingBottom: 14,
  },
  modalCountryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  modalCountryText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy.primary,
  },
  modalJobTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text.primary,
  },
  modalCompany: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    marginTop: 14,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: colors.background.page,
    padding: 12,
    borderRadius: 12,
  },
  gridItem: {
    width: '46%',
  },
  gridLabel: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 2,
  },
  sectionHeaderInModal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  benefitList: {
    gap: 6,
  },
  benefitItem: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  modalFooter: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: 12,
  },
  modalCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.emerald.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalCallText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.white,
  },
});
