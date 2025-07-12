// Test workflow for collaboration features

import { auth, db } from '../firebase';
import { canAccessPlan, getPlanSharingStatus } from '../utils/simpleCollaboration';
import { savePlanToFirestore } from '../utils/savePlanToFirestore';

// Test plan data
const testPlan = {
  planName: "Test Collaboration Plan",
  center: { lat: 15.8497, lng: 74.4977 },
  resources: [
    {
      type: "school",
      name: "Test School",
      lat: 15.8497,
      lng: 74.4977,
      radius: 800
    }
  ],
  userId: "test-user-id",
  userEmail: "test@example.com",
  collaborators: ["collaborator@example.com"],
  isPublic: false
};

// Test functions
export const testCollaborationWorkflow = () => {
  console.log("Testing collaboration workflow...");
  
  // Test 1: Owner access
  const ownerAccess = canAccessPlan(testPlan, "test@example.com", "test-user-id");
  console.log("Owner access:", ownerAccess); // Should be true
  
  // Test 2: Collaborator access
  const collaboratorAccess = canAccessPlan(testPlan, "collaborator@example.com", "other-user-id");
  console.log("Collaborator access:", collaboratorAccess); // Should be true
  
  // Test 3: Unauthorized access
  const unauthorizedAccess = canAccessPlan(testPlan, "unauthorized@example.com", "other-user-id");
  console.log("Unauthorized access:", unauthorizedAccess); // Should be false
  
  // Test 4: Public plan access
  const publicPlan = { ...testPlan, isPublic: true };
  const publicAccess = canAccessPlan(publicPlan, "anyone@example.com", "any-user-id");
  console.log("Public access:", publicAccess); // Should be true
  
  // Test 5: Sharing status
  const sharingStatus = getPlanSharingStatus(testPlan, "collaborator@example.com", "other-user-id");
  console.log("Sharing status:", sharingStatus);
  
  return {
    ownerAccess,
    collaboratorAccess,
    unauthorizedAccess,
    publicAccess,
    sharingStatus
  };
};

// Test Firestore rules compatibility
export const testFirestoreRules = () => {
  console.log("Testing Firestore rules compatibility...");
  
  // Check if plan structure matches rules
  const requiredFields = ['userId', 'collaborators'];
  const hasRequiredFields = requiredFields.every(field => 
    testPlan.hasOwnProperty(field)
  );
  
  console.log("Plan has required fields:", hasRequiredFields);
  
  // Check collaborators field is array
  const collaboratorsIsArray = Array.isArray(testPlan.collaborators);
  console.log("Collaborators is array:", collaboratorsIsArray);
  
  return {
    hasRequiredFields,
    collaboratorsIsArray
  };
};

// Export test functions for use in development
if (typeof window !== 'undefined') {
  window.testCollaborationWorkflow = testCollaborationWorkflow;
  window.testFirestoreRules = testFirestoreRules;
}
