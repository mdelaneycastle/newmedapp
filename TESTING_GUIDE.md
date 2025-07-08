# Testing Guide for Medication Reminder App

## Quick Start (For Beginners)

### Step 1: Start the Backend Server
Open Terminal and navigate to your project:
```bash
cd /Users/appleone/Documents/claude/medication-app/backend
npm run dev
```

You should see: "Server running on port 3000"

### Step 2: Start the Mobile App
Open a **new Terminal window** (keep the first one running) and run:
```bash
cd /Users/appleone/Documents/claude/medication-app
npm start
```

This will show a QR code.

### Step 3: Install Expo Go App
1. Download "Expo Go" from the App Store (iOS) or Google Play Store (Android)
2. Open the app and scan the QR code from your Terminal

### Step 4: Test the App

#### Create Test Accounts:
1. **Create a Carer account:**
   - Tap "Don't have an account? Sign Up"
   - Enter: Name, Email, Password
   - Select "Carer/Family member"
   - Tap "Create Account"

2. **Create a Dependant account:**
   - Logout from the carer account
   - Tap "Don't have an account? Sign Up"
   - Enter: Different Name, Email, Password
   - Select "Person taking medication"
   - Tap "Create Account"

#### Test Carer Features:
1. Login as the carer
2. Tap "Add Medication"
3. Fill in:
   - Medication Name: "Aspirin"
   - Dosage: "100mg"
   - Instructions: "Take with food"
   - Set time: "09:00"
   - Select days: Monday to Friday
4. Tap "Save"

#### Test Dependant Features:
1. Login as the dependant
2. You should see the medication added by the carer
3. Tap "Take Medication"
4. The camera will open
5. Take a photo of something (pretend it's medication)
6. Tap "Confirm"

#### Test Photo Review (Carer):
1. Login as the carer
2. Tap "Confirmations" tab
3. You should see the photo submitted by the dependant
4. Tap "View Photo" to see the image
5. Tap "Confirm" to approve

## Troubleshooting

### If the backend won't start:
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL if needed
brew services start postgresql@14

# Make sure you're in the right directory
cd /Users/appleone/Documents/claude/medication-app/backend
```

### If you can't connect to the database:
```bash
# Test database connection
export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"
psql -d medication_app -c "SELECT version();"
```

### If the mobile app won't load:
1. Make sure both Terminal windows are running
2. Try refreshing the Expo Go app
3. Check that your phone and computer are on the same WiFi network

### If you see "Network Error":
1. Check that the backend server is running (Step 1)
2. Try restarting both servers
3. Make sure port 3000 is not blocked

## Features to Test

### ✅ Authentication
- [ ] Register as carer
- [ ] Register as dependant  
- [ ] Login as carer
- [ ] Login as dependant
- [ ] Logout

### ✅ Carer Features
- [ ] Add medication with schedule
- [ ] View medications list
- [ ] See pending photo confirmations
- [ ] Approve/reject photo confirmations

### ✅ Dependant Features
- [ ] View medication schedule
- [ ] See overdue medications (red highlight)
- [ ] Take photo of medication
- [ ] Submit photo for review

### ✅ Security Features
- [ ] Camera only works in real-time (no gallery access)
- [ ] Different users see different data
- [ ] Cannot access other user's medications

## Next Steps

Once you've tested the basic functionality:

1. **Add Multiple Medications**: Test with different schedules
2. **Test Overdue Logic**: Set a medication time in the past
3. **Test Multiple Users**: Create multiple carer-dependant pairs
4. **Test Photo Quality**: Try different lighting conditions
5. **Test Edge Cases**: Empty fields, invalid times, etc.

## Common Issues

- **"Cannot connect to server"**: Make sure backend is running on port 3000
- **"Database connection failed"**: Check PostgreSQL is running
- **"Camera not working"**: Grant camera permissions in Expo Go
- **"QR code not scanning"**: Make sure phone and computer are on same network

Need help? Check the main README.md for more detailed setup instructions.