import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { POPULAR_DESTINATIONS } from '../data/mockData';
import { DestinationCountry } from '../types';

interface DestinationChipsProps {
  selectedCountryId?: string | null;
  onSelectCountry?: (country: DestinationCountry | null) => void;
}

export const DestinationChips: React.FC<DestinationChipsProps> = ({
  selectedCountryId,
  onSelectCountry,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>জনপ্রিয় কর্মসংস্থান গন্তব্য</Text>
          <Text style={styles.sectionSubtitle}>সরকারি অনুমোদিত ও সক্রিয় ডিমান্ড সমূহ</Text>
        </View>
        {selectedCountryId && (
          <TouchableOpacity onPress={() => onSelectCountry?.(null)}>
            <Text style={styles.clearFilterText}>সব দেশ</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {POPULAR_DESTINATIONS.map((country) => {
          const isSelected = selectedCountryId === country.id;
          return (
            <TouchableOpacity
              key={country.id}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
              ]}
              onPress={() => onSelectCountry?.(isSelected ? null : country)}
              activeOpacity={0.8}
            >
              <Text style={styles.flag}>{country.flag}</Text>
              <View>
                <Text style={[styles.countryName, isSelected && styles.countryNameSelected]}>
                  {country.nameBn}
                </Text>
                <Text style={[styles.demandsCount, isSelected && styles.demandsCountSelected]}>
                  {country.activeDemands}+ ডিমান্ড
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 10,
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
  clearFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.emerald.primary,
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: '#102B50',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  chipSelected: {
    backgroundColor: colors.navy.primary,
    borderColor: colors.navy.primary,
  },
  flag: {
    fontSize: 24,
  },
  countryName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  countryNameSelected: {
    color: colors.text.white,
  },
  demandsCount: {
    fontSize: 10,
    color: colors.emerald.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  demandsCountSelected: {
    color: colors.gold.badge,
  },
});
