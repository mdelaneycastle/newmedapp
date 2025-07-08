# Medication Reminder App

A React Native app built with Expo that helps carers manage medications for their dependants with photo confirmation.

## Features

### For Carers
- **Account Management**: Register and login as a carer
- **Medication Management**: Add medications with custom schedules
- **Schedule Configuration**: Set specific times and days for each medication
- **Photo Review**: Review photos submitted by dependants
- **Confirmation System**: Approve that medications have been taken correctly

### For Dependants
- **Account Management**: Register and login as a dependant
- **Medication Reminders**: View scheduled medications and overdue alerts
- **Photo Confirmation**: Take photos of medications being taken
- **Real-time Camera**: Built-in camera prevents using old photos from gallery
- **Schedule Updates**: Receive notifications when carers update medication schedules

## Tech Stack

### Frontend (React Native/Expo)
- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe development
- **React Navigation**: Screen navigation
- **Expo Camera**: Camera functionality
- **AsyncStorage**: Local data storage

### Backend (Node.js)
- **Express**: Web server framework
- **TypeScript**: Type-safe development
- **PostgreSQL**: Database
- **JWT**: Authentication
- **bcrypt**: Password hashing
- **Multer**: File upload handling

## Project Structure

```
medication-app/
├── src/
│   ├── components/
│   │   ├── AddMedicationModal.tsx
│   │   └── CameraComponent.tsx
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── CarerDashboard.tsx
│   │   └── DependantDashboard.tsx
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   └── medications.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── server.ts
│   ├── database/
│   │   └── schema.sql
│   └── package.json
└── App.tsx
```

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database
- Expo CLI (`npm install -g @expo/cli`)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your database credentials and JWT secret

5. Set up the database:
   ```bash
   psql -U postgres -d medication_app -f database/schema.sql
   ```

6. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the project root:
   ```bash
   cd ..
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npm start
   ```

4. Use the Expo Go app on your phone to scan the QR code, or run on simulator:
   ```bash
   npm run ios  # for iOS simulator
   npm run android  # for Android emulator
   ```

## Database Schema

The app uses PostgreSQL with the following main tables:

- **users**: Stores carer and dependant accounts
- **medications**: Medication information
- **medication_schedules**: Timing and frequency of medications
- **medication_confirmations**: Photos and confirmation status
- **notifications**: System notifications
- **carer_dependant_relationships**: Links carers to their dependants

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Medications
- `GET /api/medications/dependant/:id` - Get medications for dependant (carer only)
- `GET /api/medications/mine` - Get own medications (dependant only)
- `POST /api/medications` - Create new medication (carer only)
- `PUT /api/medications/:id/schedule` - Update medication schedule (carer only)

## Security Features

1. **Role-based Authentication**: Separate access for carers and dependants
2. **JWT Tokens**: Secure API authentication
3. **Password Hashing**: bcrypt for password security
4. **Photo Verification**: Real-time camera prevents photo cheating
5. **Database Constraints**: Referential integrity and data validation

## Future Enhancements

- Push notifications for medication reminders
- Multiple dependant support for carers
- Medication history and analytics
- Integration with pharmacy systems
- Offline support for critical features
- Photo analysis for medication verification

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.