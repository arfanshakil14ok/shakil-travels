import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { AGENCY_INFO } from '../data/mockData';

interface ReceiptModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalHeaderTitle}>অফিসিয়াল মানি রিসিপ্ট</Text>
              <Text style={styles.modalHeaderSub}>গভর্নমেন্ট অনুমোদিত রিক্রুটমেন্ট ভাউচার</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Paper Receipt Simulation */}
            <View style={styles.receiptPaper}>
              {/* Agency Branding */}
              <View style={styles.receiptTop}>
                <Text style={styles.agencyName}>{AGENCY_INFO.name}</Text>
                <Text style={styles.agencyMeta}>Govt. Approved Recruiting Agency • License: {AGENCY_INFO.license}</Text>
                <Text style={styles.agencyAddress}>{AGENCY_INFO.address}</Text>
                <View style={styles.receiptNoTag}>
                  <Text style={styles.receiptNoText}>রিসিপ্ট নং: #ST-MR-4412</Text>
                  <Text style={styles.receiptDateText}>তারিখ: ২৮ অক্টোবর ২০২৬</Text>
                </View>
              </View>

              <View style={styles.dashedLine} />

              {/* Candidate Info */}
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>প্রার্থীর নাম:</Text>
                  <Text style={styles.infoVal}>মোঃ রফিকুল ইসলাম</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>পাসপোর্ট নম্বর:</Text>
                  <Text style={styles.infoVal}>A12345678</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>নিয়োগের দেশ:</Text>
                  <Text style={styles.infoVal}>সৌদি আরব 🇸🇦 (ড্রাইভার)</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>রেফারেন্স আইডি:</Text>
                  <Text style={styles.infoVal}>ST-2026-0891</Text>
                </View>
              </View>

              <View style={styles.dashedLine} />

              {/* Financial Ledger Table */}
              <View style={styles.financeTable}>
                <View style={styles.tableHeader}>
                  <Text style={styles.thDesc}>বিবরণ</Text>
                  <Text style={styles.thAmount}>পরিমাণ (টাকা)</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tdDesc}>ভিসা ও প্রসেসিং প্যাকেজ</Text>
                  <Text style={styles.tdAmount}>২,৫০,০০০ ৳</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tdDesc}>জমা প্রদান (ব্যাংক ট্রান্সফার)</Text>
                  <Text style={[styles.tdAmount, { color: colors.emerald.primary, fontWeight: '800' }]}>
                    (-) ২,০০,০০০ ৳
                  </Text>
                </View>
                <View style={[styles.tableRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>অবশিষ্ট বকেয়া:</Text>
                  <Text style={styles.totalAmount}>৫০,০০০ ৳</Text>
                </View>
              </View>

              {/* Payment Note */}
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>
                  পরিশোধের মাধ্যম: ইসলামী ব্যাংক বাংলাদেশ লিমিটেড (IBBL A/C Deposit)
                </Text>
                <Text style={styles.noteTextSub}>
                  * অবশিষ্ট ৫০,০০০ টাকা ফ্লাইট টিকিট ও বিএমইটি ওরিয়েন্টেশন ব্রিফিংয়ের সময় পরিশোধযোগ্য।
                </Text>
              </View>

              {/* Official Seal / Signature Stamp */}
              <View style={styles.stampRow}>
                <View style={styles.sealBox}>
                  <MaterialCommunityIcons name="seal" size={28} color={colors.navy.primary} />
                  <Text style={styles.sealText}>SHAKIL TRAVELS{'\n'}VERIFIED PAID</Text>
                </View>
                <View style={styles.sigBox}>
                  <Text style={styles.sigLine}>_____________________</Text>
                  <Text style={styles.sigText}>হিসাব কর্মকর্তা স্বাক্ষর</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <TouchableOpacity 
              style={styles.printBtn}
              onPress={() => Alert.alert('প্রিন্ট ও ডাউনলোড', 'রিসিপ্টটি আপনার মোবাইলের ডাউনলোড ফোল্ডারে সেভ করা হয়েছে (PDF আকারে)।')}
              activeOpacity={0.8}
            >
              <Ionicons name="download" size={16} color={colors.text.white} />
              <Text style={styles.printBtnText}>রিসিপ্ট ডাউনলোড (PDF)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: colors.background.card,
    borderRadius: 20,
    maxHeight: '90%',
    padding: 18,
    shadowColor: '#102B50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingBottom: 10,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  modalHeaderSub: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    marginVertical: 12,
  },
  receiptPaper: {
    backgroundColor: '#FAFCFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D8E2EE',
  },
  receiptTop: {
    alignItems: 'center',
    marginBottom: 10,
  },
  agencyName: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.navy.primary,
    letterSpacing: 0.5,
  },
  agencyMeta: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.emerald.dark,
    marginTop: 2,
  },
  agencyAddress: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  receiptNoTag: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: colors.navy.subtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 10,
  },
  receiptNoText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navy.primary,
  },
  receiptDateText: {
    fontSize: 10,
    color: colors.navy.primary,
  },
  dashedLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  infoSection: {
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  infoVal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.primary,
  },
  financeTable: {
    marginTop: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background.input,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  thDesc: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  thAmount: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  tdDesc: {
    fontSize: 11,
    color: colors.text.primary,
  },
  tdAmount: {
    fontSize: 11,
    color: colors.text.primary,
    fontWeight: '600',
  },
  totalRow: {
    borderBottomWidth: 0,
    backgroundColor: colors.gold.light,
    marginTop: 4,
    borderRadius: 6,
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.gold.primary,
  },
  totalAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.gold.primary,
  },
  noteBox: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  noteText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.primary,
  },
  noteTextSub: {
    fontSize: 9,
    color: colors.text.muted,
    marginTop: 2,
  },
  stampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 16,
    paddingHorizontal: 6,
  },
  sealBox: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.navy.primary,
    borderRadius: 8,
    padding: 6,
  },
  sealText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.navy.primary,
    textAlign: 'center',
    marginTop: 2,
  },
  sigBox: {
    alignItems: 'center',
  },
  sigLine: {
    fontSize: 10,
    color: colors.text.muted,
  },
  sigText: {
    fontSize: 9,
    color: colors.text.secondary,
    fontWeight: '600',
    marginTop: 2,
  },
  footerRow: {
    marginTop: 10,
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.emerald.primary,
    paddingVertical: 11,
    borderRadius: 12,
  },
  printBtnText: {
    color: colors.text.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
