# Database Functionality Guide

## Overview
The Digital Twin Planner now supports user-managed databases that allow government officials to upload and manage confidential data about houses and resources in their planning areas.

## Features

### 1. Database Management
- **Upload Databases**: Users can upload JSON files containing house and resource data
- **Share Databases**: Database owners can share their databases with other users via email
- **Delete Databases**: Owners can delete their databases (and remove them from the backend)
- **Collaborate**: Shared users can view and use database resources in their plans

### 2. Database Integration with Planning
- **Visual Display**: Database resources appear on the map with orange borders (distinguishing them from placed resources)
- **Read-Only**: Database resources are read-only and cannot be moved or deleted directly from the map
- **Automatic Updates**: When users place new houses, they are automatically added to the user's primary database
- **Removal Sync**: When database-sourced houses are removed, they're also removed from the database

### 3. House Data Collection
- **Resident Count**: When placing houses, users are prompted to enter the number of residents
- **Student Count**: Users also specify the number of students in the house
- **Database Sync**: This information is automatically synced to the user's database

## Database File Format

### Example JSON Structure
```json
[
  {
    "houseId": "H001",
    "latitude": 15.849683,
    "longitude": 74.494323,
    "residents": 4,
    "students": 0,
    "type": "house"
  },
  {
    "houseId": "H002", 
    "latitude": 15.85981,
    "longitude": 74.510949,
    "residents": 5,
    "students": 2,
    "type": "house"
  }
]
```

### Required Fields
- **houseId** or **id**: Unique identifier for the resource
- **latitude**: Latitude coordinate (number)
- **longitude**: Longitude coordinate (number)
- **type**: Resource type (default: "house")

### Optional Fields
- **residents**: Number of residents (for houses)
- **students**: Number of students (for houses)

## How to Use

### 1. Accessing Database Management
1. Log into the Digital Twin Planner
2. Go to Dashboard
3. Click on "Your Databases" quick action

### 2. Adding a Database
1. Click "Add Database" button
2. Provide a name for your database
3. Upload a JSON file with your data
4. Click "Add Database" to save

### 3. Sharing a Database
1. Find the database you want to share
2. Click "Share" button
3. Enter the email address of the user you want to share with
4. Click "Share Database"

### 4. Using Database Resources in Planning
1. Create a new plan or open an existing one
2. Database resources will automatically appear on the map with orange borders
3. Click on any database resource to see its details in a popup
4. When you place new houses, they'll be added to your primary database

### 5. Data Privacy and Security
- **Private by Default**: All databases are private to their owners
- **Explicit Sharing**: Data is only shared when explicitly granted via email
- **User Control**: Only database owners can share or delete databases
- **Firestore Security**: All data is stored securely in Firebase Firestore

## Technical Implementation

### Database Storage
- Databases are stored in Firestore collection: `databases`
- Each database document contains: name, userId, userEmail, data array, collaborators array
- Access is controlled through Firestore security rules

### Component Structure
- **Databases.jsx**: Main database management interface
- **databaseOperations.js**: Utility functions for database CRUD operations
- **PlanPage_old.jsx**: Modified to integrate database resources

### Integration Points
- Dashboard quick action links to database management
- Map displays both placed and database resources
- House placement form collects resident/student data
- Automatic synchronization between plans and databases

## Security Considerations
- Database access is restricted to owners and explicitly shared collaborators
- User email verification ensures proper access control
- No public access to private databases
- Data remains encrypted in transit and at rest

## Future Enhancements
- Support for additional resource types (schools, hospitals, etc.)
- Bulk import/export functionality
- Database versioning and history
- Advanced sharing permissions (read-only vs. edit access)
- API endpoints for programmatic access
