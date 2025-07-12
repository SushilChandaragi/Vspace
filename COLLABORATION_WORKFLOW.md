# Digital Twin Planner - Collaboration Workflow Test

## Overview
This document outlines the collaboration workflow and tests for the Digital Twin Planner application.

## Features Implemented

### 1. Collaboration System
- **Real-time collaboration** using Firestore listeners
- **Permission-based access** (Owner, Collaborator, Public)
- **Live plan updates** across multiple users
- **Collaboration status indicators**

### 2. Security & Access Control
- **Firestore Security Rules** implemented
- **User authentication** required for all operations
- **Role-based permissions** (Owner vs Collaborator)
- **Protected routes** for authenticated users only

### 3. Plan Management
- **Create new plans** with collaboration support
- **Edit existing plans** (with permission checks)
- **Real-time synchronization** across sessions
- **Plan sharing** via collaborators field

## Workflow Test Steps

### Step 1: User Authentication
1. Navigate to `/login`
2. Sign in with valid credentials
3. Verify authentication state
4. Check redirect to dashboard

### Step 2: Create New Plan
1. Go to Dashboard
2. Click "Create New Plan"
3. Select location method (current location or pincode)
4. Navigate to plan page
5. Add resources to the map
6. Save the plan
7. Verify plan appears in saved plans

### Step 3: Load Existing Plan
1. Go to Saved Plans
2. Select a plan to edit
3. Verify plan loads correctly
4. Check collaboration status (Owner/Collaborator)
5. Verify edit permissions

### Step 4: Test Collaboration Features
1. **Owner Access**: Full edit permissions
2. **Collaborator Access**: Edit permissions (if added to collaborators array)
3. **Unauthorized Access**: No access (should redirect)
4. **Public Plans**: Read-only access for everyone

### Step 5: Real-time Updates
1. Open same plan in multiple browser tabs/windows
2. Make changes in one tab
3. Verify changes appear in other tabs
4. Check collaboration indicators

## Firestore Rules Compatibility

### Rules Structure
```javascript
// Plans collection rules
match /plans/{planId} {
  // Read: Owner or Collaborator
  allow read: if request.auth != null && (
    resource.data.userId == request.auth.uid ||
    resource.data.collaborators != null && 
    request.auth.token.email in resource.data.collaborators
  );
  
  // Create: Authenticated users
  allow create: if request.auth != null && 
    request.auth.uid == resource.data.userId;
  
  // Update: Owner or Collaborator
  allow update: if request.auth != null && (
    resource.data.userId == request.auth.uid ||
    (resource.data.collaborators != null && 
     request.auth.token.email in resource.data.collaborators)
  );
  
  // Delete: Owner only
  allow delete: if request.auth != null && 
    resource.data.userId == request.auth.uid;
}
```

### Data Structure
```javascript
{
  planName: "String",
  userId: "String", // Owner's UID
  userEmail: "String", // Owner's email
  collaborators: ["email1", "email2"], // Array of collaborator emails
  isPublic: false, // Boolean for public access
  center: { lat: Number, lng: Number },
  resources: [/* Resource objects */],
  createdAt: "ISO String",
  lastModified: "ISO String",
  lastModifiedBy: "String" // UID of last modifier
}
```

## Error Handling

### Common Issues & Solutions
1. **Authentication Errors**: Check Firebase auth configuration
2. **Permission Denied**: Verify user is in collaborators array
3. **Real-time Updates Not Working**: Check Firestore listeners
4. **Save Failures**: Verify Firestore rules allow the operation

## Testing Commands

### Browser Console Tests
```javascript
// Test collaboration functions
testCollaborationWorkflow();
testFirestoreRules();
```

### Manual Testing Checklist
- [ ] User can log in successfully
- [ ] Dashboard loads with user data
- [ ] New plan creation works
- [ ] Plan loading from saved plans works
- [ ] Resource placement and editing works
- [ ] Plan saving works (create and update)
- [ ] Collaboration status indicators appear
- [ ] Real-time updates work
- [ ] Permission checks work correctly
- [ ] Unauthorized access is blocked

## Performance Considerations
- Firestore listeners are properly cleaned up
- Real-time updates are throttled to prevent excessive updates
- Large datasets are paginated where necessary
- Offline support can be added for better UX

## Next Steps
1. Add collaboration invitation system
2. Implement plan sharing via links
3. Add version history for plans
4. Implement conflict resolution for simultaneous edits
5. Add chat/comments for collaborators
