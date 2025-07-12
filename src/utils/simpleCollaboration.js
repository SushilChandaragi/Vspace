import { doc, onSnapshot } from "firebase/firestore";
import { db } from '../firebase';

// Check if user can access plan
export const canAccessPlan = (plan, userEmail, userId) => {
  // If plan is public, anyone can view it
  if (plan.isPublic) {
    return true;
  }
  
  // If user is not logged in and plan is private, deny access
  if (!userEmail || !userId) {
    return false;
  }
  
  // If user is owner
  if (plan.userId === userId || plan.userEmail === userEmail) {
    return true;
  }
  
  // If plan is shared with user (using collaborators field to match Firestore rules)
  if (plan.collaborators && Array.isArray(plan.collaborators)) {
    return plan.collaborators.includes(userEmail);
  }
  
  return false;
};

// Listen to real-time plan updates
export const listenToPlan = (planId, callback) => {
  const planRef = doc(db, "plans", planId);
  return onSnapshot(planRef, callback);
};

// Get plan sharing status
export const getPlanSharingStatus = (plan, userEmail, userId) => {
  const isOwner = plan.userId === userId || plan.userEmail === userEmail;
  const isShared = plan.collaborators && plan.collaborators.includes(userEmail);
  const isPublic = plan.isPublic;
  
  return {
    isOwner,
    isShared,
    isPublic,
    canEdit: isOwner || isShared, // Both owners and collaborators can edit
    canView: isOwner || isShared || isPublic
  };
};
