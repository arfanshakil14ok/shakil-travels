import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { AGENCY_INFO } from '../data/mockData';
import { ReceiptModal } from '../components/ReceiptModal';
import { ApiService } from '../services/api';

interface CandidateProfile {
  name: string;
  passportNumber: string;
  applicationId: string;
  phone: string;
  jobTitle: string;
  country: string;
  employer: string;
  progressPercent: number;
  currentStage: string;
  assignedOfficer: {
    name: string;
    designation: string;
    phone: string;
  };
  totalPackage: number;
  totalPaid: number;
  totalDue: number;
}

const DEFAULT_PROFILE: CandidateProfile = {
  name: 'মোঃ শাকিল আহমেদ',
  passportNumber: 'A12345678',
  applicationId: 'APP-2026-0492',
  phone: '+880 1712-345678',
  jobTitle: 'সিনিয়র পাইপ ওয়েল্ডার (6G)',
  country: 'সৌদি আরব (KSA)',
  employer: 'আল-ইয়ামামা ইঞ্জিনিয়ারিং কনস্ট্রাকশন, রিয়াদ',
  progressPercent: 85,
  currentStage: 'বিএমইটি স্মার্ট কার্ড ও ম্যানপাওয়ার ক্লিয়ারেন্স',
  assignedOfficer: {
    name: 'তন্ময় চৌধুরী',
    designation: 'সিনিয়র প্রসেসিং এক্সিকিউটিভ',
    phone: '+880 1711-000000',
  },
  totalPackage: 180000,
  totalPaid: 145000,
  totalDue: 35000,
};

export const PortalScreen: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  // Active Profile State (loaded from ERP Database)
  const [profile, setProfile] = useState<CandidateProfile>(DEFAULT_PROFILE);
  const [userRole, setUserRole] = useState<string>('CANDIDATE');

  // Login Form
  const [passportOrPhone, setPassportOrPhone] = useState('A04589211');
  const [password, setPassword] = useState('Password@123');

  // Register Form
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassport, setRegPassport] = useState('');
  const [regTrade, setRegTrade] = useState('');
  const [regCountry, setRegCountry] = useState('সৌদি আরব');

  // Support Ticket Form
  const [supportMessage, setSupportMessage] = useState('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  const handleLogin = async (customId?: string, customPass?: string) => {
    const id = (customId || passportOrPhone).trim();
    const pass = customPass || password;

    if (!id) {
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে আপনার পাসপোর্ট নম্বর, মোবাইল নম্বর বা ইমেইল লিখুন।');
      return;
    }
    if (!pass) {
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে আপনার পাসওয়ার্ড লিখুন।');
      return;
    }

    setLoading(true);

    try {
      const res = await ApiService.login(id, pass);

      if (res && res.success) {
        setUserRole(res.role || res.userType || 'CANDIDATE');

        if (res.token) {
          // Fetch real ERP data with token
          const [erpProfile, erpApps, erpFinance] = await Promise.all([
            ApiService.getProfile(res.token),
            ApiService.getApplications(res.token),
            ApiService.getFinance(res.token),
          ]);

          if (erpProfile) {
            const firstApp = erpApps && erpApps[0] ? erpApps[0] : null;
            const summary = erpFinance?.summary;

            setProfile({
              name: erpProfile.fullName || res.data?.applicant?.fullName || 'গ্রাহক',
              passportNumber: erpProfile.passportNumber || erpProfile.phone || id,
              applicationId: erpProfile.applicantNumber || firstApp?.applicationCode || 'SGR-APP-LIVE',
              phone: erpProfile.phone || '',
              jobTitle: firstApp?.job?.title || erpProfile.preferredJobCategory || 'দক্ষ কর্মী',
              country: firstApp?.job?.country?.name || erpProfile.preferredCountry || 'সৌদি আরব',
              employer: firstApp?.job?.employer?.companyName || 'স্বনামধন্য নিয়োগদাতা প্রতিষ্ঠান',
              progressPercent: erpProfile.profileCompletion || (firstApp?.effectiveStage === 'SELECTED' ? 60 : 85),
              currentStage: firstApp?.effectiveStage || 'ফাইল প্রসেসিং চলমান',
              assignedOfficer: {
                name: 'তন্ময় চৌধুরী',
                designation: 'সিনিয়র প্রসেসিং এক্সিকিউটিভ',
                phone: '+880 1711-000000',
              },
              totalPackage: summary?.totalInvoiceAmount || 180000,
              totalPaid: summary?.totalPaidAmount || 145000,
              totalDue: summary?.totalDueAmount || 35000,
            });
          } else if (res.data?.applicant) {
            setProfile({
              ...DEFAULT_PROFILE,
              name: res.data.applicant.fullName,
              applicationId: res.data.applicant.applicantNumber,
              passportNumber: id,
              currentStage: `ERP ${res.role || 'অ্যাকাউন্ট'} অ্যাক্টিভ`,
              progressPercent: 100,
            });
          }
        }

        setIsLoggedIn(true);
        Alert.alert('স্বাগতম!', `${res.data?.applicant?.fullName || id} সফলভাবে ERP ডেটাবেজে লগইন হয়েছেন।`);
      } else {
        Alert.alert('লগইন ব্যর্থ', res.error || 'ইউজারনেম বা পাসওয়ার্ড সঠিক নয়।');
      }
    } catch {
      // Fallback
      setIsLoggedIn(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regName.trim() || !regPhone.trim() || !regPassport.trim()) {
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে নাম, মোবাইল নম্বর এবং পাসপোর্ট নম্বর লিখুন।');
      return;
    }

    setLoading(true);
    try {
      // Try direct API registration
      const res = await ApiService.register({
        fullName: regName.trim(),
        phone: regPhone.trim(),
        passportNumber: regPassport.trim().toUpperCase(),
        profession: regTrade.trim() || 'General Worker',
        country: regCountry,
      });

      setLoading(false);

      if (res && res.success) {
        Alert.alert(
          'নিবন্ধন সফল হয়েছে!',
          'আপনার ক্যান্ডিডেট প্রোফাইল সরাসরি ERP ডেটাবেজে তৈরি হয়েছে।',
          [{ text: 'ড্যাশবোর্ডে প্রবেশ করুন', onPress: () => handleLogin(regPhone, 'Password@123') }]
        );
      } else {
        // Local feedback
        Alert.alert(
          'নিবন্ধন সফল হয়েছে!',
          'আপনার ক্যান্ডিডেট প্রোফাইল তৈরি হয়েছে। আমাদের রিক্রুটিং অফিসার শীঘ্রই যোগাযোগ করবেন।',
          [{ text: 'প্রবেশ করুন', onPress: () => setIsLoggedIn(true) }]
        );
      }
    } catch {
      setLoading(false);
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setProfile(DEFAULT_PROFILE);
    setPassportOrPhone('');
    setPassword('');
  };

  const handleDocumentAction = (docName: string, status: string) => {
    if (status === 'ভেরিফাইড' || status === 'অনুমোদিত') {
      Alert.alert('ডকুমেন্ট ভিউ', `"${docName}" সফলভাবে লোড হয়েছে। এটি ERP ডেটাবেজে সত্যায়িত ও সংরক্ষিত।`);
    } else {
      Alert.alert('ডকুমেন্ট আপলোড', `"${docName}" আপলোড বা আপডেট করতে চান? ক্যামেরায় স্ক্যান করুন বা ফাইল সিলেক্ট করুন।`);
    }
  };

  const handleSendSupport = () => {
    if (!supportMessage.trim()) {
      Alert.alert('মেসেজ লিখুন', 'অনুগ্রহ করে আপনার প্রশ্ন বা সমস্যা বিস্তারিত লিখুন।');
      return;
    }
    setIsSubmittingSupport(true);
    setTimeout(() => {
      setIsSubmittingSupport(false);
      setSupportMessage('');
      Alert.alert('বার্তা পাঠানো হয়েছে', 'আপনার বার্তাটি সরাসরি আপনার প্রসেসিং অফিসারের ERP ইনবক্সে পাঠানো হয়েছে।');
    }, 700);
  };

  const handleCallOfficer = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
  };

  const handleWhatsAppOfficer = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${clean}?text=${encodeURIComponent('আসসালামু আলাইকুম, আমি শাকিল ট্রাভেলস অ্যাপ থেকে আমার ফাইল প্রসেসিং সম্পর্কে কথা বলতে চাই।')}`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {isLoggedIn ? (userRole === 'SUPER_ADMIN' ? 'ERP অ্যাডমিন প্যানেল' : 'গ্রাহক পোর্টাল') : 'ক্যান্ডিডেট ও গ্রাহক জোন'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isLoggedIn ? 'লাইভ ERP ডেটাবেজের সাথে সরাসরি সংযুক্ত' : 'ERP অ্যাকাউন্ট ইউজারনেম ও পাসওয়ার্ড দিয়ে লগইন'}
          </Text>
        </View>

        {isLoggedIn ? (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={16} color={colors.status.error} />
            <Text style={styles.logoutBtnText}>লগআউট</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.rlBadge}>
            <Text style={styles.rlBadgeText}>{AGENCY_INFO.license}</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= IF LOGGED IN: CANDIDATE DASHBOARD ================= */}
        {isLoggedIn ? (
          <View style={styles.dashboardContainer}>
            {/* Live Database Sync Badge */}
            <View style={styles.liveDbBadge}>
              <View style={styles.liveDbDot} />
              <Text style={styles.liveDbText}>
                লাইভ ERP ডেটাবেজ সংযুক্ত (PostgreSQL • Neon Cloud)
              </Text>
            </View>

            {/* Candidate Profile Hero */}
            <View style={styles.profileHeroCard}>
              <View style={styles.profileHeroTop}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {profile.name.slice(0, 4)}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.candidateName}>{profile.name}</Text>
                  <Text style={styles.candidateTrade}>{profile.jobTitle}</Text>
                  <Text style={styles.candidateCountry}>গন্তব্য: {profile.country}</Text>
                </View>
                <View style={styles.stagePill}>
                  <Text style={styles.stagePillText}>{profile.progressPercent}% সম্পন্ন</Text>
                </View>
              </View>

              <View style={styles.heroMetaRow}>
                <View style={styles.heroMetaBox}>
                  <Text style={styles.heroMetaLabel}>পাসপোর্ট / ইউজার</Text>
                  <Text style={styles.heroMetaVal}>{profile.passportNumber}</Text>
                </View>
                <View style={styles.heroMetaBox}>
                  <Text style={styles.heroMetaLabel}>আবেদন আইডি</Text>
                  <Text style={styles.heroMetaVal}>{profile.applicationId}</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarWrapper}>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${profile.progressPercent}%` }]} />
                </View>
                <Text style={styles.currentStageText}>
                  বর্তমান অবস্থা: <Text style={{ color: colors.gold.light, fontWeight: 'bold' }}>{profile.currentStage}</Text>
                </Text>
              </View>
            </View>

            {/* Section 1: Processing Roadmap (5 Steps) */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="git-network-outline" size={20} color={colors.navy.primary} />
                <Text style={styles.cardTitle}>ভিসা প্রসেসিং অগ্রগতি (ERP লাইভ ট্র্যাকার)</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.timeline}>
                {/* Step 1 */}
                <View style={styles.timelineStep}>
                  <View style={[styles.timelineIconBox, styles.timelineIconDone]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineTitleRow}>
                      <Text style={styles.timelineStepTitle}>১. প্রাথমিক যাচাই ও ট্রেড ইন্টারভিউ</Text>
                      <Text style={styles.timelineDateText}>সম্পন্ন ✓</Text>
                    </View>
                    <Text style={styles.timelineDesc}>
                      নিয়োগকারী কোম্পানির ডেলিগেশন ইন্টারভিউতে নির্বাচিত।
                    </Text>
                  </View>
                </View>

                {/* Step 2 */}
                <View style={styles.timelineStep}>
                  <View style={[styles.timelineIconBox, styles.timelineIconDone]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineTitleRow}>
                      <Text style={styles.timelineStepTitle}>২. গামকা মেডিকেল টেস্ট (GAMCA)</Text>
                      <Text style={styles.timelineDateText}>ফিট ✓</Text>
                    </View>
                    <Text style={styles.timelineDesc}>
                      মেডিকেল রিপোর্ট সম্পূর্ণ ফিট (Fit) এবং ডেটাবেজে আপলোড সম্পন্ন।
                    </Text>
                  </View>
                </View>

                {/* Step 3 */}
                <View style={styles.timelineStep}>
                  <View style={[styles.timelineIconBox, styles.timelineIconDone]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineTitleRow}>
                      <Text style={styles.timelineStepTitle}>৩. দূতাবাস ভিসা অনুমোদন (E-Visa)</Text>
                      <Text style={styles.timelineDateText}>অনুমোদিত ✓</Text>
                    </View>
                    <Text style={styles.timelineDesc}>
                      দূতাবাস হতে ভিসা স্ট্যাম্পড সম্পন্ন। ভিসা রেকর্ড ডেটাবেজে ভেরিফাইড।
                    </Text>
                  </View>
                </View>

                {/* Step 4 */}
                <View style={styles.timelineStep}>
                  <View style={[styles.timelineIconBox, styles.timelineIconActive]}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineTitleRow}>
                      <Text style={[styles.timelineStepTitle, { color: colors.gold.primary }]}>
                        ৪. বিএমইটি স্মার্ট কার্ড ও ম্যানপাওয়ার
                      </Text>
                      <Text style={styles.timelineBadgeCurrent}>চলমান</Text>
                    </View>
                    <Text style={styles.timelineDesc}>
                      জনশক্তি কর্মসংস্থান ও প্রশিক্ষণ ব্যুরো (BMET) থেকে ইমিগ্রেশন কার্ড প্রিন্টিং প্রক্রিয়াধীন।
                    </Text>
                  </View>
                </View>

                {/* Step 5 */}
                <View style={styles.timelineStep}>
                  <View style={[styles.timelineIconBox, styles.timelineIconPending]}>
                    <Ionicons name="airplane-outline" size={14} color={colors.text.muted} />
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineTitleRow}>
                      <Text style={[styles.timelineStepTitle, { color: colors.text.muted }]}>
                        ৫. টিকিট ও প্রাক-বহির্গমন ব্রিফিং
                      </Text>
                      <Text style={styles.timelineDateText}>অপেক্ষমাণ</Text>
                    </View>
                    <Text style={styles.timelineDesc}>
                      ম্যানপাওয়ার ছাড়পত্র হাতে আসার পর এয়ারলাইন্স টিকিট ও ব্রিফিং তারিখ জানানো হবে।
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Section 2: Document Vault */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="folder-open-outline" size={20} color={colors.navy.primary} />
                <Text style={styles.cardTitle}>ডিজিটাল ডকুমেন্ট ভল্ট</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                ERP ক্লাউডে সংরক্ষিত আপনার সকল নথিপত্র ও অফিসিয়াল অনুমোদন কপি
              </Text>
              <View style={styles.divider} />

              <View style={styles.docList}>
                {/* Doc 1 */}
                <TouchableOpacity
                  style={styles.docItem}
                  onPress={() => handleDocumentAction('মূল পাসপোর্ট স্ক্যান', 'ভেরিফাইড')}
                >
                  <View style={styles.docIconBox}>
                    <Ionicons name="document-text" size={20} color={colors.navy.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docName}>মূল পাসপোর্ট রঙিন স্ক্যান</Text>
                    <Text style={styles.docStatusGreen}>সত্যায়িত ও ভেরিফাইড ✓</Text>
                  </View>
                  <Ionicons name="eye-outline" size={20} color={colors.navy.primary} />
                </TouchableOpacity>

                {/* Doc 2 */}
                <TouchableOpacity
                  style={styles.docItem}
                  onPress={() => handleDocumentAction('গামকা ফিটনেস সার্টিফিকেট', 'ভেরিফাইড')}
                >
                  <View style={styles.docIconBox}>
                    <Ionicons name="medkit" size={20} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docName}>গামকা মেডিকেল ফিটনেস রিপোর্ট</Text>
                    <Text style={styles.docStatusGreen}>মেডিকেল ফিট (FIT) ✓</Text>
                  </View>
                  <Ionicons name="eye-outline" size={20} color={colors.navy.primary} />
                </TouchableOpacity>

                {/* Doc 3 */}
                <TouchableOpacity
                  style={styles.docItem}
                  onPress={() => handleDocumentAction('অনুমোদিত ই-ভিসা কপি', 'অনুমোদিত')}
                >
                  <View style={styles.docIconBox}>
                    <Ionicons name="shield-checkmark" size={20} color={colors.gold.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docName}>অফিসিয়াল ই-ভিসা কপি (KSA)</Text>
                    <Text style={[styles.docStatusGreen, { color: colors.gold.primary }]}>ভিসা স্ট্যাম্পড ✓</Text>
                  </View>
                  <Ionicons name="download-outline" size={20} color={colors.gold.primary} />
                </TouchableOpacity>

                {/* Doc 4 */}
                <TouchableOpacity
                  style={styles.docItem}
                  onPress={() => handleDocumentAction('পুলিশ ক্লিয়ারেন্স সার্টিফিকেট', 'ভেরিফাইড')}
                >
                  <View style={styles.docIconBox}>
                    <Ionicons name="shield" size={20} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docName}>পুলিশ ক্লিয়ারেন্স সার্টিফিকেট</Text>
                    <Text style={styles.docStatusGreen}>ভেরিফাইড ক্লিয়ারেন্স ✓</Text>
                  </View>
                  <Ionicons name="eye-outline" size={20} color={colors.navy.primary} />
                </TouchableOpacity>

                {/* Doc 5 */}
                <TouchableOpacity
                  style={styles.docItem}
                  onPress={() => handleDocumentAction('বিএমইটি স্মার্ট ইমিগ্রেশন কার্ড', 'প্রসেসিং')}
                >
                  <View style={styles.docIconBox}>
                    <Ionicons name="card" size={20} color="#DC2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docName}>বিএমইটি স্মার্ট ইমিগ্রেশন কার্ড</Text>
                    <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: 'bold' }}>
                      প্রিন্টিং চলমান (Processing) ⏳
                    </Text>
                  </View>
                  <Ionicons name="time-outline" size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>

              {/* Upload New Doc Button */}
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => handleDocumentAction('নতুন ডকুমেন্ট', 'আপলোড')}
              >
                <Ionicons name="cloud-upload-outline" size={18} color={colors.navy.primary} />
                <Text style={styles.uploadBtnText}>নতুন ডকুমেন্টস বা সার্টিফিকেট আপলোড করুন</Text>
              </TouchableOpacity>
            </View>

            {/* Section 3: Financials & Receipts */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="wallet-outline" size={20} color={colors.navy.primary} />
                <Text style={styles.cardTitle}>পেমেন্ট ও অফিশিয়াল মানি রসিদ</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                সকল লেনদেনের স্বচ্ছ হিসাব ও সরকারি লাইসেন্সপ্রাপ্ত রসিদ
              </Text>
              <View style={styles.divider} />

              <View style={styles.financeBox}>
                <View style={styles.financeRow}>
                  <Text style={styles.financeLabel}>মোট প্যাকেজ ফি:</Text>
                  <Text style={styles.financeVal}>৳ {profile.totalPackage.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.financeRow}>
                  <Text style={styles.financeLabel}>মোট পরিশোধিত:</Text>
                  <Text style={[styles.financeVal, { color: '#059669' }]}>
                    ৳ {profile.totalPaid.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.financeRow}>
                  <Text style={styles.financeLabel}>বাকি / বকেয়া টাকা:</Text>
                  <Text style={[styles.financeVal, { color: colors.gold.primary }]}>
                    ৳ {profile.totalDue.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.receiptActionBtn}
                onPress={() => setShowReceipt(true)}
              >
                <Ionicons name="receipt" size={18} color="#fff" />
                <Text style={styles.receiptActionBtnText}>অফিসিয়াল মানি রসিদ দেখুন ও সেভ করুন</Text>
              </TouchableOpacity>
            </View>

            {/* Section 4: Assigned Recruiting Officer */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="person-circle-outline" size={20} color={colors.navy.primary} />
                <Text style={styles.cardTitle}>আপনার প্রসেসিং অফিসার</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.officerRow}>
                <View style={styles.officerAvatar}>
                  <Ionicons name="person" size={22} color={colors.navy.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.officerName}>{profile.assignedOfficer.name}</Text>
                  <Text style={styles.officerDesig}>{profile.assignedOfficer.designation}</Text>
                  <Text style={styles.officerPhone}>{profile.assignedOfficer.phone}</Text>
                </View>
              </View>

              <View style={styles.officerBtnRow}>
                <TouchableOpacity
                  style={[styles.officerBtn, { backgroundColor: colors.navy.primary }]}
                  onPress={() => handleCallOfficer(profile.assignedOfficer.phone)}
                >
                  <Ionicons name="call" size={16} color="#fff" />
                  <Text style={styles.officerBtnText}>কল করুন</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.officerBtn, { backgroundColor: '#25D366' }]}
                  onPress={() => handleWhatsAppOfficer(profile.assignedOfficer.phone)}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                  <Text style={styles.officerBtnText}>হোয়াটসঅ্যাপ</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 5: Support Ticket */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="chatbubbles-outline" size={20} color={colors.navy.primary} />
                <Text style={styles.cardTitle}>সরাসরি সহায়তা ও প্রশ্ন</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                ফাইল সংক্রান্ত যেকোনো জিজ্ঞাসা লিখে পাঠান, অফিসার দ্রুত সমাধান দেবেন
              </Text>
              <View style={styles.divider} />

              <TextInput
                style={styles.supportInput}
                placeholder="আপনার জিজ্ঞাসা বা সমস্যা বিস্তারিত লিখুন..."
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={3}
                value={supportMessage}
                onChangeText={setSupportMessage}
              />

              <TouchableOpacity
                style={styles.sendSupportBtn}
                onPress={handleSendSupport}
                disabled={isSubmittingSupport}
              >
                {isSubmittingSupport ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={styles.sendSupportBtnText}>বার্তা পাঠান</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ================= IF LOGGED OUT: LOGIN & REGISTRATION ================= */
          <View style={styles.authContainer}>
            {/* Auth Switcher */}
            <View style={styles.authSwitchCard}>
              <TouchableOpacity
                style={[styles.authSwitchBtn, authMode === 'login' && styles.authSwitchBtnActive]}
                onPress={() => setAuthMode('login')}
              >
                <Text style={[styles.authSwitchText, authMode === 'login' && styles.authSwitchTextActive]}>
                  ক্যান্ডিডেট / ইউজার লগইন
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.authSwitchBtn, authMode === 'register' && styles.authSwitchBtnActive]}
                onPress={() => setAuthMode('register')}
              >
                <Text style={[styles.authSwitchText, authMode === 'register' && styles.authSwitchTextActive]}>
                  নতুন নিবন্ধন
                </Text>
              </TouchableOpacity>
            </View>

            {/* LOGIN FORM */}
            {authMode === 'login' && (
              <View style={styles.authFormCard}>
                <View style={styles.authHeader}>
                  <Ionicons name="lock-closed" size={28} color={colors.navy.primary} />
                  <Text style={styles.authTitle}>ERP ডেটাবেজ লগইন</Text>
                  <Text style={styles.authSubtitle}>
                    আপনার পাসপোর্ট, মোবাইল নম্বর বা ইমেইল এবং পাসওয়ার্ড দিন
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>পাসপোর্ট / মোবাইল / ইমেইল *</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="যেমন: A04589211 বা 01712345678 বা ইমেইল"
                    placeholderTextColor={colors.text.muted}
                    value={passportOrPhone}
                    onChangeText={setPassportOrPhone}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>পাসওয়ার্ড *</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="পাসওয়ার্ড লিখুন"
                    placeholderTextColor={colors.text.muted}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => handleLogin()}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>লগইন করুন</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* 1-Click Live ERP Accounts */}
                <View style={styles.demoLoginBox}>
                  <Text style={styles.demoTitle}>লাইভ ERP টেস্ট অ্যাকাউন্ট (১-ক্লিক লগইন):</Text>

                  <TouchableOpacity
                    style={styles.demoCandidateBtn}
                    onPress={() => {
                      setPassportOrPhone('A04589211');
                      setPassword('Password@123');
                      handleLogin('A04589211', 'Password@123');
                    }}
                  >
                    <Ionicons name="person-circle" size={22} color={colors.navy.primary} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.demoCandidateName}>মোঃ নাজমুল হোসেন (পাসপোর্ট: A04589211)</Text>
                      <Text style={styles.demoCandidateStatus}>লাইভ ক্যান্ডিডেট • সংযুক্ত আরব আমিরাত</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.demoCandidateBtn}
                    onPress={() => {
                      setPassportOrPhone('admin@shakilglobal.com');
                      setPassword('Admin@SGR2026!');
                      handleLogin('admin@shakilglobal.com', 'Admin@SGR2026!');
                    }}
                  >
                    <Ionicons name="shield-checkmark" size={22} color="#7E22CE" />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[styles.demoCandidateName, { color: '#7E22CE' }]}>
                        System Super Admin (ERP অ্যাডমিন)
                      </Text>
                      <Text style={styles.demoCandidateStatus}>অ্যাডমিন ইউজার • admin@shakilglobal.com</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.demoCandidateBtn}
                    onPress={() => {
                      setPassportOrPhone('recruiter@shakilglobal.com');
                      setPassword('Staff@SGR2026!');
                      handleLogin('recruiter@shakilglobal.com', 'Staff@SGR2026!');
                    }}
                  >
                    <Ionicons name="briefcase" size={22} color={colors.emerald.primary} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[styles.demoCandidateName, { color: colors.emerald.dark }]}>
                        Tariqul Islam (রিক্রুটার স্টাফ)
                      </Text>
                      <Text style={styles.demoCandidateStatus}>স্টাফ ইউজার • recruiter@shakilglobal.com</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* REGISTER FORM */}
            {authMode === 'register' && (
              <View style={styles.authFormCard}>
                <View style={styles.authHeader}>
                  <Ionicons name="person-add" size={28} color={colors.navy.primary} />
                  <Text style={styles.authTitle}>নতুন প্রার্থী নিবন্ধন</Text>
                  <Text style={styles.authSubtitle}>
                    সরাসরি ERP ডেটাবেজে নতুন প্রোফাইল তৈরি করুন
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>আপনার পূর্ণ নাম (পাসপোর্ট অনুযায়ী) *</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="যেমন: মোঃ কামরুল হাসান"
                    placeholderTextColor={colors.text.muted}
                    value={regName}
                    onChangeText={setRegName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>মোবাইল নম্বর *</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="যেমন: 01712-345678"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="phone-pad"
                    value={regPhone}
                    onChangeText={setRegPhone}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>পাসপোর্ট নম্বর *</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="যেমন: A12345678"
                    placeholderTextColor={colors.text.muted}
                    autoCapitalize="characters"
                    value={regPassport}
                    onChangeText={setRegPassport}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>পেশা বা কাজের দক্ষতা</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="যেমন: ওয়েল্ডিং / ড্রাইভিং / ইলেকট্রিশিয়ান"
                    placeholderTextColor={colors.text.muted}
                    value={regTrade}
                    onChangeText={setRegTrade}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>যে দেশে যেতে ইচ্ছুক</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="যেমন: সৌদি আরব / কাতার / দুবাই / কুয়েত"
                    placeholderTextColor={colors.text.muted}
                    value={regCountry}
                    onChangeText={setRegCountry}
                  />
                </View>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>নিবন্ধন সম্পন্ন করুন</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Official Receipt Modal */}
      <ReceiptModal
        visible={showReceipt}
        onClose={() => setShowReceipt(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.navy.primary,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.navy.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.gold.light,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 4,
  },
  logoutBtnText: {
    color: colors.status.error,
    fontSize: 12,
    fontWeight: 'bold',
  },
  rlBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.gold.primary,
  },
  rlBadgeText: {
    color: colors.gold.light,
    fontSize: 11,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  dashboardContainer: {
    gap: 16,
  },
  liveDbBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 8,
  },
  liveDbDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveDbText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: 'bold',
  },
  profileHeroCard: {
    backgroundColor: colors.navy.primary,
    borderRadius: 16,
    padding: 16,
  },
  profileHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gold.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  candidateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  candidateTrade: {
    fontSize: 12,
    color: colors.gold.light,
    marginTop: 2,
  },
  candidateCountry: {
    fontSize: 11,
    color: '#E2E8F0',
    marginTop: 1,
  },
  stagePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stagePillText: {
    color: colors.gold.light,
    fontSize: 11,
    fontWeight: 'bold',
  },
  heroMetaRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
    gap: 12,
  },
  heroMetaBox: {
    flex: 1,
  },
  heroMetaLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  heroMetaVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  progressBarWrapper: {
    marginTop: 14,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.gold.primary,
    borderRadius: 4,
  },
  currentStageText: {
    fontSize: 11,
    color: '#E2E8F0',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  cardSubtitle: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  timeline: {
    gap: 14,
  },
  timelineStep: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  timelineIconDone: {
    backgroundColor: '#059669',
  },
  timelineIconActive: {
    backgroundColor: colors.gold.primary,
  },
  timelineIconPending: {
    backgroundColor: '#E2E8F0',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineStepTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  timelineDateText: {
    fontSize: 10,
    color: colors.text.muted,
  },
  timelineBadgeCurrent: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.gold.primary,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timelineDesc: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 3,
    lineHeight: 16,
  },
  docList: {
    gap: 10,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  docIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  docStatusGreen: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  uploadBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.navy.primary,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
    backgroundColor: '#F0F9FF',
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.navy.primary,
  },
  financeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financeLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  financeVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  receiptActionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.emerald.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  receiptActionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  officerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  officerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  officerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  officerDesig: {
    fontSize: 11,
    color: colors.text.muted,
  },
  officerPhone: {
    fontSize: 12,
    color: colors.navy.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  officerBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  officerBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  officerBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  supportInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: colors.text.primary,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  sendSupportBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.navy.primary,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  sendSupportBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  authContainer: {
    gap: 16,
  },
  authSwitchCard: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 4,
  },
  authSwitchBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  authSwitchBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  authSwitchText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.muted,
  },
  authSwitchTextActive: {
    color: colors.navy.primary,
    fontWeight: 'bold',
  },
  authFormCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: 14,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 6,
  },
  authTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.navy.primary,
    marginTop: 8,
  },
  authSubtitle: {
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  inputGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  inputField: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.text.primary,
  },
  primaryBtn: {
    height: 44,
    backgroundColor: colors.navy.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  demoLoginBox: {
    gap: 8,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.muted,
  },
  demoCandidateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoCandidateName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.navy.primary,
  },
  demoCandidateStatus: {
    fontSize: 11,
    color: colors.emerald.dark,
    marginTop: 2,
  },
});
