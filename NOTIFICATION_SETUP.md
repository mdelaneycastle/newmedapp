# 📱 Medication Notification Setup

## 🎯 What's Implemented:

✅ **5-minute early reminders** for all medication times
✅ **Automatic scheduling** when medications are added/updated  
✅ **Smart rescheduling** when carers modify schedules
✅ **Permission handling** with user-friendly prompts
✅ **Daily recurring** notifications for all scheduled days

## 📱 Testing Notifications:

### **1. Test Immediately:**
1. **Login as dependant** (dependant@example.com / password123)
2. **Tap the 🔔 bell icon** in the top right
3. **Wait 10 seconds** - you'll get a test notification!

### **2. Test Real Medication Reminders:**

**For Lamotrigine (9:00 AM daily):**
- Notification will fire at **8:55 AM** every day
- Message: "💊 Time to take your Lamotrigine in 5 minutes!"

**For Paracetamol (2:00 PM daily):** 
- Notification will fire at **1:55 PM** every day
- Message: "💊 Time to take your Paracetamol in 5 minutes!"

### **3. Test Notification Handling:**
- **App closed**: Notification appears on lock screen
- **App open**: Notification appears as banner + alert
- **Tap notification**: Opens app with medication reminder alert

## 🔧 How It Works:

### **Automatic Scheduling:**
- **Dependant login**: Schedules notifications for all their medications
- **Carer adds medication**: Automatically schedules notifications
- **Carer updates schedule**: Cancels old notifications, schedules new ones

### **Smart Timing:**
- **5 minutes before** each scheduled medication time
- **Recurring daily** for medications taken every day
- **Specific days** for medications with custom schedules

### **Permission Handling:**
- **First launch**: Requests notification permissions
- **Denied**: Shows helpful message to enable in settings
- **Physical device required**: Simulators won't get real notifications

## 🎛️ Notification Details:

**Title**: "💊 Medication Reminder"
**Body**: "Time to take your [MedicationName] in 5 minutes!"
**Sound**: Default notification sound
**Vibration**: Standard pattern (Android)
**Badge**: No badge updates
**Channel**: "Medication Reminders" (Android)

## 🔍 Testing Schedule:

If it's currently **2:30 PM** and you have medications at:
- **Lamotrigine**: 9:00 AM tomorrow → Notification at 8:55 AM tomorrow
- **Paracetamol**: 2:00 PM tomorrow → Notification at 1:55 PM tomorrow

**Want to test sooner?** Use the 🔔 test button for an immediate notification!

## 🚨 Troubleshooting:

**No notifications appearing?**
1. Check device notification permissions
2. Ensure you're on a physical device (not simulator)
3. Check notification settings for the app
4. Try the test button first

**Notifications not stopping?**
- Notifications auto-cancel when you take and confirm medication
- Or when carer updates the medication schedule