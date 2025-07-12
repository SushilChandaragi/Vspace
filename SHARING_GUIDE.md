# Digital Twin Planner - Sharing and Collaboration Guide

## Overview
The Digital Twin Planner now supports real-time collaboration and sharing features. You can share your plans with others and work together on the same plan simultaneously.

## Features

### 1. Authentication and Access Control
- **Firebase Authentication**: Users must log in to create and edit plans
- **Public Plans**: Plans can be made public for anyone to view
- **Private Plans**: Only the owner and collaborators can access private plans
- **Role-based Access**: Different permissions for owners, collaborators, and viewers

### 2. Plan Access Levels

#### Owner (👑 Owner)
- Full control over the plan
- Can edit all aspects of the plan
- Can invite collaborators
- Can toggle public/private status
- Can delete the plan

#### Collaborator (✏️ Collaborator)
- Can edit the plan in real-time
- Can view all plan details
- Cannot invite other collaborators
- Cannot change sharing settings

#### Public Viewer (👁️ Public View)
- Can view public plans without logging in
- Cannot edit or modify the plan
- Can see plan details and resources
- Suggested to log in for collaboration

### 3. Sharing Workflow

#### To Share a Plan:
1. Go to "Saved Plans" from the dashboard
2. Find the plan you want to share
3. Click the "Share" button next to the plan
4. In the Share Modal:
   - **Add Collaborators**: Enter email addresses of users you want to collaborate with
   - **Toggle Public/Private**: Make the plan public for anyone to view
   - **Copy Link**: Get a shareable link to send to others

#### To Access a Shared Plan:
1. **Via Link**: Click on the shared link (e.g., `http://localhost:5182/plan?id=PLAN_ID`)
2. **Public Plans**: Can be viewed by anyone, even without logging in
3. **Private Plans**: Must be logged in and have permission to access

### 4. Real-time Collaboration

#### Features:
- **Live Updates**: See changes from other collaborators instantly
- **Resource Synchronization**: Resources placed by others appear in real-time
- **Plan State Sync**: All plan modifications are synchronized across users
- **Conflict Resolution**: Firebase handles concurrent edits gracefully

#### How It Works:
1. Multiple users can open the same plan simultaneously
2. Changes made by one user are immediately visible to others
3. Resource placements, deletions, and modifications sync in real-time
4. Plan title and location updates are synchronized

### 5. User Interface Elements

#### Access Level Indicators:
- **Green Badge (👑 Owner)**: You own this plan
- **Yellow Badge (✏️ Collaborator)**: You can edit this plan
- **Blue Badge (👁️ Public View)**: You're viewing a public plan

#### Interactive Elements:
- **Resource Panel**: Only visible to users who can edit
- **Save Button**: Only visible to users who can edit
- **Login Suggestion**: Shown to unauthenticated users viewing public plans

### 6. Security and Privacy

#### Firestore Security Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /plans/{planId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.userEmail == request.auth.token.email ||
         request.auth.token.email in resource.data.collaborators);
      allow read: if resource.data.isPublic == true;
    }
  }
}
```

#### Privacy Controls:
- **Private by Default**: New plans are private
- **Owner Control**: Only owners can change sharing settings
- **Collaborator Management**: Only owners can add/remove collaborators
- **Public Toggle**: Easy switch between public and private

### 7. Technical Implementation

#### Components:
- **PlanPage_old.jsx**: Main planning interface with collaboration support
- **SimpleCollaboration.jsx**: Real-time collaboration UI
- **ShareModal.jsx**: Sharing interface and controls
- **SavedPlans.jsx**: Plan management with sharing options

#### Utilities:
- **simpleCollaboration.js**: Collaboration logic and Firebase integration
- **savePlanToFirestore.js**: Plan saving and updating functionality

#### Key Technologies:
- **Firebase Firestore**: Real-time database for plan storage
- **Firebase Auth**: User authentication and authorization
- **React**: Frontend framework with hooks for state management
- **Real-time Listeners**: Firebase onSnapshot for live updates

### 8. Usage Examples

#### Example 1: Creating and Sharing a Public Plan
1. Create a new plan and add resources
2. Save the plan with a descriptive name
3. Go to "Saved Plans" and click "Share"
4. Toggle "Public" to make it viewable by anyone
5. Copy the link and share it with others

#### Example 2: Collaborating on a Private Plan
1. Create a plan and save it
2. Go to "Saved Plans" and click "Share"
3. Add collaborator email addresses
4. Send the link to collaborators
5. Collaborators can now edit the plan in real-time

#### Example 3: Viewing a Public Plan
1. Receive a shared link from someone
2. Click the link (no login required for public plans)
3. View the plan and all its resources
4. Optionally log in to become a collaborator

### 9. Troubleshooting

#### Common Issues:

**"This is a private plan. Please log in to access it."**
- Solution: The plan is private and requires authentication. Log in with an account that has access.

**"You don't have permission to access this private plan."**
- Solution: Ask the plan owner to add your email as a collaborator.

**"Plan not found."**
- Solution: Check if the link is correct or if the plan has been deleted.

**Authentication Issues:**
- Solution: Clear browser cache and log in again, or check if your account has proper permissions.

#### Tips for Better Collaboration:
1. **Communicate**: Use external communication tools alongside the planner
2. **Plan Structure**: Agree on resource placement strategies before collaborating
3. **Regular Saves**: Save frequently to ensure changes are preserved
4. **Access Management**: Regularly review who has access to your plans

### 10. Future Enhancements

Planned features for future versions:
- **Chat Integration**: Built-in messaging for collaborators
- **Version History**: Track changes and revert to previous versions
- **Export Options**: Export plans in various formats
- **Advanced Permissions**: Fine-grained access control
- **Notifications**: Email notifications for plan changes

## Support

For technical issues or questions about the sharing and collaboration features, please contact the development team or check the project documentation.

---

*This guide covers the current implementation of sharing and collaboration features in the Digital Twin Planner. Features and interfaces may evolve in future updates.*
