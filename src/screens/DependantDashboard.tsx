import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ApiService from '../services/api';
import CameraComponent from '../components/CameraComponent';
import NotificationService from '../services/notificationService';
import { Medication } from '../types';

interface MedicationItem extends Medication {
  nextDose?: string;
  isOverdue?: boolean;
}

const DependantDashboard: React.FC = () => {
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [recentConfirmations, setRecentConfirmations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<MedicationItem | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    setIsLoading(true);
    try {
      const [medicationData, confirmationsData] = await Promise.all([
        ApiService.getMyMedications(),
        ApiService.getRecentConfirmations()
      ]);
      
      setRecentConfirmations(confirmationsData);
      
      const medicationsWithSchedule = medicationData.map(med => ({
        ...med,
        nextDose: calculateNextDose(med.id, med.time_of_day, med.days_of_week, confirmationsData),
        isOverdue: isOverdue(med.id, med.time_of_day, med.days_of_week, confirmationsData),
      }));

      setMedications(medicationsWithSchedule);

      // Schedule notifications for all medications
      await scheduleNotificationsForMedications(medicationData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load medications');
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleNotificationsForMedications = async (medications: Medication[]) => {
    try {
      const medicationsWithSchedule = medications
        .filter(med => med.time_of_day && med.days_of_week)
        .map(med => ({
          id: med.id,
          name: med.name,
          time_of_day: med.time_of_day!,
          days_of_week: med.days_of_week!,
        }));

      await NotificationService.rescheduleAllMedications(medicationsWithSchedule);
      console.log(`Scheduled notifications for ${medicationsWithSchedule.length} medications`);
    } catch (error) {
      console.error('Failed to schedule notifications:', error);
    }
  };

  const calculateNextDose = (
    medicationId: number,
    timeOfDay?: string, 
    daysOfWeek?: number[],
    confirmations: any[] = []
  ): string => {
    if (!timeOfDay || !daysOfWeek) return 'No schedule';
    
    const now = new Date();
    const today = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const scheduleTime = hours * 60 + minutes;

    // Check if medication has been confirmed today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const takenToday = confirmations.some(confirmation => {
      const takenAt = new Date(confirmation.taken_at);
      return confirmation.medication_id === medicationId && 
             confirmation.confirmed_by_carer && 
             takenAt >= todayStart &&
             confirmation.time_of_day === timeOfDay;
    });

    // If already taken today, show next dose
    if (takenToday) {
      let nextDay = (today + 1) % 7;
      while (!daysOfWeek.includes(nextDay)) {
        nextDay = (nextDay + 1) % 7;
      }
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `${dayNames[nextDay]} at ${timeOfDay}`;
    }

    // If not taken today and scheduled for today
    if (daysOfWeek.includes(today) && currentTime < scheduleTime) {
      return `Today at ${timeOfDay}`;
    }

    // If past today's time or not scheduled today, find next day
    let nextDay = (today + 1) % 7;
    while (!daysOfWeek.includes(nextDay)) {
      nextDay = (nextDay + 1) % 7;
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${dayNames[nextDay]} at ${timeOfDay}`;
  };

  const isOverdue = (
    medicationId: number,
    timeOfDay?: string, 
    daysOfWeek?: number[], 
    confirmations: any[] = []
  ): boolean => {
    if (!timeOfDay || !daysOfWeek) return false;
    
    const now = new Date();
    const today = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const scheduleTime = hours * 60 + minutes;

    // Check if medication is scheduled for today and past due time
    const isPastDue = daysOfWeek.includes(today) && currentTime > scheduleTime + 30;
    
    if (!isPastDue) return false;

    // Check if this medication has been confirmed today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const takenToday = confirmations.some(confirmation => {
      const takenAt = new Date(confirmation.taken_at);
      return confirmation.medication_id === medicationId && 
             confirmation.confirmed_by_carer && 
             takenAt >= todayStart &&
             confirmation.time_of_day === timeOfDay;
    });

    return !takenToday; // Only overdue if not taken today
  };

  const canTakeMedication = (
    medicationId: number,
    timeOfDay?: string, 
    daysOfWeek?: number[],
    confirmations: any[] = []
  ): boolean => {
    if (!timeOfDay || !daysOfWeek) return false;
    
    const now = new Date();
    const today = now.getDay(); // 0=Sunday, 1=Monday, etc.
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const scheduleTime = hours * 60 + minutes;

    // Check if already taken and confirmed today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const takenToday = confirmations.some(confirmation => {
      const takenAt = new Date(confirmation.taken_at);
      return confirmation.medication_id === medicationId && 
             confirmation.confirmed_by_carer && 
             takenAt >= todayStart &&
             confirmation.time_of_day === timeOfDay;
    });

    // Don't allow if already taken today
    if (takenToday) {
      return false;
    }

    // Only allow if scheduled for today
    if (!daysOfWeek.includes(today)) {
      return false;
    }
    
    // Allow 30 minutes before scheduled time until end of day
    const allowedStartTime = scheduleTime - 30;
    
    return currentTime >= allowedStartTime;
  };

  const getAvailableTime = (timeOfDay: string): string => {
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const scheduleTime = hours * 60 + minutes;
    const availableTime = scheduleTime - 30;
    
    const availableHours = Math.floor(availableTime / 60);
    const availableMinutes = availableTime % 60;
    
    return `${availableHours.toString().padStart(2, '0')}:${availableMinutes.toString().padStart(2, '0')}`;
  };

  const handleTakeMedication = (medication: MedicationItem) => {
    // Check if medication can be taken now
    if (!canTakeMedication(medication.time_of_day, medication.days_of_week)) {
      const scheduledTime = medication.time_of_day;
      const availableTime = medication.time_of_day ? getAvailableTime(medication.time_of_day) : '';
      Alert.alert(
        'Too Early',
        `You can take this medication starting at ${availableTime} (30 minutes before the scheduled time of ${scheduledTime}).`,
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedMedication(medication);
    setShowCamera(true);
  };

  const handlePhotoTaken = async (photoUri: string) => {
    try {
      if (!selectedMedication) {
        Alert.alert('Error', 'No medication selected');
        return;
      }

      // Submit the photo confirmation
      await ApiService.submitMedicationConfirmation(
        selectedMedication.id,
        photoUri,
        selectedMedication.schedule_id
      );

      Alert.alert(
        'Photo Submitted',
        'Your medication photo has been submitted for review by your carer.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowCamera(false);
              setSelectedMedication(null);
              loadMedications(); // Refresh the list
            },
          },
        ]
      );
    } catch (error) {
      console.error('Photo submission error:', error);
      Alert.alert('Error', 'Failed to submit photo');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await ApiService.logout();
            navigation.navigate('Login' as never);
          },
        },
      ]
    );
  };

  const renderMedicationItem = ({ item }: { item: MedicationItem }) => {
    const canTake = canTakeMedication(item.id, item.time_of_day, item.days_of_week, recentConfirmations);
    const isScheduledToday = item.days_of_week?.includes(new Date().getDay()) || false;
    
    return (
      <View style={[styles.medicationCard, item.isOverdue && styles.overdueCard]}>
        <View style={styles.medicationHeader}>
          <Text style={styles.medicationName}>{item.name}</Text>
          {item.isOverdue && <Text style={styles.overdueText}>OVERDUE</Text>}
          {!canTake && isScheduledToday && !item.isOverdue && (
            <Text style={styles.tooEarlyText}>TOO EARLY</Text>
          )}
        </View>
        
        {item.dosage && (
          <Text style={styles.medicationDosage}>Dosage: {item.dosage}</Text>
        )}
        
        <Text style={styles.nextDose}>Next dose: {item.nextDose}</Text>
        
        {!canTake && isScheduledToday && !item.isOverdue && item.time_of_day && (
          <Text style={styles.availableTime}>
            Available from: {getAvailableTime(item.time_of_day)}
          </Text>
        )}
        
        {item.instructions && (
          <Text style={styles.instructions}>{item.instructions}</Text>
        )}
        
        <TouchableOpacity
          style={[
            styles.takeButton, 
            item.isOverdue && styles.overdueButton,
            !canTake && isScheduledToday && styles.disabledButton
          ]}
          onPress={() => handleTakeMedication(item)}
          disabled={!canTake && isScheduledToday && !item.isOverdue}
        >
          <Text style={[
            styles.takeButtonText,
            !canTake && isScheduledToday && styles.disabledButtonText
          ]}>
            {!canTake && isScheduledToday && !item.isOverdue ? 'Too Early' : 'Take Medication'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Medications</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={async () => {
              await NotificationService.scheduleMedicationReminder(
                999, 
                'Test Medication', 
                new Date(Date.now() + 10000).toTimeString().slice(0, 5), // 10 seconds from now
                [new Date().getDay()]
              );
              Alert.alert('Test', 'Test notification scheduled for 10 seconds from now!');
            }}
          >
            <Text style={styles.testButtonText}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={medications}
        renderItem={renderMedicationItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadMedications} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No medications scheduled. Your carer will add medications for you.
            </Text>
          </View>
        }
      />

      <Modal visible={showCamera} animationType="slide" presentationStyle="fullScreen">
        <CameraComponent
          onPhotoTaken={handlePhotoTaken}
          onCancel={() => {
            setShowCamera(false);
            setSelectedMedication(null);
          }}
        />
      </Modal>
    </View>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  testButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  testButtonText: {
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 10,
  },
  logoutText: {
    color: '#007AFF',
    fontSize: 16,
  },
  listContainer: {
    padding: 20,
  },
  medicationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  overdueText: {
    color: '#ff4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tooEarlyText: {
    color: '#ff9500',
    fontSize: 12,
    fontWeight: 'bold',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  nextDose: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
  },
  availableTime: {
    fontSize: 14,
    color: '#ff9500',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  takeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  overdueButton: {
    backgroundColor: '#ff4444',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  takeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default DependantDashboard;