import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NOTICES = [
  {
    id: 'n-1',
    title: 'সৌদি আরব ক্লায়েন্ট ইন্টারভিউ',
    date: '০২ নভেম্বর ২০২৬',
    type: 'URGENT',
    desc: 'আল-খোবার লজিস্টিকসের জন্য সরাসরি ক্লায়েন্ট ভাইভা আগামী ১০ই নভেম্বর সকাল ৯টায় আমাদের ঢাকা প্রধান কার্যালয়ে অনুষ্ঠিত হবে।',
  },
  {
    id: 'n-2',
    title: 'GAMCA মেডিকেল ফি হালনাগাদ',
    date: '০১ নভেম্বর ২০২৬',
    type: 'INFO',
    desc: 'জিসিসি দেশসমূহের জন্য গামকা মেডিকেল টেস্টের অনলাইন ফি সরকারি নির্দেশনা অনুযায়ী আপডেট করা হয়েছে।',
  },
  {
    id: 'n-3',
    title: 'বিএমইটি স্মার্ট কার্ড ওরিয়েন্টেশন',
    date: '২৮ অক্টোবর ২০২৬',
    type: 'SUCCESS',
    desc: 'মালয়েশিয়া ও কাতারগামী নির্বাচিত প্রার্থীদের ৩ দিনের বাধ্যতামূলক ওরিয়েন্টেশন ব্রিফিং শেষ হয়েছে।',
  },
];

export const NotificationModal: React.FC<NotificationModalProps> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="notifications" size={20} color={colors.navy.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>জরুরি নোটিশ বোর্ড</Text>
                <Text style={styles.headerSub}>সরকারি ও এজেন্সি নোটিফিকেশন</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {NOTICES.map((notice) => (
              <View key={notice.id} style={styles.noticeItem}>
                <View style={styles.noticeTop}>
                  <View 
                    style={[
                      styles.typeBadge,
                      notice.type === 'URGENT' && styles.typeBadgeUrgent,
                      notice.type === 'SUCCESS' && styles.typeBadgeSuccess,
                    ]}
                  >
                    <Text 
                      style={[
                        styles.typeText,
                        notice.type === 'URGENT' && styles.typeTextUrgent,
                        notice.type === 'SUCCESS' && styles.typeTextSuccess,
                      ]}
                    >
                      {notice.type === 'URGENT' ? 'জরুরি নোটিশ' : notice.type === 'SUCCESS' ? 'সফলতা' : 'তথ্য'}
                    </Text>
                  </View>
                  <Text style={styles.noticeDate}>{notice.date}</Text>
                </View>

                <Text style={styles.noticeTitle}>{notice.title}</Text>
                <Text style={styles.noticeDesc}>{notice.desc}</Text>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>বন্ধ করুন</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.background.card,
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    padding: 18,
    shadowColor: '#102B50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.navy.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  headerSub: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    marginVertical: 12,
  },
  noticeItem: {
    backgroundColor: colors.background.page,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.navy.primary,
  },
  noticeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeBadge: {
    backgroundColor: colors.navy.subtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeUrgent: {
    backgroundColor: '#FEE2E2',
  },
  typeBadgeSuccess: {
    backgroundColor: colors.emerald.subtle,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.navy.primary,
  },
  typeTextUrgent: {
    color: colors.status.error,
  },
  typeTextSuccess: {
    color: colors.emerald.dark,
  },
  noticeDate: {
    fontSize: 10,
    color: colors.text.muted,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  noticeDesc: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  doneBtn: {
    backgroundColor: colors.navy.primary,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  doneBtnText: {
    color: colors.text.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
