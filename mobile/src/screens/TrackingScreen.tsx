import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { MOCK_TRACKING_DATABASE, AGENCY_INFO } from '../data/mockData';
import { VisaTrackingResult } from '../types';
import { ApiService } from '../services/api';

export const TrackingScreen: React.FC = () => {
  const [passportQuery, setPassportQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisaTrackingResult | null>(
    MOCK_TRACKING_DATABASE['A12345678'] // Default load a demo result for instant showcase!
  );
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async (queryOverride?: string) => {
    const q = (queryOverride || passportQuery).trim().toUpperCase();
    if (!q) {
      setErrorMsg('অনুগ্রহ করে পাসপোর্ট নম্বর প্রবেশ করান');
      setResult(null);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const data = await ApiService.trackApplication(q);
      setLoading(false);
      if (data) {
        setResult(data);
      } else {
        setResult(null);
        setErrorMsg(`"${q}" নম্বরের কোনো ভিসা ফাইল পাওয়া যায়নি। নম্বরটি পুনরায় মিলিয়ে দেখুন।`);
      }
    } catch {
      setLoading(false);
      setResult(null);
      setErrorMsg('সার্ভারে যোগাযোগ করতে সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।');
    }
  };

  const handleDemoSelect = (p: string) => {
    setPassportQuery(p);
    handleSearch(p);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>ভিসা ও ফাইল ট্র্যাকিং</Text>
          <Text style={styles.headerSubtitle}>
            বিএমইটি ও দূতাবাস অনুমোদিত রিয়েল-টাইম তথ্য
          </Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Input Card */}
        <View style={styles.searchCard}>
          <Text style={styles.searchPrompt}>পাসপোর্ট বা ফাইল নম্বর দিন:</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="যেমন: A12345678 বা B98765432"
              placeholderTextColor={colors.text.muted}
              value={passportQuery}
              onChangeText={(txt) => {
                setPassportQuery(txt);
                if (errorMsg) setErrorMsg('');
              }}
              autoCapitalize="characters"
            />
            <TouchableOpacity 
              style={styles.searchActionBtn}
              onPress={() => handleSearch()}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.text.white} />
              ) : (
                <Text style={styles.searchBtnText}>অনুসন্ধান</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Demo Chips */}
          <View style={styles.quickChipsRow}>
            <Text style={styles.quickChipsLabel}>নমুনা টেস্ট করুন:</Text>
            <TouchableOpacity 
              style={styles.chipButton} 
              onPress={() => handleDemoSelect('A12345678')}
            >
              <Text style={styles.chipText}>🇸🇦 A12345678 (স্মার্ট কার্ড)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.chipButton} 
              onPress={() => handleDemoSelect('B98765432')}
            >
              <Text style={styles.chipText}>🇦🇪 B98765432 (ভিসা)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.chipButton} 
              onPress={() => handleDemoSelect('E55443322')}
            >
              <Text style={styles.chipText}>🇲🇾 E55443322 (ফ্লাইট)</Text>
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={colors.status.error} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}
        </View>

        {/* Tracking Details View */}
        {result && (
          <View style={styles.trackingResultCard}>
            {/* Header info */}
            <View style={styles.candidateHeader}>
              <View style={styles.avatarBadge}>
                <Ionicons name="person" size={24} color={colors.navy.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.candidateName}>{result.candidateName}</Text>
                  <Text style={styles.countryFlagText}>{result.flag}</Text>
                </View>
                <Text style={styles.jobText}>{result.jobTitle} • {result.country}</Text>
                <Text style={styles.metaText}>
                  পাসপোর্ট: {result.passportNumber} | ট্র্যাকিং আইডি: {result.agencyRef}
                </Text>
              </View>
            </View>

            {/* Status Highlight Banner */}
            <View style={styles.statusHighlightBox}>
              <View style={styles.pulseIndicator} />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusSub}>বর্তমান পর্যায়:</Text>
                <Text style={styles.statusMain}>{result.statusLabel}</Text>
              </View>
              <Text style={styles.updatedAtText}>{result.updatedAt}</Text>
            </View>

            {/* Step-by-step progress */}
            <Text style={styles.processHeading}>ভিসা প্রসেসিং পর্যায়সমূহ:</Text>
            <View style={styles.stepsTimeline}>
              {result.steps.map((s, idx) => {
                const isLast = idx === result.steps.length - 1;
                return (
                  <View key={idx} style={styles.stepRow}>
                    <View style={styles.nodeColumn}>
                      <View 
                        style={[
                          styles.nodeCircle,
                          s.completed && styles.nodeCircleDone,
                          s.current && styles.nodeCircleCurrent,
                        ]}
                      >
                        {s.completed ? (
                          <Ionicons name="checkmark-sharp" size={14} color={colors.text.white} />
                        ) : (
                          <Text style={styles.nodeIndex}>{idx + 1}</Text>
                        )}
                      </View>
                      {!isLast && (
                        <View 
                          style={[
                            styles.nodeStem,
                            s.completed && styles.nodeStemDone,
                          ]} 
                        />
                      )}
                    </View>

                    <View style={styles.stepInfoContainer}>
                      <View style={styles.stepInfoTitleRow}>
                        <Text style={[styles.stepTitle, s.current && styles.stepTitleActive]}>
                          {s.titleBn}
                        </Text>
                        {s.date && <Text style={styles.stepDateBadge}>{s.date}</Text>}
                      </View>
                      <Text style={styles.stepDescText}>{s.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Official BMET Notice */}
            <View style={styles.bmetNotice}>
              <MaterialCommunityIcons name="shield-check" size={20} color={colors.emerald.primary} />
              <Text style={styles.bmetNoticeText}>
                শাকিল ট্রাভেলস (RL-{AGENCY_INFO.license.replace('RL-', '')}) একটি সরকার অনুমোদিত রিক্রুটিং এজেন্সি। কোনো প্রকার মধ্যস্বত্বভোগী বা দালালের খপ্পরে পড়বেন না।
              </Text>
            </View>

            {/* Support hotline */}
            <TouchableOpacity 
              style={styles.officerHelpBtn}
              onPress={() => Linking.openURL(`tel:${AGENCY_INFO.hotline}`)}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={16} color={colors.text.white} />
              <Text style={styles.officerHelpText}>সংশ্লিষ্ট প্রসেসিং অফিসারের সাথে কথা বলুন</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 10,
    backgroundColor: colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
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
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.emerald.subtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.emerald.primary,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.emerald.dark,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
    gap: 14,
  },
  searchCard: {
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
  searchPrompt: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background.page,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text.primary,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  searchActionBtn: {
    backgroundColor: colors.navy.primary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  searchBtnText: {
    color: colors.text.white,
    fontSize: 13,
    fontWeight: '700',
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  quickChipsLabel: {
    fontSize: 10,
    color: colors.text.muted,
  },
  chipButton: {
    backgroundColor: colors.navy.subtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.navy.primary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  errorText: {
    fontSize: 12,
    color: colors.status.error,
    flex: 1,
  },
  trackingResultCard: {
    backgroundColor: colors.background.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: '#102B50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  candidateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingBottom: 12,
  },
  avatarBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.navy.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  candidateName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
  },
  countryFlagText: {
    fontSize: 16,
  },
  jobText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.emerald.primary,
    marginTop: 1,
  },
  metaText: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
  },
  statusHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.emerald.subtle,
    padding: 12,
    borderRadius: 12,
    marginVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  pulseIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.emerald.primary,
  },
  statusSub: {
    fontSize: 10,
    color: colors.emerald.dark,
    fontWeight: '600',
  },
  statusMain: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.emerald.dark,
  },
  updatedAtText: {
    fontSize: 9,
    color: colors.emerald.dark,
  },
  processHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 10,
  },
  stepsTimeline: {
    paddingLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
  },
  nodeColumn: {
    alignItems: 'center',
    width: 24,
    marginRight: 10,
  },
  nodeCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCircleDone: {
    backgroundColor: colors.emerald.primary,
  },
  nodeCircleCurrent: {
    backgroundColor: colors.navy.primary,
    borderWidth: 2,
    borderColor: colors.gold.badge,
  },
  nodeIndex: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.muted,
  },
  nodeStem: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border.light,
    marginVertical: 2,
  },
  nodeStemDone: {
    backgroundColor: colors.emerald.primary,
  },
  stepInfoContainer: {
    flex: 1,
    paddingBottom: 14,
  },
  stepInfoTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
  },
  stepTitleActive: {
    color: colors.navy.primary,
  },
  stepDateBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.emerald.dark,
  },
  stepDescText: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  bmetNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background.page,
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  bmetNoticeText: {
    fontSize: 11,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 16,
  },
  officerHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.navy.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  officerHelpText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.white,
  },
});
