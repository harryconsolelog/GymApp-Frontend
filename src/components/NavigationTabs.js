import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const NavigationTabs = ({ activeTab, onTabChange, disabledTabs = [] }) => {
  const tabs = [
    { id: 'workout', label: 'Workout' },
    { id: 'client', label: 'Client' },
    { id: 'availability', label: 'Availability' },
    { id: 'bookSlots', label: 'Book Slots' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isDisabled = disabledTabs.includes(tab.id);
        
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, isActive && styles.tabActive, isDisabled && styles.tabDisabled]}
            onPress={() => !isDisabled && onTabChange(tab.id)}
            disabled={isDisabled}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive, isDisabled && styles.tabTextDisabled]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabDisabled: {
    opacity: 0.4,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  tabTextDisabled: {
    color: colors.textSecondary,
  },
});

export default NavigationTabs;

