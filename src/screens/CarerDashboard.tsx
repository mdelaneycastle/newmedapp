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
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ApiService from '../services/api';
import AddMedicationModal from '../components/AddMedicationModal';
import NotificationService from '../services/notificationService';
import { Medication, MedicationConfirmation } from '../types';

const CarerDashboard: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [pendingConfirmations, setPendingConfirmations] = useState<MedicationConfirmation[]>([]);
  const [dependants, setDependants] = useState<Array<{id: number; name: string; email: string}>>([]);
  const [selectedDependant, setSelectedDependant] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'medications' | 'confirmations'>('medications');
  const navigation = useNavigation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load dependants first
      const dependantsData = await ApiService.getDependants();
      setDependants(dependantsData);
      
      // If we have dependants, select the first one and load their medications
      if (dependantsData.length > 0) {
        const firstDependant = dependantsData[0];
        setSelectedDependant(firstDependant.id);
        const medicationsData = await ApiService.getDependantMedications(firstDependant.id);
        setMedications(medicationsData);
      }

      // Load pending confirmations
      const confirmationsData = await ApiService.getPendingConfirmations();
      setPendingConfirmations(confirmationsData);
    } catch (error) {
      console.error('Load data error:', error);
      Alert.alert('Error', 'Failed to load data. Make sure you have dependants linked to your account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMedication = async (medicationData: {
    name: string;
    dosage: string;
    instructions: string;
    schedules: Array<{
      time_of_day: string;
      days_of_week: number[];
    }>;
  }) => {
    try {
      if (!selectedDependant) {
        Alert.alert('Error', 'Please select a dependant first');
        return;
      }
      
      await ApiService.createMedication({
        ...medicationData,
        dependantId: selectedDependant,
      });
      
      Alert.alert('Success', 'Medication added successfully');
      setShowAddModal(false);
      loadData();
      
      // Trigger notification rescheduling for the dependant
      await rescheduleNotificationsForDependant();
    } catch (error) {
      console.error('Add medication error:', error);
      Alert.alert('Error', 'Failed to add medication');
    }
  };

  const rescheduleNotificationsForDependant = async () => {
    try {
      if (!selectedDependant) return;

      const medicationData = await ApiService.getDependantMedications(selectedDependant);
      const medicationsWithSchedule = medicationData
        .filter(med => med.time_of_day && med.days_of_week)
        .map(med => ({
          id: med.id,
          name: med.name,
          time_of_day: med.time_of_day!,
          days_of_week: med.days_of_week!,
        }));

      await NotificationService.rescheduleAllMedications(medicationsWithSchedule);
      console.log(`Rescheduled notifications for ${medicationsWithSchedule.length} medications`);
    } catch (error) {
      console.error('Failed to reschedule notifications:', error);
    }
  };

  const handleConfirmMedication = async (confirmationId: number) => {
    try {
      await ApiService.confirmMedication(confirmationId);
      Alert.alert('Confirmed', 'Medication taking confirmed');
      loadData();
    } catch (error) {
      console.error('Confirm medication error:', error);
      Alert.alert('Error', 'Failed to confirm medication');
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

  const renderMedicationItem = ({ item }: { item: Medication }) => (
    <View style={styles.medicationCard}>
      <View style={styles.medicationHeader}>
        <Text style={styles.medicationName}>{item.name}</Text>
      </View>
      
      {item.dosage && (
        <Text style={styles.medicationDosage}>Dosage: {item.dosage}</Text>
      )}
      
      {item.time_of_day && (
        <Text style={styles.schedule}>
          Time: {item.time_of_day}
          {item.days_of_week && item.days_of_week.length > 0 && (
            <Text> - {getDayNames(item.days_of_week)}</Text>
          )}
        </Text>
      )}
      
      {item.instructions && (
        <Text style={styles.instructions}>{item.instructions}</Text>
      )}
      
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => {
          // Navigate to edit medication screen
          Alert.alert('Edit', 'Edit medication functionality coming soon');
        }}
      >
        <Text style={styles.editButtonText}>Edit Schedule</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConfirmationItem = ({ item }: { item: any }) => (
    <View style={styles.confirmationCard}>
      <View style={styles.confirmationHeader}>
        <Text style={styles.confirmationTitle}>{item.medication_name}</Text>
        <Text style={styles.confirmationDate}>
          {new Date(item.taken_at).toLocaleDateString()}
        </Text>
      </View>
      
      <Text style={styles.confirmationMedication}>
        Taken by: {item.dependant_name}
      </Text>
      
      <Text style={styles.confirmationTime}>
        Time: {new Date(item.taken_at).toLocaleTimeString()}
      </Text>
      
      <TouchableOpacity
        style={styles.photoButton}
        onPress={() => {
          setSelectedPhotoUri(item.photo_path);
        }}
      >
        <Text style={styles.photoButtonText}>View Photo</Text>
      </TouchableOpacity>
      
      <View style={styles.confirmationActions}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => handleConfirmMedication(item.id)}
        >
          <Text style={styles.confirmButtonText}>Confirm Taking</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getDayNames = (days: number[]) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(day => dayNames[day]).join(', ');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Carer Dashboard</Text>
          {selectedDependant && dependants.length > 0 && (
            <Text style={styles.subtitle}>
              Managing: {dependants.find(d => d.id === selectedDependant)?.name}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'medications' && styles.activeTab]}
          onPress={() => setSelectedTab('medications')}
        >
          <Text style={[styles.tabText, selectedTab === 'medications' && styles.activeTabText]}>
            Medications
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'confirmations' && styles.activeTab]}
          onPress={() => setSelectedTab('confirmations')}
        >
          <Text style={[styles.tabText, selectedTab === 'confirmations' && styles.activeTabText]}>
            Confirmations
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'medications' && (
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add Medication</Text>
          </TouchableOpacity>

          <FlatList
            data={medications}
            renderItem={renderMedicationItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={loadData} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No medications added yet. Tap "Add Medication" to get started.
                </Text>
              </View>
            }
          />
        </View>
      )}

      {selectedTab === 'confirmations' && (
        <FlatList
          data={pendingConfirmations}
          renderItem={renderConfirmationItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadData} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No pending confirmations.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <AddMedicationModal
          onSave={handleAddMedication}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      <Modal
        visible={!!selectedPhotoUri}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedPhotoUri(null)}
      >
        <View style={styles.photoModalContainer}>
          <View style={styles.photoModalContent}>
            <Text style={styles.photoModalTitle}>Medication Photo</Text>
            {selectedPhotoUri && (
              <Image
                source={{ uri: selectedPhotoUri }}
                style={styles.photoModalImage}
                resizeMode="contain"
              />
            )}
            <View style={styles.photoModalActions}>
              <TouchableOpacity
                style={styles.photoModalCloseButton}
                onPress={() => setSelectedPhotoUri(null)}
              >
                <Text style={styles.photoModalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    padding: 10,
  },
  logoutText: {
    color: '#007AFF',
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  medicationDosage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  schedule: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  editButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  confirmationCard: {
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
  confirmationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  confirmationDate: {
    fontSize: 14,
    color: '#666',
  },
  confirmationMedication: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  confirmationTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  photoButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  photoButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  confirmationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  confirmButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  photoModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  photoModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  photoModalImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 15,
  },
  photoModalActions: {
    alignItems: 'center',
  },
  photoModalCloseButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  photoModalCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CarerDashboard;