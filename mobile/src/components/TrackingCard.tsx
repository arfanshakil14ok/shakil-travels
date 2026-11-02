import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Animated
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { MOCK_TRACKING_DATABASE } from '../data/mockData';
import { VisaTrackingResult } from '../types';
import { ApiService } from '../services/api';

export const TrackingCard: React.FC = () => {
  const [passportInput, setPassportInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisaTrackingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleTrack = async (passportNum?: string) => {
    const query = (passportNum || passportInput).trim().toUpperCase();
    if (!query) {
      setErrorMessage('অনুগ্রহ করে পাসপোর্ট নম্বর অথবা রেফারেন্স দিন');
      setResult(null);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const data = await ApiService.trackApplication(query);
      setLoading(false);
      if (data) {
        setResult(data);
      } else {
        const fallback = MOCK_TRACKING_DATABASE[query];
        if (fallback) {
          setResult(fallback);
        } else {
          setResult(null);
          setErrorMessage(`"${query}" নম্বরে কোনো সক্রিয় রেকর্ড পাওয়া যায়নি। সঠিক নম্বর দিয়ে চেষ্টা করুন।`);
        }
      }
    } catch {
      setLoading(false);
      const fallback = MOCK_TRACKING_DATABASE[query];
      if (fallback) {
        setResult(fallback);
      } else {
        setResult(null);
        setErrorMessage(`"${query}" নম্বরে কোনো সক্রিয় রেকর্ড পাওয়া যায়নি। সঠিক নম্বর দিয়ে চেষ্টা করুন।`);
      }
    }
  };

  const handleQuickDemo = (passport: string) => {
    setPassportInput(passport);
    handleTrack(passport);
  };

  const clearResult = () => {
    setResult(null);
    setPassportInput('');
    setErrorMessage('');
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <MaterialCommunityIcons name="file-document-check" size={20} color={colors.emerald.primary} />
          <Text style={styles.cardTitle}>ভিসা ও আবেদন ট্র্যাকিং</Text>
        </View>
        <Text style={styles.liveBadge}>LIVE STATUS</Text>
      </View>
      <Text style={styles.cardSubtitle}>
        আপনার পাসপোর্ট নম্বর দিয়ে রিয়েল-টাইম প্রসেসিং স্ট্যাটাস যাচাই করুন
      </Text>

      {/* Input Row */}
      <View style={styles.searchRow}>
        <View style={styles.inputContainer}>
          <Ionicons name="search" size={18} color={colors.text.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="পাসপোর্ট নম্বর (যেমন: A12345678)"
            placeholderTextColor={colors.text.muted}
            value={passportInput}
            onChangeText={(txt) => {
              setPassportInput(txt);
              if (errorMessage) setErrorMessage('');
            }}
            autoCapitalize="characters"
          />
          {passportInput.length > 0 && (
            <TouchableOpacity onPress={() => setPassportInput('')} style={styles.clearInputBtn}>
              <Ionicons name="close-circle" size={16} color={colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={styles.trackButton} 
          onPress={() => handleTrack()}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.text.white} />
          ) : (
            <Text style={styles.trackButtonText}>যাচাই</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Demo Quick Chips */}
      {!result && (
        <View style={styles.demoRow}>
          <Text style={styles.demoLabel}>ডেমো ট্র্যাকিং:</Text>
          <TouchableOpacity 
            style={[styles.demoChip, { borderColor: colors.emerald.primary, backgroundColor: '#ECFDF5' }]} 
            onPress={() => handleQuickDemo('A04589211')}
          >
            <Text style={[styles.demoChipText, { color: colors.emerald.dark, fontWeight: '700' }]}>
              🟢 A04589211 (লাইভ ERP)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.demoChip} 
            onPress={() => handleQuickDemo('A12345678')}
          >
            <Text style={styles.demoChipText}>🇸🇦 A12345678</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Error Message */}
      {errorMessage ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={colors.status.error} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Tracking Result View */}
      {result && (
        <View style={styles.resultContainer}>
          <View style={styles.divider} />
          
          {/* Candidate Info Top Header */}
          <View style={styles.candidateBanner}>
            <View style={styles.candidateDetails}>
              <View style={styles.candidateNameRow}>
                <Text style={styles.candidateName}>{result.candidateName}</Text>
                <Text style={styles.countryFlag}>{result.flag}</Text>
              </View>
              <Text style={styles.jobTitleText}>{result.jobTitle} • {result.country}</Text>
              <Text style={styles.refText}>Ref: {result.agencyRef} | Passport: {result.passportNumber}</Text>
            </View>

            <TouchableOpacity style={styles.closeCardBtn} onPress={clearResult}>
              <Ionicons name="close" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Current Status Highlight Card */}
          <View style={styles.currentStatusBadge}>
            <View style={styles.statusPulseDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusLabelTitle}>বর্তমান পর্যায়:</Text>
              <Text style={styles.statusLabelText}>{result.statusLabel}</Text>
            </View>
            <Text style={styles.statusTimeText}>{result.updatedAt.split(',')[0]}</Text>
          </View>

          {/* Step Timeline */}
          <View style={styles.timelineContainer}>
            {result.steps.map((step, idx) => {
              const isLast = idx === result.steps.length - 1;
              return (
                <View key={idx} style={styles.stepItem}>
                  {/* Step Left Node */}
                  <View style={styles.nodeColumn}>
                    <View 
                      style={[
                        styles.circleNode,
                        step.completed && styles.circleCompleted,
                        step.current && styles.circleCurrent,
                      ]}
                    >
                      {step.completed ? (
                        <Ionicons name="checkmark" size={14} color={colors.text.white} />
                      ) : (
                        <Text style={styles.stepNumber}>{idx + 1}</Text>
                      )}
                    </View>
                    {!isLast && (
                      <View 
                        style={[
                          styles.verticalLine,
                          step.completed && styles.lineCompleted,
                        ]} 
                      />
                    )}
                  </View>

                  {/* Step Right Content */}
                  <View style={styles.stepContent}>
                    <View style={styles.stepHeader}>
                      <Text style={[styles.stepTitle, step.current && styles.stepTitleCurrent]}>
                        {step.titleBn}
                      </Text>
                      {step.date && (
                        <Text style={styles.stepDate}>{step.date}</Text>
                      )}
                    </View>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.background.card,
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: -12,
    padding: 16,
    shadowColor: '#102B50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  liveBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.emerald.primary,
    backgroundColor: colors.emerald.subtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 12,
    lineHeight: 16,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    borderRadius: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: colors.text.primary,
    paddingVertical: 10,
    fontWeight: '600',
  },
  clearInputBtn: {
    padding: 4,
  },
  trackButton: {
    backgroundColor: colors.navy.primary,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  trackButtonText: {
    color: colors.text.white,
    fontSize: 13,
    fontWeight: '700',
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  demoLabel: {
    fontSize: 11,
    color: colors.text.muted,
  },
  demoChip: {
    backgroundColor: colors.navy.subtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  demoChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.navy.primary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  errorText: {
    fontSize: 12,
    color: colors.status.error,
    flex: 1,
  },
  resultContainer: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: 10,
  },
  candidateBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background.page,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.emerald.primary,
  },
  candidateDetails: {
    flex: 1,
  },
  candidateNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  candidateName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  countryFlag: {
    fontSize: 16,
  },
  jobTitleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navy.primary,
    marginTop: 2,
  },
  refText: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
  },
  closeCardBtn: {
    padding: 4,
    alignSelf: 'flex-start',
  },
  currentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.emerald.subtle,
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 8,
  },
  statusPulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.emerald.primary,
  },
  statusLabelTitle: {
    fontSize: 10,
    color: colors.emerald.dark,
    fontWeight: '600',
  },
  statusLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.emerald.dark,
  },
  statusTimeText: {
    fontSize: 10,
    color: colors.emerald.dark,
  },
  timelineContainer: {
    marginTop: 14,
    paddingLeft: 4,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  nodeColumn: {
    alignItems: 'center',
    width: 24,
    marginRight: 10,
  },
  circleNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompleted: {
    backgroundColor: colors.emerald.primary,
  },
  circleCurrent: {
    backgroundColor: colors.navy.primary,
    borderWidth: 2,
    borderColor: colors.gold.badge,
  },
  stepNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.muted,
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border.light,
    marginVertical: 2,
  },
  lineCompleted: {
    backgroundColor: colors.emerald.primary,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 14,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
  },
  stepTitleCurrent: {
    color: colors.navy.primary,
  },
  stepDate: {
    fontSize: 10,
    color: colors.emerald.dark,
    fontWeight: '600',
  },
  stepDesc: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
