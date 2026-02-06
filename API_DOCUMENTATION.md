# EPICS Backend API Documentation

Base URL: `http://localhost:5000/api`

---

## Authentication Endpoints

### 1. Signup
**POST** `/auth/signup`

Creates a new user account with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "johndoe",
  "phone": "+919876543210"  // optional
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "user@example.com",
    "username": "johndoe",
    "phone": "+919876543210",
    "rolePreference": "both",
    "points": 0,
    "level": 1
  }
}
```

**Error Responses:**
- `400`: Email, password, and username are required
- `400`: User with this email or username already exists

---

### 2. Login
**POST** `/auth/login`

Authenticates an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "user@example.com",
    "username": "johndoe",
    "phone": "+919876543210",
    "phoneVerified": false,
    "profilePhoto": null,
    "rolePreference": "both",
    "points": 0,
    "level": 1,
    "certificateLevel": "none"
  }
}
```

**Error Responses:**
- `400`: Email and password are required
- `400`: Invalid credentials

---

### 3. Guest Login
**POST** `/auth/guest`

Creates an anonymous guest session with limited features.

**Request Body:** None required

**Success Response (201):**
```json
{
  "message": "Guest session created",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "username": "guest_a1b2c3d4",
    "isGuest": true,
    "rolePreference": "requester"
  },
  "notice": "Guest accounts have limited features. Register to unlock full functionality."
}
```

---

### 4. Send Phone OTP
**POST** `/auth/send-otp`

Sends OTP to phone number for verification.

**Headers:** `Authorization: Bearer <token>` (optional)

**Request Body:**
```json
{
  "phone": "+919876543210"
}
```

**Success Response (200):**
```json
{
  "message": "OTP sent successfully",
  "phone": "+919876543210",
  "expiresAt": "2026-02-05T11:30:00.000Z",
  "otp": "123456"  // Only in development mode
}
```

**Error Responses:**
- `400`: Phone number is required
- `400`: Invalid phone number format

---

### 5. Verify Phone OTP
**POST** `/auth/verify-otp`

Verifies the OTP sent to phone.

**Headers:** `Authorization: Bearer <token>` (optional)

**Request Body:**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "message": "Phone verified successfully",
  "verified": true
}
```

**Error Responses:**
- `400`: Phone and OTP are required
- `400`: No pending OTP found for this phone
- `400`: OTP expired
- `400`: Invalid OTP

---

### 6. Refresh Token
**POST** `/auth/refresh-token`

Get new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 7. Google OAuth
**POST** `/auth/google`

Login/signup with Google.

**Request Body:**
```json
{
  "googleId": "115789012345678901234",
  "email": "user@gmail.com",
  "name": "John Doe",
  "profilePhoto": "https://lh3.googleusercontent.com/..."
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "user@gmail.com",
    "username": "user_a1b2",
    "profilePhoto": "https://lh3.googleusercontent.com/...",
    "points": 0,
    "level": 1
  }
}
```

---

### 8. Apple OAuth
**POST** `/auth/apple`

Login/signup with Apple.

**Request Body:**
```json
{
  "appleId": "001234.abcdef123456.7890",
  "email": "user@privaterelay.appleid.com",  // optional
  "name": "John Doe"  // optional
}
```

**Success Response (200):**
```json
{
  "message": "Apple authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "user@privaterelay.appleid.com",
    "username": "user_a1b2",
    "points": 0,
    "level": 1
  }
}
```

---

### 9. Logout
**POST** `/auth/logout`

Logout user (client should clear tokens).

**Headers:** `Authorization: Bearer <token>` (required)

**Success Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## User Management Endpoints

> **Note:** All user endpoints require `Authorization: Bearer <token>` header

---

### 10. Get Profile
**GET** `/users/profile`

Get current user's full profile.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "user": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "user@example.com",
    "username": "johndoe",
    "phone": "+919876543210",
    "phoneVerified": true,
    "profilePhoto": "/uploads/profiles/abc123.jpg",
    "bio": "Helping my community",
    "primaryLanguage": "en",
    "rolePreference": "both",
    "isGuest": false,
    "location": {
      "type": "Point",
      "coordinates": [77.5946, 12.9716],
      "address": "MG Road, Bangalore",
      "city": "Bangalore"
    },
    "idVerified": true,
    "verificationMethod": "phone",
    "points": 150,
    "level": 3,
    "badges": ["reliable_helper"],
    "certificateLevel": "silver",
    "tasksHelped": 15,
    "tasksRequested": 5,
    "averageRating": 4.8,
    "totalReviews": 12,
    "trustedContacts": [
      { "name": "Mom", "phone": "+919876543211" }
    ],
    "notificationsEnabled": true,
    "visibilityRadius": 10,
    "createdAt": "2026-01-15T10:30:00.000Z"
  }
}
```

---

### 11. Update Profile
**PUT** `/users/profile`

Update user profile fields.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "username": "johndoe_updated",
  "bio": "Love helping my community!",
  "primaryLanguage": "hi",
  "rolePreference": "helper",
  "notificationsEnabled": true,
  "visibilityRadius": 15
}
```

**Success Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

---

### 12. Upload Profile Photo
**POST** `/users/profile/photo`

Upload profile photo.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body:** Form data with field `photo` (image file, max 5MB)

**Success Response (200):**
```json
{
  "message": "Profile photo uploaded successfully",
  "profilePhoto": "/uploads/profiles/65a1b2c3_abc123.jpg"
}
```

---

### 13. Get Public Profile
**GET** `/users/:userId`

Get another user's public profile.

**Headers:** `Authorization: Bearer <token>`

**URL Params:** `userId` - The user ID

**Success Response (200):**
```json
{
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "username": "johndoe",
    "profilePhoto": "/uploads/profiles/abc123.jpg",
    "bio": "Helping my community",
    "points": 150,
    "level": 3,
    "badges": ["reliable_helper"],
    "certificateLevel": "silver",
    "tasksHelped": 15,
    "averageRating": 4.8,
    "totalReviews": 12,
    "idVerified": true,
    "createdAt": "2026-01-15T10:30:00.000Z"
  }
}
```

---

### 14. Update Location
**PUT** `/users/location`

Update user's current location (for helpers).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "address": "MG Road, Bangalore",
  "city": "Bangalore"
}
```

**Success Response (200):**
```json
{
  "message": "Location updated successfully",
  "location": {
    "type": "Point",
    "coordinates": [77.5946, 12.9716],
    "address": "MG Road, Bangalore",
    "city": "Bangalore"
  },
  "locationUpdatedAt": "2026-02-05T11:30:00.000Z"
}
```

---

### 15. Verify Identity
**POST** `/users/verify-identity`

Submit ID verification.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "method": "aadhar",
  "details": {
    "last4Digits": "1234"
  }
}
```

**Valid methods:** `aadhar`, `phone`, `college_id`

**Success Response (200):**
```json
{
  "message": "Identity verification submitted successfully",
  "idVerified": true,
  "verificationMethod": "aadhar"
}
```

---

### 16. Get Trusted Contacts
**GET** `/users/trusted-contacts`

Get emergency trusted contacts.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "trustedContacts": [
    { "name": "Mom", "phone": "+919876543211" },
    { "name": "Dad", "phone": "+919876543212" }
  ]
}
```

---

### 17. Update Trusted Contacts
**PUT** `/users/trusted-contacts`

Update emergency trusted contacts (max 5).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "contacts": [
    { "name": "Mom", "phone": "+919876543211" },
    { "name": "Dad", "phone": "+919876543212" }
  ]
}
```

**Success Response (200):**
```json
{
  "message": "Trusted contacts updated successfully",
  "trustedContacts": [...]
}
```

---

### 18. Get Stats
**GET** `/users/stats`

Get user statistics and recent reviews.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "stats": {
    "points": 150,
    "level": 3,
    "tasksHelped": 15,
    "tasksRequested": 5,
    "averageRating": 4.8,
    "totalReviews": 12,
    "certificateLevel": "silver",
    "badges": ["reliable_helper"]
  },
  "recentReviews": [
    {
      "rating": 5,
      "comment": "Very helpful!",
      "reviewer": {
        "username": "jane",
        "profilePhoto": "/uploads/profiles/jane.jpg"
      },
      "task": {
        "title": "Help with groceries"
      },
      "createdAt": "2026-02-01T10:30:00.000Z"
    }
  ]
}
```

---

### 19. Update FCM Token
**PUT** `/users/fcm-token`

Update Firebase Cloud Messaging token for push notifications.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "fcmToken": "dGVzdC1mY20tdG9rZW4..."
}
```

**Success Response (200):**
```json
{
  "message": "FCM token updated successfully"
}
```

---

### 20. Convert Guest to User
**POST** `/users/convert-guest`

Convert guest account to full user account.

**Headers:** `Authorization: Bearer <token>` (guest token)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "johndoe"
}
```

**Success Response (200):**
```json
{
  "message": "Account converted successfully",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "user@example.com",
    "username": "johndoe",
    "isGuest": false,
    "rolePreference": "both"
  }
}
```

---

## Task Management Endpoints

> **Note:** All task endpoints require `Authorization: Bearer <token>` header. Guest users cannot create/modify tasks.

---

### 22. Create Task
**POST** `/tasks`

Create a new help request task.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Help with groceries",
  "description": "Need someone to help carry groceries from the store to my apartment",
  "category": "errands",
  "urgency": "normal",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "address": "MG Road, Bangalore",
  "city": "Bangalore",
  "scheduledFor": "2026-02-10T14:00:00.000Z",
  "estimatedDuration": 45,
  "maxHelpers": 1,
  "hideSensitiveDetails": false
}
```

**Valid Categories:** `elderly_assistance`, `disability_support`, `errands`, `home_help`, `transport`, `tech_help`, `emergency`, `other`

**Valid Urgency:** `normal`, `urgent`, `sos`

**Success Response (201):**
```json
{
  "message": "Task created successfully",
  "task": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "requester": "65a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Help with groceries",
    "description": "Need someone to help carry groceries...",
    "category": "errands",
    "urgency": "normal",
    "location": {
      "type": "Point",
      "coordinates": [77.5946, 12.9716],
      "address": "MG Road, Bangalore",
      "city": "Bangalore"
    },
    "status": "open",
    "pointsReward": 10,
    "createdAt": "2026-02-06T11:30:00.000Z"
  }
}
```

---

### 23. Get Task
**GET** `/tasks/:taskId`

Get details of a specific task.

**Headers:** `Authorization: Bearer <token>`

**URL Params:** `taskId` - The task ID

**Success Response (200):**
```json
{
  "task": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "requester": {
      "username": "johndoe",
      "profilePhoto": "/uploads/profiles/abc.jpg",
      "averageRating": 4.8,
      "phoneVerified": true,
      "idVerified": true
    },
    "assignedHelper": null,
    "title": "Help with groceries",
    "description": "...",
    "category": "errands",
    "urgency": "normal",
    "location": { ... },
    "status": "open",
    "pointsReward": 10,
    "applicationCount": 3
  }
}
```

---

### 24. Get My Tasks
**GET** `/tasks/my-tasks`

Get tasks created by the current user (as requester).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | - | Filter by status (open, in_progress, completed, etc.) |
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |

**Success Response (200):**
```json
{
  "tasks": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

### 25. Get Helping Tasks
**GET** `/tasks/helping`

Get tasks where the current user is assigned as a helper.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:** Same as Get My Tasks

**Success Response (200):**
```json
{
  "tasks": [...],
  "pagination": { ... }
}
```

---

### 26. Discover Nearby Tasks
**GET** `/tasks/discover`

Discover tasks near a location (for helpers to find work).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `latitude` | number | **required** | Latitude coordinate |
| `longitude` | number | **required** | Longitude coordinate |
| `radius` | number | 10 | Search radius in kilometers |
| `category` | string | - | Filter by category |
| `urgency` | string | - | Filter by urgency |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Success Response (200):**
```json
{
  "tasks": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "title": "Help elderly with groceries",
      "category": "elderly_assistance",
      "urgency": "urgent",
      "location": { ... },
      "requester": {
        "username": "granny_smith",
        "averageRating": 4.9,
        "idVerified": true
      },
      "pointsReward": 25,
      "distance": 2.3
    }
  ],
  "filters": {
    "latitude": "12.9716",
    "longitude": "77.5946",
    "radius": "10"
  }
}
```

---

### 27. Update Task
**PUT** `/tasks/:taskId`

Update a task (only by requester, only if status is 'open').

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Help with heavy groceries",
  "urgency": "urgent",
  "estimatedDuration": 60,
  "latitude": 12.9720,
  "longitude": 77.5950
}
```

**Success Response (200):**
```json
{
  "message": "Task updated successfully",
  "task": { ... }
}
```

---

### 28. Cancel Task
**POST** `/tasks/:taskId/cancel`

Cancel a task (by requester or assigned helper).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "reason": "No longer needed"
}
```

**Success Response (200):**
```json
{
  "message": "Task cancelled successfully",
  "task": { ... }
}
```

---

### 29. Report Dispute
**POST** `/tasks/:taskId/dispute`

Report a dispute on a task.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "reason": "Helper did not complete the task properly"
}
```

**Success Response (200):**
```json
{
  "message": "Dispute reported successfully. Our team will review it.",
  "task": { ... }
}
```

---

### 30. Update Task Status
**PATCH** `/tasks/:taskId/status`

Update task status (workflow transitions).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "in_progress"
}
```

**Valid Status Transitions:**
| From | To |
|------|-----|
| `open` | `pending_approval`, `cancelled` |
| `pending_approval` | `in_progress`, `open`, `cancelled` |
| `in_progress` | `helper_arrived`, `cancelled`, `disputed` |
| `helper_arrived` | `task_started`, `cancelled`, `disputed` |
| `task_started` | `pending_verification`, `cancelled`, `disputed` |
| `pending_verification` | `completed`, `disputed` |
| `completed` | `disputed` |

**Success Response (200):**
```json
{
  "message": "Task status updated to in_progress",
  "task": { ... }
}
```

---

### 31. Generate Completion OTP
**POST** `/tasks/:taskId/generate-otp`

Generate OTP for task completion verification (by requester).

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "message": "Completion OTP generated",
  "otp": "123456",
  "expiresIn": "10 minutes",
  "instruction": "Share this OTP with the helper to verify task completion"
}
```

---

### 32. Verify Task Completion
**POST** `/tasks/:taskId/verify-completion`

Verify task completion with OTP (by helper).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "message": "Task completed successfully!",
  "pointsEarned": 15,
  "task": { ... }
}
```

---

## Helper Matching System Endpoints

> **Note:** All help request endpoints require `Authorization: Bearer <token>` header. Guest users cannot apply or manage applications.

---

### 33. Apply to Task
**POST** `/help-requests/apply/:taskId`

Apply to help with a task (as helper).

**Headers:** `Authorization: Bearer <token>`

**URL Params:** `taskId` - The task ID to apply to

**Request Body:**
```json
{
  "message": "I would like to help with this task. I have experience with groceries.",
  "currentLatitude": 12.9750,
  "currentLongitude": 77.5980
}
```

**Success Response (201):**
```json
{
  "message": "Application submitted successfully",
  "helpRequest": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "taskId": "65a1b2c3d4e5f6g7h8i9j0k2",
    "taskTitle": "Help with groceries",
    "message": "I would like to help with this task...",
    "distance": "2.5 km",
    "estimatedArrival": "30 minutes",
    "status": "pending"
  }
}
```

**Error Responses:**
- `400`: Task is no longer accepting applications
- `400`: Cannot apply to your own task
- `400`: You have already applied to this task
- `404`: Task not found

---

### 34. Get Task Applications
**GET** `/help-requests/task/:taskId`

Get all applications for a specific task (requester only).

**Headers:** `Authorization: Bearer <token>`

**URL Params:** `taskId` - The task ID

**Success Response (200):**
```json
{
  "applications": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "helper": {
        "username": "john_helper",
        "profilePhoto": "/uploads/profiles/john.jpg",
        "averageRating": 4.8,
        "totalReviews": 25,
        "idVerified": true,
        "phoneVerified": true
      },
      "message": "I can help with this!",
      "distance": 2.5,
      "estimatedTimeMinutes": 30,
      "status": "pending",
      "createdAt": "2026-02-06T12:00:00.000Z"
    }
  ],
  "total": 3
}
```

---

### 35. Get My Applications
**GET** `/help-requests/my-applications`

Get all applications submitted by current user (as helper).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | - | Filter by status (pending, approved, rejected, cancelled) |
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |

**Success Response (200):**
```json
{
  "applications": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "task": {
        "title": "Help with groceries",
        "category": "errands",
        "urgency": "normal",
        "location": { ... },
        "status": "open",
        "pointsReward": 10
      },
      "message": "I can help!",
      "status": "pending",
      "createdAt": "2026-02-06T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

---

### 36. Approve Application
**POST** `/help-requests/:applicationId/approve`

Approve a helper's application (requester only).

**Headers:** `Authorization: Bearer <token>`

**URL Params:** `applicationId` - The application ID

**Success Response (200):**
```json
{
  "message": "Application approved successfully",
  "helpRequest": { ... },
  "assignedHelper": {
    "username": "john_helper",
    "phone": "+919876543210"
  }
}
```

**Error Responses:**
- `400`: Task already has maximum number of helpers
- `400`: Application is not in pending status
- `403`: Not authorized to approve this application
- `404`: Application not found

---

### 37. Reject Application
**POST** `/help-requests/:applicationId/reject`

Reject a helper's application (requester only).

**Headers:** `Authorization: Bearer <token>`

**URL Params:** `applicationId` - The application ID

**Request Body:**
```json
{
  "reason": "Looking for someone with more experience"
}
```

**Success Response (200):**
```json
{
  "message": "Application rejected",
  "helpRequest": { ... }
}
```

---

### 38. Cancel Application
**POST** `/help-requests/:applicationId/cancel`

Cancel own application (helper only).

**Headers:** `Authorization: Bearer <token>`

**URL Params:** `applicationId` - The application ID

**Success Response (200):**
```json
{
  "message": "Application cancelled successfully"
}
```

**Error Responses:**
- `400`: Can only cancel pending applications
- `403`: Not authorized to cancel this application

---

### 39. Update Helper Location
**PUT** `/help-requests/:applicationId/location`

Update current location for ETA tracking (approved helpers only).

**Headers:** `Authorization: Bearer <token>`

**URL Params:** `applicationId` - The application ID

**Request Body:**
```json
{
  "latitude": 12.9730,
  "longitude": 77.5950
}
```

**Success Response (200):**
```json
{
  "message": "Location updated successfully",
  "distance": "1.2 km",
  "eta": "15 minutes"
}
```

**Error Responses:**
- `400`: Can only update location for approved applications
- `403`: Not authorized to update this application

---

## Health Check

### 21. Health Check
**GET** `/health`

Check server status.

**Success Response (200):**
```json
{
  "message": "Server is running",
  "timestamp": "2026-02-05T11:20:47.000Z",
  "version": "1.0.0"
}
```

---

## Testing with cURL

### Quick Test Commands

```bash
# Health check
curl http://localhost:5000/api/health

# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","username":"testuser"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Guest login
curl -X POST http://localhost:5000/api/auth/guest

# Get profile (replace TOKEN)
curl http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer TOKEN"

# Update location (replace TOKEN)
curl -X PUT http://localhost:5000/api/users/location \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude":12.9716,"longitude":77.5946,"address":"MG Road","city":"Bangalore"}'
```

---

## Error Response Format

All errors follow this format:
```json
{
  "message": "Error description"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (token missing/invalid)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error
