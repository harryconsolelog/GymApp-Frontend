import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import Header from '../components/Header';
import NavigationTabs from '../components/NavigationTabs';
import { colors } from '../theme/colors';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { availabilityAPI } from '../utils/api';
import { getCurrentMonth, calendarTheme } from '../utils/calendarUtils';
import { parseErrorMessage } from '../utils/errorUtils';

const BookSlotsScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('bookSlots');
  
  // Don't set initial date - let user select a date first
  const [selectedDate, setSelectedDate] = useState(null);
  const [availabilityRecords, setAvailabilityRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAvailabilityRecords = async () => {
    try {
      setLoading(true);
      const data = await availabilityAPI.getAll();
      setAvailabilityRecords(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load availability records');
    } finally {
      setLoading(false);
    }
  };

  // Sync activeTab and fetch records when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setActiveTab('bookSlots');
      fetchAvailabilityRecords();
    }, [])
  );

  // Process availability records to create marked dates and slots
  const processAvailabilityData = () => {
    const markedDates = {};
    const slotsForSelectedDate = [];
    const availableDatesSet = new Set();

    // First pass: Collect all available dates and slots for selected date
    availabilityRecords.forEach((record) => {
      record.dates?.forEach((dateStr) => {
        availableDatesSet.add(dateStr);
        
        // If this date matches selected date, add to slots list
        if (selectedDate && dateStr === selectedDate) {
          slotsForSelectedDate.push({
            id: `${record.id}-${dateStr}`,
            availabilityId: record.id,
            date: dateStr,
            time: `${record.startTime} - ${record.endTime}`,
            startTime: record.startTime,
            endTime: record.endTime,
          });
        }
      });
    });

    // Only mark dates that have availability data (from API)
    // This prevents showing hardcoded dates
    availableDatesSet.forEach((dateStr) => {
      if (selectedDate && dateStr === selectedDate) {
        // Selected date with availability - full green (100% opacity)
        markedDates[dateStr] = {
          selected: true,
          selectedColor: colors.primary,
          marked: true,
          dotColor: colors.white,
          customStyles: {
            container: {
              backgroundColor: colors.primary, // #4CAF50 full opacity
              borderRadius: 16,
            },
            text: {
              color: colors.white,
              fontWeight: 'bold',
            },
          },
        };
      } else {
        // Available dates - light green background with opacity
        markedDates[dateStr] = {
          selected: false,
          marked: true,
          dotColor: colors.primary,
          customStyles: {
            container: {
              backgroundColor: 'rgba(76, 175, 80, 0.25)', // Light green with ~25% opacity
              borderRadius: 16,
              borderWidth: 0,
            },
            text: {
              color: colors.text,
              fontWeight: 'normal',
            },
          },
        };
      }
    });

    // If selected date has no slots but user selected it, show it as selected (but not marked)
    // Only do this if there are availability records and a date is selected (so we don't show hardcoded dates when there's no data)
    if (selectedDate && !markedDates[selectedDate] && availableDatesSet.size > 0) {
      // Selected date has no availability - show it as selected but not marked
      markedDates[selectedDate] = {
        selected: true,
        selectedColor: colors.primary,
        marked: false,
      };
    }
    return { markedDates, slotsForSelectedDate };
  };

  const handleSlotOpen = (slotId) => {
    Alert.alert('Slot Opened', 'This slot is now available for booking.');
  };

  const handleDeleteSlot = async (availabilityId, date) => {
    try {
      await availabilityAPI.deleteSlot(availabilityId, date);
      await fetchAvailabilityRecords();
    } catch (error) {
      const errorMessage = parseErrorMessage(error);
      if (Platform.OS === 'web') {
        window.alert(`Error: ${errorMessage || 'Failed to delete slot'}`);
      } else {
        Alert.alert('Error', errorMessage || 'Failed to delete slot');
      }
    }
  };

  const handleTabChange = (tab) => {
    // Navigate first, then let the target screen update its activeTab via useFocusEffect
    // Don't update local activeTab here - let useFocusEffect handle it
    if (tab === 'workout') {
      navigation.navigate('WorkoutManagement');
    } else if (tab === 'availability') {
      navigation.navigate('SetAvailability');
    }
    // If tab is 'bookSlots', we're already on this screen, so do nothing
  };

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const { markedDates, slotsForSelectedDate } = processAvailabilityData();

  return (
    <View style={[styles.container, Platform.OS === 'web' && styles.webContainer]}>
      <Header
        title="Workout Management"
        onMenuPress={() => {}}
        showBack={false}
      />
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        disabledTabs={['client']}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView 
          style={[styles.content, Platform.OS === 'web' && styles.webContent]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          scrollEnabled={true}
        >
          <Text style={styles.heading}>Book Client Slots</Text>

          <View style={styles.calendarContainer}>
            <Calendar
              current={getCurrentMonth()}
              markedDates={markedDates}
              onDayPress={handleDayPress}
              markingType="custom"
              enableSwipeMonths={true}
              theme={calendarTheme}
            />
          </View>

          <Text style={styles.sectionTitle}>Available Slots:</Text>

          {!selectedDate ? (
            <Text style={styles.emptyText}>Select a date to view available slots.</Text>
          ) : slotsForSelectedDate.length === 0 ? (
            <Text style={styles.emptyText}>No slots available for this date.</Text>
          ) : (
            slotsForSelectedDate.map((slot) => (
              <View key={slot.id} style={styles.slotCard}>
                <View style={styles.slotInfo}>
                  <Text style={styles.slotTime}>{slot.time}</Text>
                </View>
                <View style={styles.slotActions}>
                  <TouchableOpacity
                    style={styles.openButton}
                    onPress={() => handleSlotOpen(slot.id)}
                  >
                    <Text style={styles.openButtonText}>Open</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(e) => {
                      if (e) {
                        e.stopPropagation();
                        e.preventDefault();
                      }
                      handleDeleteSlot(slot.availabilityId, slot.date);
                    }}
                    onPressIn={(e) => {
                      if (e) {
                        e.stopPropagation();
                        e.preventDefault();
                      }
                    }}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash" size={24} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webContainer: {
    height: '100vh',
    maxHeight: '100vh',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  webContent: {
    height: '100%',
    maxHeight: '100%',
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  calendarContainer: {
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.white,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  slotCard: {
    backgroundColor: colors.white,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 15,
  },
  slotInfo: {
    flex: 1,
  },
  slotTime: {
    fontSize: 16,
    color: colors.text,
    borderRadius: 8,
    padding: 10,
    borderColor: colors.primary,
    borderWidth: 1,
    fontWeight: '500',
    marginBottom: 4,
    paddingRight: 0,
    marginRight: 0,
  },
  slotActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  openButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  openButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 5,
  },
});

export default BookSlotsScreen;
