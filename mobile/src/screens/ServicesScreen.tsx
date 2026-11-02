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

type ServiceSection = 'invoice' | 'certificate' | 'scam' | 'training' | 'contact';

interface VerifiedInvoice {
  invoiceNumber: string;
  candidateName: string;
  passportNumber: string;
  jobTitle: string;
  country: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  date: string;
  paymentMethod: string;
  status: 'PAID' | 'PARTIAL' | 'PENDING';
  issuedBy: string;
}

const SAMPLE_INVOICES: Record<string, VerifiedInvoice> = {
  'INV-2026-8812': {
    invoiceNumber: 'INV-2026-8812',
    candidateName: 'মোঃ শাকিল আহমেদ',
    passportNumber: 'A12345678',
    jobTitle: 'সিনিয়র পাইপ ওয়েল্ডার (6G)',
    country: 'সৌদি আরব (KSA)',
    amount: 180000,
    paidAmount: 145000,
    dueAmount: 35000,
    date: '২৮ জানুয়ারি, ২০২৬',
    paymentMethod: 'ব্যাংক ডিপোজিট (ইসলামী ব্যাংক)',
    status: 'PARTIAL',
    issuedBy: 'শামীম ট্রাভেলস ফিন্যান্স সেল',
  },
  'INV-2026-7490': {
    invoiceNumber: 'INV-2026-7490',
    candidateName: 'করিম উল্লাহ',
    passportNumber: 'B98765432',
    jobTitle: 'হেভি ট্রেলার ড্রাইভার',
    country: 'সংযুক্ত আরব আমিরাত (দুবাই)',
    amount: 220000,
    paidAmount: 220000,
    dueAmount: 0,
    date: '১৫ জানুয়ারি, ২০২৬',
    paymentMethod: 'অফিস ক্যাশ কাউন্টার',
    status: 'PAID',
    issuedBy: 'শামীম ট্রাভেলস ফিন্যান্স সেল',
  },
};

interface VerifiedCertificate {
  certificateId: string;
  studentName: string;
  trade: string;
  institute: string;
  duration: string;
  grade: string;
  issueDate: string;
  bmetRegistered: boolean;
}

const SAMPLE_CERTIFICATES: Record<string, VerifiedCertificate> = {
  'CERT-WELD-2026-901': {
    certificateId: 'CERT-WELD-2026-901',
    studentName: 'মোঃ শাকিল আহমেদ',
    trade: 'পাইপ ও প্রেশার ভেসেল ওয়েল্ডিং (6G TIG/MIG)',
    institute: 'বাংলাদেশ-জার্মান টেকনিক্যাল ট্রেনিং সেন্টার (BGTTC), ঢাকা',
    duration: '৬ মাস (৩৬০ ঘণ্টা)',
    grade: 'A+ (Distinction)',
    issueDate: '১০ জানুয়ারি, ২০২৬',
    bmetRegistered: true,
  },
  'CERT-ELEC-2026-312': {
    certificateId: 'CERT-ELEC-2026-312',
    studentName: 'হাসান মাহমুদ',
    trade: 'ইন্ডাস্ট্রিয়াল ইলেকট্রিক্যাল মেইনটেন্যান্স',
    institute: 'মিরপুর সরকারি টেকনিক্যাল ট্রেনিং সেন্টার',
    duration: '৩ মাস (১৮০ ঘণ্টা)',
    grade: 'A (Very Good)',
    issueDate: '১৮ ডিসেম্বর, ২০২৫',
    bmetRegistered: true,
  },
};

export const ServicesScreen: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ServiceSection>('invoice');

  // Invoice Search
  const [invoiceInput, setInvoiceInput] = useState('INV-2026-8812');
  const [invoiceResult, setInvoiceResult] = useState<VerifiedInvoice | null>(SAMPLE_INVOICES['INV-2026-8812']);
  const [isSearchingInvoice, setIsSearchingInvoice] = useState(false);

  // Certificate Search
  const [certInput, setCertInput] = useState('');
  const [certResult, setCertResult] = useState<VerifiedCertificate | null>(null);
  const [isSearchingCert, setIsSearchingCert] = useState(false);

  const handleVerifyInvoice = () => {
    if (!invoiceInput.trim()) {
      Alert.alert('ইনভয়েস নম্বর দিন', 'অনুগ্রহ করে মানি রসিদ বা ইনভয়েস নম্বর লিখুন।');
      return;
    }
    setIsSearchingInvoice(true);
    setTimeout(() => {
      setIsSearchingInvoice(false);
      const found = SAMPLE_INVOICES[invoiceInput.trim().toUpperCase()];
      if (found) {
        setInvoiceResult(found);
      } else {
        setInvoiceResult(null);
        Alert.alert(
          'তথ্য পাওয়া যায়নি',
          `"${invoiceInput}" নম্বরে কোনো বৈধ রসিদ পাওয়া যায়নি। অনুগ্রহ করে অফিসের মূল মানি রসিদের নম্বরটি সঠিকভাবে লিখুন।`
        );
      }
    }, 500);
  };

  const handleVerifyCert = () => {
    if (!certInput.trim()) {
      Alert.alert('সনদ নম্বর দিন', 'অনুগ্রহ করে সার্টিফিকেট নম্বর লিখুন।');
      return;
    }
    setIsSearchingCert(true);
    setTimeout(() => {
      setIsSearchingCert(false);
      const found = SAMPLE_CERTIFICATES[certInput.trim().toUpperCase()];
      if (found) {
        setCertResult(found);
      } else {
        setCertResult(null);
        Alert.alert('সনদ পাওয়া যায়নি', `"${certInput}" নম্বরে কোনো সনদ তথ্য নেই।`);
      }
    }, 500);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
  };

  const handleWhatsApp = (phone: string) => {
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${cleanNumber}?text=${encodeURIComponent('আসসালামু আলাইকুম, শাকিল ট্রাভেলস সেবা ও তথ্যের ব্যাপারে কথা বলতে চাই।')}`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>সেবা ও তথ্য যাচাই</Text>
          <Text style={styles.headerSubtitle}>
            রসিদ যাচাই, সরকারি নিয়মাবলী ও প্রতারণা সতর্কতা
          </Text>
        </View>
        <View style={styles.licenseBadge}>
          <Text style={styles.licenseBadgeText}>{AGENCY_INFO.license}</Text>
        </View>
      </View>

      {/* Section Tabs */}
      <View style={styles.tabNavWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabNavContainer}>
          <TouchableOpacity
            style={[styles.tabChip, activeSection === 'invoice' && styles.tabChipActive]}
            onPress={() => setActiveSection('invoice')}
          >
            <Ionicons
              name="receipt-outline"
              size={16}
              color={activeSection === 'invoice' ? '#fff' : colors.text.muted}
            />
            <Text style={[styles.tabChipText, activeSection === 'invoice' && styles.tabChipTextActive]}>
              রসিদ যাচাই
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeSection === 'scam' && styles.tabChipActive]}
            onPress={() => setActiveSection('scam')}
          >
            <Ionicons
              name="warning-outline"
              size={16}
              color={activeSection === 'scam' ? '#fff' : colors.text.muted}
            />
            <Text style={[styles.tabChipText, activeSection === 'scam' && styles.tabChipTextActive]}>
              দালাল সতর্কতা
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeSection === 'certificate' && styles.tabChipActive]}
            onPress={() => setActiveSection('certificate')}
          >
            <Ionicons
              name="ribbon-outline"
              size={16}
              color={activeSection === 'certificate' ? '#fff' : colors.text.muted}
            />
            <Text style={[styles.tabChipText, activeSection === 'certificate' && styles.tabChipTextActive]}>
              সনদ যাচাই
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeSection === 'training' && styles.tabChipActive]}
            onPress={() => setActiveSection('training')}
          >
            <Ionicons
              name="school-outline"
              size={16}
              color={activeSection === 'training' ? '#fff' : colors.text.muted}
            />
            <Text style={[styles.tabChipText, activeSection === 'training' && styles.tabChipTextActive]}>
              প্রশিক্ষণ কেন্দ্র
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeSection === 'contact' && styles.tabChipActive]}
            onPress={() => setActiveSection('contact')}
          >
            <Ionicons
              name="call-outline"
              size={16}
              color={activeSection === 'contact' ? '#fff' : colors.text.muted}
            />
            <Text style={[styles.tabChipText, activeSection === 'contact' && styles.tabChipTextActive]}>
              অফিস ও হেল্প
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= SECTION 1: INVOICE VERIFICATION ================= */}
        {activeSection === 'invoice' && (
          <View style={styles.section}>
            {/* Banner */}
            <View style={styles.bannerCard}>
              <View style={styles.bannerHeader}>
                <Ionicons name="shield-checkmark" size={24} color={colors.emerald.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.bannerTitle}>অফিসিয়াল ইনভয়েস ও রসিদ যাচাই</Text>
                  <Text style={styles.bannerDesc}>
                    আপনার যেকোনো পেমেন্ট বা টাকা জমা দেওয়ার পর প্রাপ্ত মানি রসিদের সত্যতা সাথে সাথে যাচাই করুন।
                  </Text>
                </View>
              </View>
            </View>

            {/* Search Input */}
            <View style={styles.searchCard}>
              <Text style={styles.inputLabel}>মানি রসিদ / ইনভয়েস নম্বর লিখুন</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="যেমন: INV-2026-8812"
                  placeholderTextColor={colors.text.muted}
                  value={invoiceInput}
                  onChangeText={setInvoiceInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.searchBtn}
                  onPress={handleVerifyInvoice}
                  disabled={isSearchingInvoice}
                >
                  {isSearchingInvoice ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.searchBtnText}>যাচাই করুন</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Quick Demos */}
              <View style={styles.demoRow}>
                <Text style={styles.demoLabel}>ডেমো ট্রাই করুন:</Text>
                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => {
                    setInvoiceInput('INV-2026-8812');
                    setInvoiceResult(SAMPLE_INVOICES['INV-2026-8812']);
                  }}
                >
                  <Text style={styles.demoChipText}>INV-2026-8812</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => {
                    setInvoiceInput('INV-2026-7490');
                    setInvoiceResult(SAMPLE_INVOICES['INV-2026-7490']);
                  }}
                >
                  <Text style={styles.demoChipText}>INV-2026-7490</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Result Card */}
            {invoiceResult && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    <Text style={styles.verifiedBadgeText}>বৈধ ও আসল মানি রসিদ (VERIFIED)</Text>
                  </View>
                  <Text style={styles.resultInvoiceNo}>{invoiceResult.invoiceNumber}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.dataGrid}>
                  <View style={styles.dataItem}>
                    <Text style={styles.dataItemLabel}>প্রার্থীর নাম</Text>
                    <Text style={styles.dataItemValue}>{invoiceResult.candidateName}</Text>
                  </View>
                  <View style={styles.dataItem}>
                    <Text style={styles.dataItemLabel}>পাসপোর্ট নম্বর</Text>
                    <Text style={styles.dataItemValue}>{invoiceResult.passportNumber}</Text>
                  </View>
                  <View style={styles.dataItem}>
                    <Text style={styles.dataItemLabel}>চাকরির পদবি</Text>
                    <Text style={styles.dataItemValue}>{invoiceResult.jobTitle}</Text>
                  </View>
                  <View style={styles.dataItem}>
                    <Text style={styles.dataItemLabel}>গন্তব্য দেশ</Text>
                    <Text style={styles.dataItemValue}>{invoiceResult.country}</Text>
                  </View>
                </View>

                <View style={styles.amountBox}>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>মোট প্যাকেজ ফি:</Text>
                    <Text style={styles.amountVal}>৳ {invoiceResult.amount.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>মোট পরিশোধিত:</Text>
                    <Text style={[styles.amountVal, { color: '#059669' }]}>
                      ৳ {invoiceResult.paidAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>বর্তমান বকেয়া:</Text>
                    <Text style={[styles.amountVal, { color: invoiceResult.dueAmount > 0 ? '#DC2626' : '#059669' }]}>
                      ৳ {invoiceResult.dueAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>তারিখ: {invoiceResult.date}</Text>
                  <Text style={styles.metaText}>মাধ্যম: {invoiceResult.paymentMethod}</Text>
                </View>

                <View style={styles.agencySealRow}>
                  <Ionicons name="ribbon" size={16} color={colors.navy.primary} />
                  <Text style={styles.agencySealText}>
                    স্বাক্ষরিত: {invoiceResult.issuedBy} (লাইসেন্স নং {AGENCY_INFO.license})
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ================= SECTION 2: SCAM AWARENESS ================= */}
        {activeSection === 'scam' && (
          <View style={styles.section}>
            <View style={[styles.bannerCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <View style={styles.bannerHeader}>
                <Ionicons name="warning" size={24} color="#DC2626" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.bannerTitle, { color: '#991B1B' }]}>
                    দালাল ও ভুয়া ভিসা চক্র হতে সাবধান
                  </Text>
                  <Text style={[styles.bannerDesc, { color: '#7F1D1D' }]}>
                    কোনো মধ্যস্বত্বভোগী বা দালালের ব্যক্তিগত বিকাশ/নগদে টাকা দেবেন না।
                  </Text>
                </View>
              </View>
            </View>

            {/* Red Flags List */}
            <Text style={styles.subSectionTitle}>প্রতারণার ৬টি প্রধান লক্ষণ</Text>

            <View style={styles.flagCard}>
              <View style={styles.flagIconBox}>
                <Ionicons name="close-circle" size={20} color="#DC2626" />
              </View>
              <View style={styles.flagContent}>
                <Text style={styles.flagTitle}>১. শতভাগ নিশ্চিত ভিসার প্রলোভন</Text>
                <Text style={styles.flagDesc}>
                  কোনো এজেন্সি শতভাগ ভিসা নিশ্চয়তা দিতে পারে না। ভিসা কেবল সংশ্লিষ্ট দেশের দূতাবাস ও পররাষ্ট্র মন্ত্রণালয় অনুমোদন করে।
                </Text>
              </View>
            </View>

            <View style={styles.flagCard}>
              <View style={styles.flagIconBox}>
                <Ionicons name="close-circle" size={20} color="#DC2626" />
              </View>
              <View style={styles.flagContent}>
                <Text style={styles.flagTitle}>২. বিনা যোগ্যতায় অবিশ্বাস্য বেতন</Text>
                <Text style={styles.flagDesc}>
                  কোনো কাজ না জেনে বা কোনো ইন্টারভিউ ছাড়া ২-৩ লাখ টাকা বেতনের লোভ দেখানো স্পষ্ট প্রতারণার লক্ষণ।
                </Text>
              </View>
            </View>

            <View style={styles.flagCard}>
              <View style={styles.flagIconBox}>
                <Ionicons name="close-circle" size={20} color="#DC2626" />
              </View>
              <View style={styles.flagContent}>
                <Text style={styles.flagTitle}>৩. ব্যক্তিগত বিকাশ/নগদে টাকা দাবি</Text>
                <Text style={styles.flagDesc}>
                  শামীম ট্রাভেলস কখনো কারও ব্যক্তিগত বিকাশ নম্বরে টাকা নেয় না। সব ফি সরাসরি ব্যাংক বা অফিস ক্যাশ রসিদে দিতে হয়।
                </Text>
              </View>
            </View>

            <View style={styles.flagCard}>
              <View style={styles.flagIconBox}>
                <Ionicons name="close-circle" size={20} color="#DC2626" />
              </View>
              <View style={styles.flagContent}>
                <Text style={styles.flagTitle}>৪. ভিজিট/ট্যুরিস্ট ভিসায় কাজের প্রস্তাব</Text>
                <Text style={styles.flagDesc}>
                  ট্যুরিস্ট ভিসায় গিয়ে কাজে যোগদান সম্পূর্ণ অবৈধ। এর ফলে জেল, জরিমানা ও আজীবনের জন্য দেশ থেকে বহিষ্কার হতে পারেন।
                </Text>
              </View>
            </View>

            <View style={styles.flagCard}>
              <View style={styles.flagIconBox}>
                <Ionicons name="close-circle" size={20} color="#DC2626" />
              </View>
              <View style={styles.flagContent}>
                <Text style={styles.flagTitle}>৫. মূল পাসপোর্ট জিম্মি রাখা</Text>
                <Text style={styles.flagDesc}>
                  অফিসিয়াল মানি রসিদ ছাড়া কারও কাছে মূল পাসপোর্ট জমা দেবেন না। দালালরা পাসপোর্ট জিম্মি করে টাকা দাবি করে।
                </Text>
              </View>
            </View>

            <View style={styles.flagCard}>
              <View style={styles.flagIconBox}>
                <Ionicons name="close-circle" size={20} color="#DC2626" />
              </View>
              <View style={styles.flagContent}>
                <Text style={styles.flagTitle}>৬. ভুয়া অফার লেটার ও সিল</Text>
                <Text style={styles.flagDesc}>
                  কম্পিউটারে নকল দূতাবাস বা কোম্পানির প্যাড তৈরি করে বিভ্রান্ত করা হয়। বিএমইটি ও আমি প্রবাসী অ্যাপে সবসময় যাচাই করুন।
                </Text>
              </View>
            </View>

            {/* Helpline CTA */}
            <View style={styles.helpCard}>
              <Ionicons name="help-buoy" size={24} color={colors.navy.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.helpTitle}>সন্দেহ হলে সরাসরি জানান</Text>
                <Text style={styles.helpDesc}>
                  কোনো ব্যক্তি শামীম ট্রাভেলসের নাম দিয়ে টাকা চাইলে সাথে সাথে আমাদের অফিসিয়াল নম্বরে জানান।
                </Text>
              </View>
              <TouchableOpacity
                style={styles.helpBtn}
                onPress={() => handleCall('+8801711000000')}
              >
                <Text style={styles.helpBtnText}>কল করুন</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= SECTION 3: CERTIFICATE VERIFICATION ================= */}
        {activeSection === 'certificate' && (
          <View style={styles.section}>
            <View style={styles.bannerCard}>
              <View style={styles.bannerHeader}>
                <Ionicons name="ribbon" size={24} color={colors.gold.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.bannerTitle}>কারিগরি দক্ষতা সনদ যাচাই</Text>
                  <Text style={styles.bannerDesc}>
                    বিএমইটি ও সরকারি কারিগরি প্রশিক্ষণ কেন্দ্র হতে প্রাপ্ত সার্টিফিকেটের বৈধতা যাচাই করুন।
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.searchCard}>
              <Text style={styles.inputLabel}>সনদপত্র নম্বর (Certificate ID)</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="যেমন: CERT-WELD-2026-901"
                  placeholderTextColor={colors.text.muted}
                  value={certInput}
                  onChangeText={setCertInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.searchBtn}
                  onPress={handleVerifyCert}
                  disabled={isSearchingCert}
                >
                  {isSearchingCert ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.searchBtnText}>যাচাই</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.demoRow}>
                <Text style={styles.demoLabel}>ডেমো সনদ কোড:</Text>
                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => {
                    setCertInput('CERT-WELD-2026-901');
                    setCertResult(SAMPLE_CERTIFICATES['CERT-WELD-2026-901']);
                  }}
                >
                  <Text style={styles.demoChipText}>ওয়েল্ডিং সনদ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => {
                    setCertInput('CERT-ELEC-2026-312');
                    setCertResult(SAMPLE_CERTIFICATES['CERT-ELEC-2026-312']);
                  }}
                >
                  <Text style={styles.demoChipText}>ইলেকট্রিশিয়ান সনদ</Text>
                </TouchableOpacity>
              </View>
            </View>

            {certResult && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    <Text style={styles.verifiedBadgeText}>অনুমোদিত সরকারি প্রশিক্ষণ সনদ</Text>
                  </View>
                  <Text style={styles.resultInvoiceNo}>{certResult.certificateId}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.dataGrid}>
                  <View style={styles.dataItem}>
                    <Text style={styles.dataItemLabel}>প্রশিক্ষণার্থীর নাম</Text>
                    <Text style={styles.dataItemValue}>{certResult.studentName}</Text>
                  </View>
                  <View style={styles.dataItem}>
                    <Text style={styles.dataItemLabel}>ট্রেড / পেশা</Text>
                    <Text style={styles.dataItemValue}>{certResult.trade}</Text>
                  </View>
                  <View style={[styles.dataItem, { width: '100%' }]}>
                    <Text style={styles.dataItemLabel}>প্রশিক্ষণ কেন্দ্র / ইনস্টিটিউট</Text>
                    <Text style={styles.dataItemValue}>{certResult.institute}</Text>
                  </View>
                  <View style={styles.dataItem}>
                    <Text style={styles.dataItemLabel}>কোর্স মেয়াদ</Text>
                    <Text style={styles.dataItemValue}>{certResult.duration}</Text>
                  </View>
                  <View style={styles.dataItem}>
                    <Text style={styles.dataItemLabel}>ফলাফল / গ্রেড</Text>
                    <Text style={[styles.dataItemValue, { color: '#059669', fontWeight: 'bold' }]}>
                      {certResult.grade}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>ইস্যু তারিখ: {certResult.issueDate}</Text>
                  <Text style={[styles.metaText, { color: '#059669', fontWeight: '600' }]}>
                    বিএমইটি ডেটাবেজ ভেরিফাইড ✓
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ================= SECTION 4: TRAINING CENTERS ================= */}
        {activeSection === 'training' && (
          <View style={styles.section}>
            <View style={styles.bannerCard}>
              <View style={styles.bannerHeader}>
                <Ionicons name="school" size={24} color={colors.navy.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.bannerTitle}>দক্ষতা উন্নয়ন ও কারিগরি প্রশিক্ষণ</Text>
                  <Text style={styles.bannerDesc}>
                    বিদেশে উচ্চ বেতনে চাকরির জন্য কারিগরি ট্রেড প্রশিক্ষণ গ্রহণ করুন।
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.subSectionTitle}>জনপ্রিয় ও চাহিদাসম্পন্ন ট্রেডসমূহ</Text>

            <View style={styles.tradeCard}>
              <View style={styles.tradeIconBox}>
                <MaterialCommunityIcons name="pipe" size={24} color={colors.navy.primary} />
              </View>
              <View style={styles.tradeContent}>
                <Text style={styles.tradeTitle}>পাইপ ও স্ট্রাকচারাল ওয়েল্ডিং (3G/4G/6G)</Text>
                <Text style={styles.tradeDesc}>কোর্স মেয়াদ: ৩-৬ মাস | বেতন: ৫০,০০০ - ৯০,০০০ টাকা</Text>
                <Text style={styles.tradeCenter}>কেন্দ্র: মিরপুর ও বাংলা-জার্মান টিটিসি, ঢাকা</Text>
              </View>
            </View>

            <View style={styles.tradeCard}>
              <View style={styles.tradeIconBox}>
                <Ionicons name="flash-outline" size={24} color={colors.gold.primary} />
              </View>
              <View style={styles.tradeContent}>
                <Text style={styles.tradeTitle}>ইন্ডাস্ট্রিয়াল ইলেকট্রিক্যাল অ্যান্ড ওয়্যারিং</Text>
                <Text style={styles.tradeDesc}>কোর্স মেয়াদ: ৩ মাস | বেতন: ৪৫,০০০ - ৭৫,০০০ টাকা</Text>
                <Text style={styles.tradeCenter}>কেন্দ্র: শেখ ফজিলাতুন্নেছা মুজিব টিটিসি, ঢাকা</Text>
              </View>
            </View>

            <View style={styles.tradeCard}>
              <View style={styles.tradeIconBox}>
                <Ionicons name="car-outline" size={24} color="#059669" />
              </View>
              <View style={styles.tradeContent}>
                <Text style={styles.tradeTitle}>হেভি ভেহিক্যাল ও ট্রেলার ড্রাইভিং</Text>
                <Text style={styles.tradeDesc}>কোর্স মেয়াদ: ২-৩ মাস | বেতন: ৬০,০০০ - ১,০০,০০০ টাকা</Text>
                <Text style={styles.tradeCenter}>কেন্দ্র: বাংলাদেশ ইনস্টিটিউট অফ মেরিন টেকনোলজি</Text>
              </View>
            </View>

            <View style={styles.tradeCard}>
              <View style={styles.tradeIconBox}>
                <Ionicons name="snow-outline" size={24} color="#0284C7" />
              </View>
              <View style={styles.tradeContent}>
                <Text style={styles.tradeTitle}>এইচভ্যাক ও এয়ার কন্ডিশনিং টেকনিশিয়ান</Text>
                <Text style={styles.tradeDesc}>কোর্স মেয়াদ: ৩ মাস | বেতন: ৫০,০০০ - ৮০,০০০ টাকা</Text>
                <Text style={styles.tradeCenter}>কেন্দ্র: সরকারি টিটিসি, চট্টগ্রাম ও রাজশাহী</Text>
              </View>
            </View>
          </View>
        )}

        {/* ================= SECTION 5: CONTACT & OFFICE ================= */}
        {activeSection === 'contact' && (
          <View style={styles.section}>
            <View style={styles.contactCard}>
              <View style={styles.contactHeader}>
                <Ionicons name="business" size={28} color={colors.navy.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.contactTitle}>{AGENCY_INFO.name}</Text>
                  <Text style={styles.contactLicense}>
                    গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত রিক্রুটিং লাইসেন্স নং {AGENCY_INFO.license}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={colors.navy.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.infoLabel}>প্রধান কার্যালয়</Text>
                  <Text style={styles.infoVal}>{AGENCY_INFO.address}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color={colors.navy.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.infoLabel}>অফিস সময়</Text>
                  <Text style={styles.infoVal}>শনিবার - বৃহস্পতিবার: সকাল ৯:০০ - সন্ধ্যা ৬:০০</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color={colors.navy.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.infoLabel}>সার্বক্ষণিক জরুরি হটলাইন</Text>
                  <Text style={styles.infoVal}>{AGENCY_INFO.hotline}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color={colors.navy.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.infoLabel}>ইমেইল</Text>
                  <Text style={styles.infoVal}>{AGENCY_INFO.email}</Text>
                </View>
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.navy.primary }]}
                  onPress={() => handleCall(AGENCY_INFO.hotline)}
                >
                  <Ionicons name="call" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>সরাসরি কল</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
                  onPress={() => handleWhatsApp(AGENCY_INFO.whatsapp)}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>হোয়াটসঅ্যাপ</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Govt Emergency Hotline */}
            <View style={[styles.contactCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
              <View style={styles.contactHeader}>
                <Ionicons name="shield-checkmark" size={24} color="#16A34A" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.contactTitle, { color: '#166534', fontSize: 16 }]}>
                    সরকারি প্রবাসী কল্যাণ হেল্পলাইন
                  </Text>
                  <Text style={[styles.contactLicense, { color: '#15803D' }]}>
                    বিএমইটি ও প্রবাসী কল্যাণ মন্ত্রণালয়ের জরুরি সেবা
                  </Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Ionicons name="call" size={18} color="#16A34A" />
                <Text style={[styles.infoVal, { marginLeft: 10, fontWeight: 'bold' }]}>
                  ১৬১০৫ (দেশ থেকে টোল ফ্রি) | ০১৭৫৫-০০০০০০ (বিদেশ থেকে)
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
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
  licenseBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.gold.primary,
  },
  licenseBadgeText: {
    color: colors.gold.light,
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabNavWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabNavContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 8,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  tabChipActive: {
    backgroundColor: colors.navy.primary,
  },
  tabChipText: {
    fontSize: 13,
    color: colors.text.muted,
    fontWeight: '600',
  },
  tabChipTextActive: {
    color: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    gap: 16,
  },
  bannerCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.navy.primary,
  },
  bannerDesc: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    lineHeight: 17,
  },
  searchCard: {
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
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  searchBtn: {
    backgroundColor: colors.navy.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  demoLabel: {
    fontSize: 11,
    color: colors.text.muted,
  },
  demoChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoChipText: {
    fontSize: 11,
    color: colors.navy.primary,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedBadgeText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: 'bold',
  },
  resultInvoiceNo: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dataItem: {
    width: '48%',
  },
  dataItemLabel: {
    fontSize: 11,
    color: colors.text.muted,
    marginBottom: 2,
  },
  dataItemValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  amountBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 6,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  amountVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  metaText: {
    fontSize: 11,
    color: colors.text.muted,
  },
  agencySealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 6,
  },
  agencySealText: {
    fontSize: 11,
    color: colors.navy.primary,
    fontWeight: '600',
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 4,
  },
  flagCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 12,
  },
  flagIconBox: {
    marginTop: 2,
  },
  flagContent: {
    flex: 1,
  },
  flagTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#991B1B',
    marginBottom: 4,
  },
  flagDesc: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  helpCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.navy.primary,
  },
  helpDesc: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  helpBtn: {
    backgroundColor: colors.navy.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  helpBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tradeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: 12,
    alignItems: 'center',
  },
  tradeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tradeContent: {
    flex: 1,
  },
  tradeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  tradeDesc: {
    fontSize: 12,
    color: colors.emerald.dark,
    fontWeight: '600',
    marginTop: 2,
  },
  tradeCenter: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: 12,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.navy.primary,
  },
  contactLicense: {
    fontSize: 12,
    color: colors.gold.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 11,
    color: colors.text.muted,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
