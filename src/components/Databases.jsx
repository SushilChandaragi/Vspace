import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  arrayUnion,
  arrayRemove 
} from 'firebase/firestore';
import './Databases.css';

const Databases = () => {
  const navigate = useNavigate();
  const [databases, setDatabases] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState(null);
  const [newDatabaseName, setNewDatabaseName] = useState('');
  const [newDatabaseFile, setNewDatabaseFile] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    const user = auth.currentUser;
    if (!user) return;

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

      setDatabases([...ownedDatabases, ...sharedDatabases]);
    } catch (error) {
      console.error('Error fetching databases:', error);
      setMessage('Failed to fetch databases');
    }
  };

  const handleAddDatabase = async () => {
    if (!newDatabaseName.trim() || !newDatabaseFile) {
      setMessage('Please provide both name and file');
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const fileContent = JSON.parse(e.target.result);
          
          // Validate file structure
          if (!Array.isArray(fileContent)) {
            setMessage('Invalid file format. Expected JSON array.');
            setLoading(false);
            return;
          }

          // Add database to Firestore
          await addDoc(collection(db, 'databases'), {
            name: newDatabaseName,
            userId: user.uid,
            userEmail: user.email,
            data: fileContent,
            collaborators: [],
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
          });

          setMessage('Database added successfully!');
          setNewDatabaseName('');
          setNewDatabaseFile(null);
          setShowAddModal(false);
          fetchDatabases();
          
          setTimeout(() => setMessage(''), 3000);
        } catch (parseError) {
          console.error('Error parsing file:', parseError);
          setMessage('Invalid JSON file format');
        }
        setLoading(false);
      };
      
      fileReader.readAsText(newDatabaseFile);
    } catch (error) {
      console.error('Error adding database:', error);
      setMessage('Failed to add database');
      setLoading(false);
    }
  };

  const handleDeleteDatabase = async (databaseId) => {
    if (!window.confirm('Are you sure you want to delete this database?')) {
      return;
    }

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'databases', databaseId));
      setMessage('Database deleted successfully!');
      fetchDatabases();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting database:', error);
      setMessage('Failed to delete database');
    }
    setLoading(false);
  };

  const handleShareDatabase = async () => {
    if (!shareEmail.trim()) {
      setMessage('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shareEmail)) {
      setMessage('Please enter a valid email address');
      return;
    }

    if (selectedDatabase.collaborators && selectedDatabase.collaborators.includes(shareEmail)) {
      setMessage('This user already has access');
      return;
    }

    if (selectedDatabase.userEmail === shareEmail) {
      setMessage('Cannot share with yourself');
      return;
    }

    setLoading(true);
    try {
      const databaseRef = doc(db, 'databases', selectedDatabase.id);
      await updateDoc(databaseRef, {
        collaborators: arrayUnion(shareEmail),
        lastModified: new Date().toISOString()
      });
      
      setMessage('Database shared successfully!');
      setShareEmail('');
      setShowShareModal(false);
      fetchDatabases();
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error sharing database:', error);
      setMessage('Failed to share database');
    }
    setLoading(false);
  };

  const handleRemoveCollaborator = async (databaseId, email) => {
    if (!window.confirm(`Remove ${email} from this database?`)) {
      return;
    }

    setLoading(true);
    try {
      const databaseRef = doc(db, 'databases', databaseId);
      await updateDoc(databaseRef, {
        collaborators: arrayRemove(email),
        lastModified: new Date().toISOString()
      });
      
      setMessage('Collaborator removed successfully!');
      fetchDatabases();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error removing collaborator:', error);
      setMessage('Failed to remove collaborator');
    }
    setLoading(false);
  };

  return (
    <div className="databases-page">
      <header className="databases-header">
        <div className="header-content">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>Your Databases</h1>
          <button 
            className="add-database-button"
            onClick={() => setShowAddModal(true)}
          >
            + Add Database
          </button>
        </div>
      </header>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <main className="databases-main">
        {databases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🗄️</div>
            <h2>No databases found</h2>
            <p>Create your first database to get started</p>
            <button 
              className="add-first-database-button"
              onClick={() => setShowAddModal(true)}
            >
              Add Your First Database
            </button>
          </div>
        ) : (
          <div className="databases-grid">
            {databases.map((database) => (
              <div key={database.id} className="database-card">
                <div className="database-header">
                  <h3>{database.name}</h3>
                  <div className="database-badge">
                    {database.isOwner ? 'Owner' : 'Shared'}
                  </div>
                </div>
                
                <div className="database-info">
                  <p>Records: {database.data?.length || 0}</p>
                  <p>Created: {new Date(database.createdAt).toLocaleDateString()}</p>
                  {database.collaborators && database.collaborators.length > 0 && (
                    <p>Shared with: {database.collaborators.length} users</p>
                  )}
                </div>

                <div className="database-actions">
                  {database.isOwner && (
                    <>
                      <button 
                        className="share-button"
                        onClick={() => {
                          setSelectedDatabase(database);
                          setShowShareModal(true);
                        }}
                      >
                        Share
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteDatabase(database.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>

                {database.isOwner && database.collaborators && database.collaborators.length > 0 && (
                  <div className="collaborators-list">
                    <h4>Shared with:</h4>
                    {database.collaborators.map((email) => (
                      <div key={email} className="collaborator-item">
                        <span>{email}</span>
                        <button 
                          className="remove-collaborator-button"
                          onClick={() => handleRemoveCollaborator(database.id, email)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Database Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Database</h2>
              <button 
                className="close-button"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Database Name:</label>
                <input
                  type="text"
                  value={newDatabaseName}
                  onChange={(e) => setNewDatabaseName(e.target.value)}
                  placeholder="Enter database name"
                />
              </div>
              <div className="form-group">
                <label>JSON File:</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setNewDatabaseFile(e.target.files[0])}
                />
                <small>Upload a JSON file with your database records</small>
              </div>
              <div className="modal-actions">
                <button 
                  className="cancel-button"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-button"
                  onClick={handleAddDatabase}
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Database'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Database Modal */}
      {showShareModal && selectedDatabase && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Share Database: {selectedDatabase.name}</h2>
              <button 
                className="close-button"
                onClick={() => setShowShareModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Email Address:</label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="Enter email to share with"
                />
              </div>
              <div className="modal-actions">
                <button 
                  className="cancel-button"
                  onClick={() => setShowShareModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-button"
                  onClick={handleShareDatabase}
                  disabled={loading}
                >
                  {loading ? 'Sharing...' : 'Share Database'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Databases;
