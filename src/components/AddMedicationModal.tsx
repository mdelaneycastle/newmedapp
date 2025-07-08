import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface Schedule {
  time_of_day: string;
  days_of_week: number[];
}

interface AddMedicationModalProps {
  onSave: (data: {
    name: string;
    dosage: string;
    instructions: string;
    schedules: Schedule[];
  }) => void;
  onCancel: () => void;
}

const AddMedicationModal: React.FC<AddMedicationModalProps> = ({
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [schedules, setSchedules] = useState<Schedule[]>([
    { time_of_day: '09:00', days_of_week: [1, 2, 3, 4, 5] },
  ]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter medication name');
      return;
    }

    if (schedules.length === 0) {
      Alert.alert('Error', 'Please add at least one schedule');
      return;
    }

    for (const schedule of schedules) {
      if (!schedule.time_of_day || schedule.days_of_week.length === 0) {
        Alert.alert('Error', 'Please complete all schedule information');
        return;
      }
    }

    onSave({
      name: name.trim(),
      dosage: dosage.trim(),
      instructions: instructions.trim(),
      schedules,
    });
  };

  const addSchedule = () => {
    setSchedules([
      ...schedules,
      { time_of_day: '09:00', days_of_week: [1, 2, 3, 4, 5] },
    ]);
  };

  const removeSchedule = (index: number) => {
    if (schedules.length > 1) {
      setSchedules(schedules.filter((_, i) => i !== index));
    }
  };

  const updateScheduleTime = (index: number, time: string) => {
    const newSchedules = [...schedules];
    newSchedules[index].time_of_day = time;
    setSchedules(newSchedules);
  };

  const toggleDay = (scheduleIndex: number, dayIndex: number) => {
    const newSchedules = [...schedules];
    const schedule = newSchedules[scheduleIndex];
    
    if (schedule.days_of_week.includes(dayIndex)) {
      schedule.days_of_week = schedule.days_of_week.filter(d => d !== dayIndex);
    } else {
      schedule.days_of_week.push(dayIndex);
    }
    
    setSchedules(newSchedules);
  };

  const renderSchedule = (schedule: Schedule, index: number) => (
    <View key={index} style={styles.scheduleContainer}>
      <View style={styles.scheduleHeader}>
        <Text style={styles.scheduleTitle}>Schedule {index + 1}</Text>
        {schedules.length > 1 && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeSchedule(index)}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.timeContainer}>
        <Text style={styles.label}>Time:</Text>
        <TextInput
          style={styles.timeInput}
          value={schedule.time_of_day}
          onChangeText={(text) => updateScheduleTime(index, text)}
          placeholder="HH:MM"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.daysContainer}>
        <Text style={styles.label}>Days:</Text>
        <View style={styles.daysRow}>
          {dayNames.map((day, dayIndex) => (
            <TouchableOpacity
              key={dayIndex}
              style={[
                styles.dayButton,
                schedule.days_of_week.includes(dayIndex) && styles.dayButtonActive,
              ]}
              onPress={() => toggleDay(index, dayIndex)}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  schedule.days_of_week.includes(dayIndex) && styles.dayButtonTextActive,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Medication</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medication Details</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Medication Name *"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Dosage (e.g., 500mg, 1 tablet)"
            value={dosage}
            onChangeText={setDosage}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Instructions (e.g., Take with food)"
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Schedules</Text>
            <TouchableOpacity style={styles.addScheduleButton} onPress={addSchedule}>
              <Text style={styles.addScheduleText}>+ Add Schedule</Text>
            </TouchableOpacity>
          </View>

          {schedules.map((schedule, index) => renderSchedule(schedule, index))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    padding: 5,
  },
  cancelText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    padding: 5,
  },
  saveText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addScheduleButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addScheduleText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scheduleContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  removeButton: {
    padding: 5,
  },
  removeButtonText: {
    color: '#ff4444',
    fontSize: 14,
  },
  timeContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  daysContainer: {
    marginBottom: 10,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayButtonText: {
    fontSize: 12,
    color: '#333',
  },
  dayButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AddMedicationModal;