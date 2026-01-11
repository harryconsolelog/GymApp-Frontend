import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Switch, Alert, ActivityIndicator, Modal, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import Header from '../components/Header';
import NavigationTabs from '../components/NavigationTabs';
import { colors } from '../theme/colors';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { availabilityAPI } from '../utils/api';
import { getCurrentMonth, calendarTheme } from '../utils/calendarUtils';
import { parseErrorMessage } from '../utils/errorUtils';

const SetAvailabilityScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('availability');
  
  // Sync activeTab when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setActiveTab('availability');
    }, [])
  );
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [repeatSessions, setRepeatSessions] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastTap, setLastTap] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    date: false,
    startTime: false,
    endTime: false,
    sessionName: false,
  });

  // Calendar state - selectedDates includes all selected dates
  // baseDate is the date from the input field (locked when toggle is ON)
  const [selectedDates, setSelectedDates] = useState({});
  const [baseDate, setBaseDate] = useState('');

  // Handle date selection from dropdown calendar
  const handleDateSelect = (day) => {
    const dateString = day.dateString;
    setDate(dateString);
    setShowDatePicker(false);
    if (fieldErrors.date) {
      setFieldErrors(prev => ({ ...prev, date: false }));
    }
    
    // If toggle is ON, lock this date in the repeat sessions calendar
    if (repeatSessions && dateString) {
      const previousBaseDate = baseDate;
      setBaseDate(dateString);
      
      // Remove old baseDate from locked state if it exists
      const updatedDates = { ...selectedDates };
      if (previousBaseDate && previousBaseDate !== dateString) {
        delete updatedDates[previousBaseDate];
      }
      
      // Add new baseDate as locked (green, marked) in repeat sessions calendar
      updatedDates[dateString] = {
        selected: true,
        selectedColor: colors.primary,
        marked: true,
        dotColor: colors.primary,
      };
      
      setSelectedDates(updatedDates);
    } else if (!repeatSessions && dateString) {
      // Toggle OFF - single date mode, just select this date
      setSelectedDates({
        [dateString]: {
          selected: true,
          selectedColor: colors.primary,
          marked: true,
        },
      });
    }
  };

  // Handle calendar day press - single tap selects, double tap deselects
  const handleDayPress = (day) => {
    const dateString = day.dateString;
    
    // If toggle is OFF, only allow single date selection (update input)
    if (!repeatSessions) {
      setSelectedDates({
        [dateString]: {
          selected: true,
          selectedColor: colors.primary,
          marked: true,
        },
      });
      setDate(dateString);
      return;
    }

    // If toggle is ON, check if this is the locked baseDate
    if (repeatSessions && baseDate && dateString === baseDate) {
      // BaseDate is locked, cannot deselect - show message
      Alert.alert('Info', 'This date is locked. Change the date above first to unlock it.');
      return;
    }

    // Double tap detection for deselecting
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY && dateString !== baseDate) {
      // Double tap - deselect (only if not baseDate)
      setSelectedDates(prev => {
        const updated = { ...prev };
        delete updated[dateString];
        return updated;
      });
      setLastTap(null);
    } else {
      // Single tap - toggle selection
      setSelectedDates(prev => {
        const updated = { ...prev };
        
        // If already selected, deselect (only if not baseDate)
        if (updated[dateString] && dateString !== baseDate) {
          delete updated[dateString];
        } else {
          // Select new date (if not baseDate, or if baseDate needs to be added)
          updated[dateString] = {
            selected: true,
            selectedColor: colors.primary,
            marked: true,
            dotColor: colors.primary,
          };
        }
        
        return updated;
      });
      setLastTap(now);
    }
  };

  // Handle toggle change
  const handleToggleChange = (value) => {
    setRepeatSessions(value);
    
    if (!value) {
      // Toggle OFF - reset to single date mode, enable date picker
      // Clear the repeat sessions calendar selections
      setSelectedDates({});
      setBaseDate('');
    } else {
      // Toggle ON - lock current selected date if exists, disable date picker
      // User must have a date selected from the dropdown before turning toggle ON
      if (date && date.trim()) {
        setBaseDate(date.trim());
        // Add the selected date to the repeat sessions calendar as locked
        setSelectedDates(prev => ({
          ...prev,
          [date.trim()]: {
            selected: true,
            selectedColor: colors.primary,
            marked: true,
            dotColor: colors.primary,
          },
        }));
      } else {
        // If no date is selected, warn user and turn toggle back OFF
        Alert.alert(
          'Date Required', 
          'Please select a date first before enabling repeat sessions. The selected date will be the base date and included in the dates array.',
          [{ text: 'OK' }]
        );
        setRepeatSessions(false);
        return;
      }
    }
  };

  // Handle create availability
  const handleCreate = async () => {
    // Validation with field-level errors
    const errors = {
      date: !date.trim(),
      startTime: !startTime.trim(),
      endTime: !endTime.trim(),
      sessionName: !sessionName.trim(),
    };

    setFieldErrors(errors);

    // Check if any errors exist
    if (Object.values(errors).some(error => error)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Prepare dates array
    let datesArray = [];
    
    if (repeatSessions) {
      // Get all dates that are in selectedDates (from repeat sessions calendar)
      datesArray = Object.keys(selectedDates);
      
      // Ensure the selected date (from dropdown calendar above) is included
      if (date.trim() && !datesArray.includes(date.trim())) {
        datesArray.push(date.trim());
      }
      
      // Ensure baseDate is included if it exists and is not empty
      if (baseDate && baseDate.trim() && !datesArray.includes(baseDate.trim())) {
        datesArray.push(baseDate.trim());
      }
      
      // Remove any empty strings
      datesArray = datesArray.filter(d => d && d.trim());
      
      if (datesArray.length === 0) {
        Alert.alert('Error', 'Please select at least one date');
        return;
      }
      
      // Remove duplicates and sort dates chronologically
      datesArray = [...new Set(datesArray)].sort();
    } else {
      // Single date mode - use the date from dropdown calendar
      datesArray = [date.trim()];
    }

    // Prepare request data
    const requestData = {
      sessionName: sessionName.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      dates: datesArray,
    };

    try {
      setLoading(true);
      const result = await availabilityAPI.create(requestData);
      Alert.alert('Success', 'Availability created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setDate('');
            setStartTime('');
            setEndTime('');
            setSessionName('');
            setSelectedDates({});
            setBaseDate('');
            setRepeatSessions(false);
            setFieldErrors({
              date: false,
              startTime: false,
              endTime: false,
              sessionName: false,
            });
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating availability:', error);
      
      const errorMessage = parseErrorMessage(error);
      Alert.alert('Error', errorMessage || 'Failed to create availability');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    // Navigate first, then let the target screen update its activeTab via useFocusEffect
    // Don't update local activeTab here - let useFocusEffect handle it
    if (tab === 'workout') {
      navigation.navigate('WorkoutManagement');
    } else if (tab === 'bookSlots') {
      navigation.navigate('BookSlots');
    }
    // If tab is 'availability', we're already on this screen, so do nothing
  };


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
      
      <ScrollView 
        style={[styles.content, Platform.OS === 'web' && styles.webContent]}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        scrollEnabled={true}
      >
        <Text style={styles.heading}>Set Availability</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date*</Text>
          <TouchableOpacity
            style={[
              styles.datePickerButton, 
              repeatSessions && styles.datePickerDisabled,
              fieldErrors.date && styles.inputError
            ]}
            onPress={() => !repeatSessions && setShowDatePicker(true)}
            disabled={repeatSessions}
            activeOpacity={0.7}
          >
            <Text style={[styles.datePickerText, !date && styles.datePickerPlaceholder]}>
              {date || 'Select date'}
            </Text>
            <Ionicons 
              name="calendar-outline" 
              size={24} 
              color={repeatSessions ? colors.textSecondary : colors.primary} 
            />
          </TouchableOpacity>
          {repeatSessions && (
            <Text style={styles.hintText}>Date picker is disabled when Repeat Sessions is ON. The selected date above will be included in the dates array.</Text>
          )}
        </View>

        {/* Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setShowDatePicker(false)}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Date</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <Calendar
                current={getCurrentMonth()}
                markedDates={date ? {
                  [date]: {
                    selected: true,
                    selectedColor: colors.primary,
                    marked: true,
                    dotColor: colors.white,
                  }
                } : {}}
                onDayPress={handleDateSelect}
                markingType="simple"
                theme={calendarTheme}
              />
            </Pressable>
          </Pressable>
        </Modal>

        <View style={styles.timeContainer}>
          <View style={styles.timeInput}>
            <Text style={styles.label}>Start Time*</Text>
            <TextInput
              style={[styles.input, fieldErrors.startTime && styles.inputError]}
              value={startTime}
              onChangeText={(text) => {
                setStartTime(text);
                if (fieldErrors.startTime) {
                  setFieldErrors(prev => ({ ...prev, startTime: false }));
                }
              }}
              placeholder="e.g., 11:30 AM"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={styles.timeInput}>
            <Text style={styles.label}>End Time*</Text>
            <TextInput
              style={[styles.input, fieldErrors.endTime && styles.inputError]}
              value={endTime}
              onChangeText={(text) => {
                setEndTime(text);
                if (fieldErrors.endTime) {
                  setFieldErrors(prev => ({ ...prev, endTime: false }));
                }
              }}
              placeholder="e.g., 11:45 AM"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Repeat Sessions</Text>
          <Switch
            value={repeatSessions}
            onValueChange={handleToggleChange}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={repeatSessions ? colors.primary : colors.white}
          />
        </View>

        {repeatSessions && (
          <View style={styles.calendarContainer}>
            <Text style={styles.calendarInfo}>
              {baseDate 
                ? `Base date (${baseDate}) is locked (green). Tap other dates to select, double tap to deselect. The base date will be included in the dates array.`
                : 'Select a date above first, then toggle Repeat Sessions ON to enable calendar selection.'}
            </Text>
            <Calendar
              current={getCurrentMonth()}
              markedDates={selectedDates}
              onDayPress={handleDayPress}
              markingType="multi-dot"
              enableSwipeMonths={true}
              theme={calendarTheme}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Session Name*</Text>
          <TextInput
            style={[styles.input, fieldErrors.sessionName && styles.inputError]}
            value={sessionName}
            onChangeText={(text) => {
              setSessionName(text);
              if (fieldErrors.sessionName) {
                setFieldErrors(prev => ({ ...prev, sessionName: false }));
              }
            }}
            placeholder="e.g., PT"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.createButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  heading: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  hintText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 5,
    fontStyle: 'italic',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.white,
    minHeight: 48,
  },
  datePickerDisabled: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    opacity: 0.6,
  },
  datePickerText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  datePickerPlaceholder: {
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 5,
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  timeInput: {
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarContainer: {
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.white,
    padding: 10,
  },
  calendarInfo: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 30,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SetAvailabilityScreen;
