import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import NavigationTabs from '../components/NavigationTabs';
import { colors } from '../theme/colors';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { workoutAPI } from '../utils/api';
import { parseErrorMessage } from '../utils/errorUtils';

const WorkoutManagementScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('workout');
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Form state
  const [workoutName, setWorkoutName] = useState('');
  const [days, setDays] = useState([
    {
      id: Date.now(),
      dayNumber: 1,
      muscleGroup: '',
      exercises: [{ id: Date.now() + 1, name: '', sets: '', reps: '' }],
    },
  ]);
  const [advice, setAdvice] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    workoutName: false,
    days: {}, // { dayId: { muscleGroup: false, exercises: { exerciseId: { name: false } } } }
  });

  // Sync activeTab with current route
  useFocusEffect(
    React.useCallback(() => {
      setActiveTab('workout');
    }, [])
  );

  // Fetch workout plans on mount
  useEffect(() => {
    fetchWorkoutPlans();
  }, []);

  const fetchWorkoutPlans = async () => {
    try {
      setLoading(true);
      const data = await workoutAPI.getAll();
      setWorkoutPlans(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load workout plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorkout = async (id) => {
    try {
      setLoading(true);
      const workoutPlan = await workoutAPI.getById(id);
      
      // Populate form with workout plan data
      setWorkoutName(workoutPlan.name || '');
      setAdvice(workoutPlan.advice || '');
      
      // Transform backend data to form state
      // Backend returns sets as number, reps as string - convert sets to string for TextInput
      const transformedDays = workoutPlan.days?.map((day, index) => ({
        id: day.id || Date.now() + index,
        dayNumber: day.dayNumber || index + 1,
        muscleGroup: day.muscleGroup || '',
        exercises: day.exercises?.length > 0 
          ? day.exercises.map((ex, exIndex) => ({
              id: ex.id || Date.now() + index * 100 + exIndex,
              name: ex.name || '',
              sets: typeof ex.sets === 'number' ? ex.sets.toString() : (ex.sets?.toString() || ''),
              reps: ex.reps?.toString() || '',
            }))
          : [{ id: Date.now() + index * 100, name: '', sets: '', reps: '' }],
      })) || [{ id: Date.now(), dayNumber: 1, muscleGroup: '', exercises: [{ id: Date.now() + 1, name: '', sets: '', reps: '' }] }];
      
      setDays(transformedDays);
      setSelectedDayIndex(0);
      setEditingId(id);
      setShowForm(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load workout plan');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async (id) => {
    try {
      await workoutAPI.delete(id);
      await fetchWorkoutPlans();
    } catch (error) {
      const errorMessage = parseErrorMessage(error);
      if (Platform.OS === 'web') {
        window.alert(`Error: ${errorMessage || 'Failed to delete workout plan'}`);
      } else {
        Alert.alert('Error', errorMessage || 'Failed to delete workout plan');
      }
    }
  };

  const handleAddNewWorkout = () => {
    // Reset form for new workout
    setWorkoutName('');
    setDays([{
      id: Date.now(),
      dayNumber: 1,
      muscleGroup: '',
      exercises: [{ id: Date.now() + 1, name: '', sets: '', reps: '' }],
    }]);
    setAdvice('');
    setEditingId(null);
    setSelectedDayIndex(0);
    setFieldErrors({
      workoutName: false,
      days: {},
    });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setWorkoutName('');
    setDays([{
      id: Date.now(),
      dayNumber: 1,
      muscleGroup: '',
      exercises: [{ id: Date.now() + 1, name: '', sets: '', reps: '' }],
    }]);
    setAdvice('');
    setFieldErrors({
      workoutName: false,
      days: {},
    });
  };

  const handleAddDay = () => {
    const newDayNumber = days.length > 0 ? Math.max(...days.map(d => d.dayNumber)) + 1 : 1;
    setDays([...days, {
      id: Date.now(),
      dayNumber: newDayNumber,
      muscleGroup: '',
      exercises: [{ id: Date.now() + 1, name: '', sets: '', reps: '' }],
    }]);
    setSelectedDayIndex(days.length);
  };

  const handleDeleteDay = (dayId) => {
    if (days.length === 1) {
      Alert.alert('Error', 'At least one day is required');
      return;
    }
    
    const filteredDays = days.filter(d => d.id !== dayId);
    // Reindex day numbers
    const reindexedDays = filteredDays.map((day, index) => ({
      ...day,
      dayNumber: index + 1,
    }));
    setDays(reindexedDays);
    if (selectedDayIndex >= reindexedDays.length) {
      setSelectedDayIndex(reindexedDays.length - 1);
    }
  };

  const handleSelectDay = (index) => {
    setSelectedDayIndex(index);
  };

  const handleUpdateDayMuscleGroup = (dayId, muscleGroup) => {
    setDays(days.map(day => 
      day.id === dayId ? { ...day, muscleGroup } : day
    ));
    // Clear error when user starts typing
    if (fieldErrors.days[dayId]?.muscleGroup) {
      setFieldErrors(prev => ({
        ...prev,
        days: {
          ...prev.days,
          [dayId]: {
            ...prev.days[dayId],
            muscleGroup: false,
          },
        },
      }));
    }
  };

  const handleAddExercise = (dayId) => {
    setDays(days.map(day => 
      day.id === dayId 
        ? { ...day, exercises: [...day.exercises, { id: Date.now(), name: '', sets: '', reps: '' }] }
        : day
    ));
  };

  const handleDeleteExercise = (dayId, exerciseId) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        const filteredExercises = day.exercises.filter(ex => ex.id !== exerciseId);
        // Ensure at least one exercise remains
        if (filteredExercises.length === 0) {
          filteredExercises.push({ id: Date.now(), name: '', sets: '', reps: '' });
        }
        return { ...day, exercises: filteredExercises };
      }
      return day;
    }));
  };

  const handleUpdateExercise = (dayId, exerciseId, field, value) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          exercises: day.exercises.map(ex =>
            ex.id === exerciseId ? { ...ex, [field]: value } : ex
          ),
        };
      }
      return day;
    }));
    // Clear error when user starts typing
    if (field === 'name' && fieldErrors.days[dayId]?.exercises[exerciseId]?.name) {
      setFieldErrors(prev => ({
        ...prev,
        days: {
          ...prev.days,
          [dayId]: {
            ...prev.days[dayId],
            exercises: {
              ...prev.days[dayId]?.exercises,
              [exerciseId]: {
                ...prev.days[dayId]?.exercises[exerciseId],
                name: false,
              },
            },
          },
        },
      }));
    }
  };

  const handleSubmit = async () => {
    // Validation with field-level errors
    const errors = {
      workoutName: !workoutName.trim(),
      days: {},
    };

    // Validate each day
    days.forEach((day) => {
      const dayErrors = {
        muscleGroup: !day.muscleGroup.trim(),
        exercises: {},
      };

      // Validate each exercise
      day.exercises.forEach((exercise) => {
        if (!exercise.name.trim()) {
          dayErrors.exercises[exercise.id] = { name: true };
        }
      });

      // Only add day errors if there are any
      if (dayErrors.muscleGroup || Object.keys(dayErrors.exercises).length > 0) {
        errors.days[day.id] = dayErrors;
      }
    });

    setFieldErrors(errors);

    // Check if any errors exist
    if (errors.workoutName || Object.keys(errors.days).length > 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Prepare data for backend
    const submitData = {
      name: workoutName.trim(),
      advice: advice.trim(),
      days: days.map(day => ({
        dayNumber: day.dayNumber,
        muscleGroup: day.muscleGroup.trim(),
        exercises: day.exercises
          .filter(ex => ex.name.trim()) // Only include exercises with names
          .map(ex => {
            // Convert sets to number, handle empty strings and non-numeric values
            const setsValue = ex.sets.trim();
            const setsNumber = setsValue ? parseInt(setsValue, 10) : 0;
            
            return {
              name: ex.name.trim(),
              sets: isNaN(setsNumber) ? 0 : setsNumber, // Convert to number, default to 0 if invalid
              reps: ex.reps.trim(), // Keep as string (can contain "30 secs", "5-8", etc.)
            };
          }),
      })).filter(day => day.exercises.length > 0), // Only include days with exercises
    };

    // Validate at least one day with exercises
    if (submitData.days.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        // Update existing workout plan
        await workoutAPI.update(editingId, submitData);
        Alert.alert('Success', 'Workout plan updated successfully!');
      } else {
        // Create new workout plan
        await workoutAPI.create(submitData);
        Alert.alert('Success', 'Workout plan created successfully!');
      }
      
      // Refresh list and close form
      await fetchWorkoutPlans();
      handleCancelForm();
    } catch (error) {
      const errorMessage = parseErrorMessage(error);
      Alert.alert('Error', errorMessage || 'Failed to save workout plan');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    // Navigate first, then let the target screen update its activeTab via useFocusEffect
    // Don't update local activeTab here - let useFocusEffect handle it
    if (tab === 'availability') {
      navigation.navigate('SetAvailability');
    } else if (tab === 'bookSlots') {
      navigation.navigate('BookSlots');
    }
    // If tab is 'workout', we're already on this screen, so do nothing
  };

  const currentDay = days[selectedDayIndex] || days[0];
  const maxWords = 50;
  const wordCount = advice.split(/\s+/).filter(word => word.length > 0).length;
  const wordsRemaining = maxWords - wordCount;

  if (showForm) {
    return (
      <View style={[styles.container, Platform.OS === 'web' && styles.webContainer]}>
        <Header
          title="Add Workout Plan"
          onMenuPress={() => {}}
          onBackPress={handleCancelForm}
          showBack={true}
        />
        <NavigationTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          disabledTabs={['client']}
        />
        
        <ScrollView 
          style={[styles.content, Platform.OS === 'web' && styles.webContent]} 
          contentContainerStyle={styles.formContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          scrollEnabled={true}
        >
          {/* Workout Plan Name Input */}
          <TextInput
            style={[styles.workoutNameInput, fieldErrors.workoutName && styles.inputError]}
            value={workoutName}
            onChangeText={(text) => {
              setWorkoutName(text);
              if (fieldErrors.workoutName) {
                setFieldErrors(prev => ({ ...prev, workoutName: false }));
              }
            }}
            placeholder="Workout Plan Name"
            placeholderTextColor={colors.textSecondary}
          />

          {/* Days Section - Match Figma: Day button, muscle group input, delete icon on same row */}
          <View style={styles.daysSection}>
            {days.map((day, index) => (
              <View key={day.id} style={styles.dayRow}>
                <TouchableOpacity
                  style={[styles.dayButton, selectedDayIndex === index && styles.dayButtonActive]}
                  onPress={() => handleSelectDay(index)}
                >
                  <Text style={styles.dayButtonText}>Day {day.dayNumber}</Text>
                </TouchableOpacity>
                <TextInput
                  style={[
                    styles.muscleGroupInput,
                    fieldErrors.days[day.id]?.muscleGroup && styles.inputError
                  ]}
                  value={day.muscleGroup}
                  onChangeText={(text) => handleUpdateDayMuscleGroup(day.id, text)}
                  placeholder="Muscle Group (e.g., Chest)"
                  placeholderTextColor={colors.textSecondary}
                />
                {days.length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleDeleteDay(day.id)}
                    style={styles.deleteDayButton}
                  >
                    <Ionicons name="trash-outline" size={24} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            
            {/* Add Day Button - Below day rows */}
            <TouchableOpacity style={styles.addDayButton} onPress={handleAddDay}>
              <Ionicons name="add-circle" size={40} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Muscle Group Title - Only show if muscle group is set */}
          {currentDay.muscleGroup && (
            <Text style={styles.muscleGroupTitle}>{currentDay.muscleGroup}</Text>
          )}

          {/* Exercise List Section - Match Figma layout */}
          <View style={styles.exerciseSection}>
            {/* Column Headers */}
            <View style={styles.exerciseHeaderRow}>
              <Text style={[styles.exerciseHeaderText, styles.exerciseNameHeader]}></Text>
              <Text style={[styles.exerciseHeaderText, styles.setsHeader]}>Sets</Text>
              <Text style={[styles.exerciseHeaderText, styles.repsHeader]}>Reps</Text>
              <View style={styles.deleteColumnPlaceholder} />
            </View>

            {/* Exercise Rows - All inputs in same row with divider below */}
            {currentDay.exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseRowContainer}>
                <View style={styles.exerciseRow}>
                  <TextInput
                    style={[
                      styles.exerciseInput, 
                      styles.exerciseNameInput,
                      fieldErrors.days[currentDay.id]?.exercises[exercise.id]?.name && styles.inputError
                    ]}
                    value={exercise.name}
                    onChangeText={(text) => handleUpdateExercise(currentDay.id, exercise.id, 'name', text)}
                    placeholder="Exercise name"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.exerciseInput, styles.setsInput]}
                    value={exercise.sets}
                    onChangeText={(text) => handleUpdateExercise(currentDay.id, exercise.id, 'sets', text)}
                    placeholder="Sets"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.exerciseInput, styles.repsInput]}
                    value={exercise.reps}
                    onChangeText={(text) => handleUpdateExercise(currentDay.id, exercise.id, 'reps', text)}
                    placeholder="Reps"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TouchableOpacity
                    onPress={() => handleDeleteExercise(currentDay.id, exercise.id)}
                    style={styles.deleteExerciseButton}
                  >
                    <Ionicons name="trash-outline" size={24} color={colors.error} />
                  </TouchableOpacity>
                </View>
                {/* Horizontal divider below each row */}
                <View style={styles.exerciseRowDivider} />
              </View>
            ))}

            {/* Add Exercise Button - Below exercise list */}
            <TouchableOpacity
              style={styles.addExerciseButton}
              onPress={() => handleAddExercise(currentDay.id)}
            >
              <Ionicons name="add-circle" size={40} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Advice Section */}
          <TextInput
            style={styles.adviceInput}
            value={advice}
            onChangeText={setAdvice}
            placeholder="Advice (optional)"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />
          <Text style={styles.wordCount}>
            {wordsRemaining >= 0 ? `${wordsRemaining} words remaining` : `${Math.abs(wordsRemaining)} words over limit`}
          </Text>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // List View
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
        <View style={[styles.content, Platform.OS === 'web' && styles.webContent]}>
          <View style={styles.listContentContainer}>
            <View style={styles.headingContainer}>
              <Text style={styles.listHeading}>Custom Workout Plans</Text>
              <View style={styles.headingDivider} />
            </View>
            
            <ScrollView 
              style={styles.workoutPlansScrollView}
              contentContainerStyle={styles.workoutPlansScrollContent}
              showsVerticalScrollIndicator={true}
              bounces={false}
              scrollEnabled={true}
            >
              <View style={styles.workoutPlansContainer}>
                {workoutPlans.length === 0 ? (
                  <Text style={styles.emptyText}>No workout plans yet.</Text>
                ) : (
                  workoutPlans.map((plan, index) => (
                    <View key={plan.id}>
                      <TouchableOpacity
                        style={styles.workoutCard}
                        onPress={() => handleSelectWorkout(plan.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.workoutName}>{plan.name}</Text>
                        <TouchableOpacity
                          onPress={(e) => {
                            if (e) {
                              e.stopPropagation();
                              e.preventDefault();
                            }
                            handleDeleteWorkout(plan.id);
                          }}
                          onPressIn={(e) => {
                            if (e) {
                              e.stopPropagation();
                              e.preventDefault();
                            }
                          }}
                          style={styles.deleteButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="trash-outline" size={24} color={colors.error} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                      {index < workoutPlans.length - 1 && <View style={styles.cardDivider} />}
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
            
            {/* Add Button - Below the list */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddNewWorkout}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={50} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
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
  listContentContainer: {
    flex: 1,
    paddingTop: '35%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  workoutPlansScrollView: {
    maxHeight: 280,
    minHeight: 100,
  },
  workoutPlansScrollContent: {
    paddingVertical: 0,
  },
  workoutPlansContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  formContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headingContainer: {
    marginBottom: 15,
    width: '100%',
    alignSelf: 'stretch',
  },
  listHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  headingDivider: {
    height: 4,
    backgroundColor: colors.border,
    width: '100%',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  workoutCard: {
    backgroundColor: colors.white,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
  },
  workoutName: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  deleteButton: {
    padding: 5,
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: 25,
    marginTop: 30,
    marginBottom: 20,
  },
  // Form Styles
  workoutNameInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.white,
    marginBottom: 20,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  daysSection: {
    marginBottom: 20,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 2,
  },
  dayButton: {
    backgroundColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: colors.primary,
  },
  dayButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  muscleGroupInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.text,
  },
  deleteDayButton: {
    padding: 5,
  },
  addDayButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  muscleGroupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
    marginTop: 5,
  },
  exerciseSection: {
    marginBottom: 20,
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  exerciseHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  exerciseNameHeader: {
    flex: 2,
  },
  setsHeader: {
    flex: 0.7,
    textAlign: 'center',
  },
  repsHeader: {
    flex: 0.7,
    textAlign: 'center',
  },
  deleteColumnPlaceholder: {
    width: 36,
  },
  exerciseRowContainer: {
    width: '100%',
    marginBottom: 15,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    flexWrap: 'nowrap',
    paddingVertical: 5,
  },
  exerciseInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: colors.white,
    color: colors.text,
    height: 44,
    justifyContent: 'center',
    minWidth: 0,
  },
  exerciseNameInput: {
    flex: 2,
    marginRight: 6,
    flexShrink: 1,
  },
  setsInput: {
    flex: 0.7,
    marginRight: 6,
    minWidth: 50,
    flexShrink: 0,
  },
  repsInput: {
    flex: 0.7,
    marginRight: 6,
    minWidth: 50,
    flexShrink: 0,
  },
  deleteExerciseButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: 2,
  },
  exerciseRowDivider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
    marginTop: 10,
  },
  addExerciseButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  adviceInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.white,
    marginBottom: 8,
    minHeight: 100,
    textAlignVertical: 'top',
    color: colors.text,
  },
  wordCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 30,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WorkoutManagementScreen;
