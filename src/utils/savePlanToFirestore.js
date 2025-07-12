import { db, auth } from '../firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

export const savePlanToFirestore = async (plan, planId = null) => {
  const user = auth.currentUser;
  if (!user) {
    alert("Please log in first");
    throw new Error("User not logged in");
  }

  try {
    if (planId) {
      // Update existing plan
      const planRef = doc(db, "plans", planId);
      await updateDoc(planRef, {
        ...plan,
        lastModified: new Date(),
        lastModifiedBy: user.uid
      });
      return { id: planId };
    } else {
      // Create new plan
      const planWithUser = {
        ...plan,
        userId: user.uid,
        userEmail: user.email,
        createdAt: new Date(),
        lastModified: new Date(),
        lastModifiedBy: user.uid,
        collaborators: [] // Initialize empty collaborators array
      };
      return await addDoc(collection(db, "plans"), planWithUser);
    }
  } catch (err) {
    console.error("Firestore operation error:", err);
    throw err;
  }
};