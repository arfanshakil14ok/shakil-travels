import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { JobCircular } from '../types';

interface ApplicationFormModalProps {
  job: JobCircular | null;
  visible: boolean;
  onClose: () => void;
  onSubmittedSuccess?: (appCode: string) => void;
}

export const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({
  job,
  visible,
  onClose,
  onSubmittedSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [passport, setPassport] = useState('');
  const [experience, setExperience] = useState('২-৩ বছর');
  const [district, setDistrict] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!job) return null;

  const handleSubmit = () => {
    if (!fullName.trim() || !phone.trim()) {
      setErrorMsg('অনুগ্রহ করে নাম এবং মোবাইল নম্বর প্রদান করুন');
      return;
    }

    if (phone.trim().length < 11) {
      setErrorMsg('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    // Simulate API submission
    setTimeout(() => {
      setSubmitting(false);
      const generatedCode = `ST-APP-${Math.floor(1000 + Math.random() * 9000)}`;
      setSuccessCode(generatedCode);
      onSubmittedSuccess?.(generatedCode);
    }, 800);
  };

  const handleResetAndClose = () => {
    setFullName('');
    setPhone('');
    setPassport('');
    setDistrict('');
    setSuccessCode(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleResetAndClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>চাকরির সরাসরি আবেদন</Text>
              <Text style={styles.headerSubtitle}>
                {job.titleBn || job.title} ({job.country})
              </Text>
            </View>
            <TouchableOpacity onPress={handleResetAndClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {successCode ? (
            /* Success confirmation view */
            <View style={styles.successContainer}>
              <View style={styles.successBadge}>
                <Ionicons name="checkmark-done" size={36} color={colors.emerald.primary} />
              </View>
              <Text style={styles.successTitle}>আবেদন সফলভাবে গৃহীত হয়েছে!</Text>
              <Text style={styles.successDesc}>
                আপনার আবেদনটি শাকিল ট্রাভেলসের রিক্রুটমেন্ট ডাটাবেজে যুক্ত করা হয়েছে।
              </Text>

              <View style={styles.appCodeBox}>
                <Text style={styles.appCodeLabel}>আপনার আবেদন রেফারেন্স কোড:</Text>
                <Text style={styles.appCodeValue}>{successCode}</Text>
              </View>

              <Text style={styles.nextStepNotice}>
                আমাদের সংশ্লিষ্ট প্রসেসিং অফিসার আগামী ২৪ ঘণ্টার মধ্যে আপনার মোবাইল নম্বরে ({phone}) যোগাযোগ করে ইন্টারভিউ ও কাগজপত্রের সময়সূচি জানাবেন।
              </Text>

              <TouchableOpacity style={styles.submitBtn} onPress={handleResetAndClose}>
                <Text style={styles.submitBtnText}>ঠিক আছে, ধন্যবাদ</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Form view */
            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              {/* Job preview mini bar */}
              <View style={styles.jobMiniBar}>
                <Text style={styles.flagEmoji}>{job.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.miniBarTitle}>{job.companyName}</Text>
                  <Text style={styles.miniBarSub}>মাসিক বেতন: {job.salary} {job.currency}</Text>
                </View>
              </View>

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={colors.status.error} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <View style={styles.formGroup}>
                <Text style={styles.label}>প্রার্থীর পূর্ণ নাম: *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                  placeholderTextColor={colors.text.muted}
                  value={fullName}
                  onChangeText={(txt) => {
                    setFullName(txt);
                    if (errorMsg) setErrorMsg('');
                  }}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>মোবাইল নম্বর (হোয়াটসঅ্যাপ থাকলে ভালো): *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="০১৭xxxxxxxx"
                  placeholderTextColor={colors.text.muted}
                  value={phone}
                  onChangeText={(txt) => {
                    setPhone(txt);
                    if (errorMsg) setErrorMsg('');
                  }}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>পাসপোর্ট নম্বর (যদি থাকে):</Text>
                <TextInput
                  style={styles.input}
                  placeholder="যেমন: A12345678"
                  placeholderTextColor={colors.text.muted}
                  value={passport}
                  onChangeText={setPassport}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>কাজের অভিজ্ঞতা:</Text>
                <View style={styles.expChipsRow}>
                  {['১-২ বছর', '২-৩ বছর', '৩-৫ বছর', '৫+ বছর (বিদেশে)'].map((e) => (
                    <TouchableOpacity
                      key={e}
                      style={[styles.expChip, experience === e && styles.expChipActive]}
                      onPress={() => setExperience(e)}
                    >
                      <Text style={[styles.expChipText, experience === e && styles.expChipTextActive]}>
                        {e}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>স্থায়ী জেলা / বর্তমান এলাকা:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="যেমন: কুমিল্লা, ঢাকা, সিলেট..."
                  placeholderTextColor={colors.text.muted}
                  value={district}
                  onChangeText={setDistrict}
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.text.white} />
                ) : (
                  <Text style={styles.submitBtnText}>আবেদনপত্র জমা দিন</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.navy.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  formScroll: {
    marginTop: 12,
  },
  jobMiniBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.background.page,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  flagEmoji: {
    fontSize: 20,
  },
  miniBarTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
  },
  miniBarSub: {
    fontSize: 11,
    color: colors.emerald.primary,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 11,
    color: colors.status.error,
    flex: 1,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 5,
  },
  input: {
    backgroundColor: colors.background.page,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  expChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  expChip: {
    backgroundColor: colors.background.page,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  expChipActive: {
    backgroundColor: colors.navy.primary,
    borderColor: colors.navy.primary,
  },
  expChipText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  expChipTextActive: {
    color: colors.text.white,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: colors.emerald.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.white,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 10,
  },
  successBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.emerald.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  appCodeBox: {
    backgroundColor: colors.navy.subtle,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.navy.primary,
  },
  appCodeLabel: {
    fontSize: 11,
    color: colors.navy.primary,
    fontWeight: '600',
  },
  appCodeValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy.primary,
    letterSpacing: 1,
    marginTop: 2,
  },
  nextStepNotice: {
    fontSize: 11,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 18,
  },
});
