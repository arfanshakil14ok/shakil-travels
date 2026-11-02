import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { AGENCY_INFO } from '../data/mockData';

export const HelplineCard: React.FC = () => {
  const handleCall = () => {
    Linking.openURL(`tel:${AGENCY_INFO.hotline}`);
  };

  const handleWhatsApp = () => {
    const cleanNumber = AGENCY_INFO.whatsapp.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${cleanNumber}&text=Hello%20Shakil%20Travels,%20I%20want%20to%20know%20about%20visa%20processing.`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://wa.me/${cleanNumber}`);
        }
      })
      .catch(() => {
        Alert.alert('হোয়াটসঅ্যাপ', `হোয়াটসঅ্যাপ নম্বর: ${AGENCY_INFO.whatsapp}`);
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="headset" size={20} color={colors.navy.primary} />
        <Text style={styles.title}>২৪/৭ ক্যান্ডিডেট সহায়তা ও সাপোর্ট</Text>
      </View>
      <Text style={styles.subtitle}>
        ভিসা প্রসেসিং বা যেকোনো জিজ্ঞাসায় সরাসরি আমাদের অভিজ্ঞ টিমের সাথে কথা বলুন
      </Text>

      <View style={styles.buttonsRow}>
        <TouchableOpacity 
          style={styles.callButton} 
          onPress={handleCall}
          activeOpacity={0.85}
        >
          <Ionicons name="call" size={16} color={colors.text.white} />
          <View>
            <Text style={styles.btnLabel}>হটলাইন কল</Text>
            <Text style={styles.btnSub}>{AGENCY_INFO.hotline}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.whatsappButton} 
          onPress={handleWhatsApp}
          activeOpacity={0.85}
        >
          <FontAwesome name="whatsapp" size={18} color={colors.text.white} />
          <View>
            <Text style={styles.btnLabel}>হোয়াটসঅ্যাপ</Text>
            <Text style={styles.btnSub}>তাৎক্ষণিক চ্যাট</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.addressBox}>
        <MaterialIcons name="location-on" size={16} color={colors.text.muted} />
        <Text style={styles.addressText}>{AGENCY_INFO.address}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 40,
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
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  btnLabel: {
    color: colors.text.white,
    fontSize: 12,
    fontWeight: '700',
  },
  btnSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    marginTop: 1,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  addressText: {
    fontSize: 11,
    color: colors.text.secondary,
    flex: 1,
  },
});
