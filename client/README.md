# Community Helper - React Native Frontend

A comprehensive React Native mobile application for connecting elderly people with community volunteers for assistance.

## Features

### For Elderly Users
- Request help with various tasks (shopping, medical, household, etc.)
- Browse volunteer profiles and their ratings
- Post task details with location and reward
- Track helper progress in real-time
- Rate and review volunteers after task completion

### For Volunteers
- Browse available help requests in their area
- Apply to help elderly people
- Real-time location tracking
- Complete tasks and earn rewards/badges
- Build reputation through ratings

### Core Features
- **Authentication**: Signup, Login, OTP verification, Google/Apple Sign-In
- **Real-time Updates**: Socket.io integration for live notifications
- **Location Services**: Map integration and location tracking
- **Push Notifications**: Expo Notifications for alerts
- **Secure Storage**: Encrypted token and user data storage
- **State Management**: Zustand for global state management
- **Form Validation**: Formik + Yup for robust form handling

## Project Structure

```
client/
├── App.js                          # Root component
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── .env.example                    # Environment variables template
└── src/
    ├── config/
    │   └── api.js                 # Axios API instance
    ├── stores/
    │   ├── authStore.js           # Auth state management
    │   └── tasksStore.js          # Tasks state management
    ├── services/
    │   ├── authService.js         # Authentication API calls
    │   ├── taskService.js         # Task API calls
    │   ├── helpRequestService.js  # Help request API calls
    │   ├── userService.js         # User API calls
    │   ├── notificationService.js # Push notifications
    │   └── socketService.js       # Real-time updates
    ├── navigation/
    │   ├── AuthStack.js           # Auth navigation
    │   └── AppStack.js            # App navigation
    └── screens/
        ├── auth/
        │   ├── WelcomeScreen.js
        │   ├── LoginScreen.js
        │   ├── RegisterScreen.js
        │   ├── ForgotPasswordScreen.js
        │   └── VerifyOTPScreen.js
        └── app/
            ├── HomeScreen.js
            ├── TasksScreen.js
            ├── CreateTaskScreen.js
            ├── TaskDetailScreen.js
            ├── MyApplicationsScreen.js
            ├── ProfileScreen.js
            ├── NotificationsScreen.js
            ├── ChatScreen.js
            ├── EditProfileScreen.js
            └── VolunteerDetailScreen.js
```

## Installation

### Prerequisites
- Node.js 16+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Steps

1. **Clone and navigate to client folder**
   ```bash
   cd epic-backend/client
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Create .env file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:5000/api
   EXPO_PUBLIC_SOCKET_URL=http://localhost:5000
   ```

5. **Start the app**
   ```bash
   # Web
   npm run web

   # iOS
   npm run ios

   # Android
   npm run android

   # Start Expo
   npm start
   ```

## Key Dependencies

- **react-native**: Mobile app framework
- **expo**: React Native framework with pre-built modules
- **react-navigation**: Navigation library
- **zustand**: State management
- **axios**: HTTP client
- **formik & yup**: Form validation
- **socket.io-client**: Real-time communication
- **react-native-vector-icons**: Icon library
- **expo-secure-store**: Secure token storage
- **expo-location**: Geolocation services
- **expo-notifications**: Push notifications

## API Integration

The app connects to the backend API at the configured URL. Key endpoints:

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/guest` - Guest login
- `POST /auth/send-otp` - Send OTP
- `POST /auth/verify-otp` - Verify OTP

### Tasks
- `GET /tasks` - Get available tasks
- `POST /tasks` - Create new task
- `GET /tasks/:id` - Get task details
- `POST /help-requests/apply/:taskId` - Apply to task
- `GET /help-requests/my-applications` - Get user applications

## State Management

The app uses Zustand for global state:

- **authStore**: User authentication and profile
- **tasksStore**: Tasks and applications

## Real-time Features

Socket.io is used for:
- Live task notifications
- Application status updates
- Location tracking
- Chat messages

## Development Tips

1. **Debug Console**: Use Expo DevTools to view console logs
2. **API Testing**: Use the backend at `http://localhost:5000`
3. **Mock Data**: Tasks and users are fetched from the backend
4. **Secure Storage**: Tokens are stored securely using Expo SecureStore

## Building for Production

### For iOS
```bash
eas build --platform ios
```

### For Android
```bash
eas build --platform android
```

## Troubleshooting

### Issue: Cannot connect to backend
- Verify backend is running on the correct port
- Check `.env` file has correct API URL
- For Android emulator, use `10.0.2.2` instead of `localhost`

### Issue: Notifications not working
- Ensure permissions are granted
- Check Expo push token is set up

### Issue: Socket connection fails
- Verify Socket.io server is running
- Check CORS configuration on backend

## License

MIT

## Support

For issues or questions, contact the development team.
