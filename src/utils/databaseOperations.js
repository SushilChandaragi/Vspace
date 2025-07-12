import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db, auth } from '../firebase';

// Fetch all databases accessible to the current user
export const fetchUserDatabases = async () => {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    // Fetch databases owned by user
    const ownedQuery = query(
      collection(db, 'databases'),
      where('userId', '==', user.uid)
    );
    const ownedSnapshot = await getDocs(ownedQuery);
    
    // Fetch databases shared with user
    const sharedQuery = query(
      collection(db, 'databases'),
      where('collaborators', 'array-contains', user.email)
    );
    const sharedSnapshot = await getDocs(sharedQuery);

    const ownedDatabases = ownedSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isOwner: true
    }));

    const sharedDatabases = sharedSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isOwner: false
    }));

    return [...ownedDatabases, ...sharedDatabases];
  } catch (error) {
    console.error('Error fetching databases:', error);
    return [];
  }
};

// Get all resources from user's databases
export const getAllDatabaseResources = async () => {
  const databases = await fetchUserDatabases();
  let allResources = [];

  databases.forEach(database => {
    if (database.data && Array.isArray(database.data)) {
      const resources = database.data.map(item => ({
        ...item,
        databaseId: database.id,
        databaseName: database.name,
        type: item.type || 'house', // Default to house if no type specified
        id: item.houseId || item.id || `${database.id}_${Math.random()}`,
        lat: item.latitude || item.lat,
        lng: item.longitude || item.lng,
        residents: item.residents || 0,
        students: item.students || 0
      }));
      allResources = allResources.concat(resources);
    }
  });

  return allResources;
};

// Add a new resource to a specific database
export const addResourceToDatabase = async (databaseId, resource) => {
  try {
    const databaseRef = doc(db, 'databases', databaseId);
    
    // First fetch the current database
    const databases = await fetchUserDatabases();
    const database = databases.find(db => db.id === databaseId);
    
    if (!database) {
      throw new Error('Database not found or no access');
    }

    const updatedData = [...(database.data || []), resource];
    
    await updateDoc(databaseRef, {
      data: updatedData,
      lastModified: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error adding resource to database:', error);
    return false;
  }
};

// Update a resource in a specific database
export const updateResourceInDatabase = async (databaseId, resourceId, updatedResource) => {
  try {
    const databaseRef = doc(db, 'databases', databaseId);
    
    // First fetch the current database
    const databases = await fetchUserDatabases();
    const database = databases.find(db => db.id === databaseId);
    
    if (!database) {
      throw new Error('Database not found or no access');
    }

    const updatedData = (database.data || []).map(item => {
      const itemId = item.houseId || item.id;
      return itemId === resourceId ? { ...item, ...updatedResource } : item;
    });
    
    await updateDoc(databaseRef, {
      data: updatedData,
      lastModified: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error updating resource in database:', error);
    return false;
  }
};

// Remove a resource from a specific database
export const removeResourceFromDatabase = async (databaseId, resourceId) => {
  try {
    const databaseRef = doc(db, 'databases', databaseId);
    
    // First fetch the current database
    const databases = await fetchUserDatabases();
    const database = databases.find(db => db.id === databaseId);
    
    if (!database) {
      throw new Error('Database not found or no access');
    }

    const updatedData = (database.data || []).filter(item => {
      const itemId = item.houseId || item.id;
      return itemId !== resourceId;
    });
    
    await updateDoc(databaseRef, {
      data: updatedData,
      lastModified: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error removing resource from database:', error);
    return false;
  }
};

// Get the primary database for the user (first owned database)
export const getPrimaryUserDatabase = async () => {
  const databases = await fetchUserDatabases();
  return databases.find(db => db.isOwner) || null;
};
