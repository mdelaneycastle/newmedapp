import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medication-reminders', {
        name: 'Medication Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#007AFF',
        sound: 'default',
      });
    }

    return true;
  }

  async scheduleMedicationReminder(
    medicationId: number,
    medicationName: string,
    time: string, // Format: "HH:MM"
    daysOfWeek: number[] // 0=Sunday, 1=Monday, etc.
  ): Promise<string[]> {
    const [hours, minutes] = time.split(':').map(Number);
    
    // Calculate notification time (5 minutes before)
    let notificationMinutes = minutes - 5;
    let notificationHours = hours;
    
    if (notificationMinutes < 0) {
      notificationMinutes += 60;
      notificationHours -= 1;
    }
    
    if (notificationHours < 0) {
      notificationHours += 24;
    }

    const notificationIds: string[] = [];

    // Schedule notification for each day
    for (const dayOfWeek of daysOfWeek) {
      const trigger = {
        hour: notificationHours,
        minute: notificationMinutes,
        weekday: dayOfWeek + 1, // Expo uses 1=Sunday, 2=Monday, etc.
        repeats: true,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Medication Reminder',
          body: `Time to take your ${medicationName} in 5 minutes!`,
          data: {
            medicationId,
            medicationName,
            scheduledTime: time,
            type: 'medication_reminder',
          },
          sound: 'default',
        },
        trigger,
      });

      notificationIds.push(notificationId);
    }

    console.log(`Scheduled ${notificationIds.length} notifications for ${medicationName}`);
    return notificationIds;
  }

  async cancelNotifications(notificationIds: string[]): Promise<void> {
    await Notifications.cancelScheduledNotificationsAsync(notificationIds);
    console.log(`Cancelled ${notificationIds.length} notifications`);
  }

  async cancelAllMedicationNotifications(): Promise<void> {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const medicationNotifications = scheduledNotifications.filter(
      notification => notification.content.data?.type === 'medication_reminder'
    );
    
    const ids = medicationNotifications.map(notification => notification.identifier);
    await this.cancelNotifications(ids);
  }

  async rescheduleAllMedications(medications: Array<{
    id: number;
    name: string;
    time_of_day: string;
    days_of_week: number[];
  }>): Promise<void> {
    // Cancel all existing medication notifications
    await this.cancelAllMedicationNotifications();

    // Schedule new notifications for all medications
    for (const medication of medications) {
      if (medication.time_of_day && medication.days_of_week) {
        await this.scheduleMedicationReminder(
          medication.id,
          medication.name,
          medication.time_of_day,
          medication.days_of_week
        );
      }
    }
  }

  // Handle notification received while app is running
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Handle notification tapped (app opened from notification)
  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export default new NotificationService();