import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMapEvents, Marker, Circle, useMap, ZoomControl, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from 'firebase/auth';

import schoolImg from '../assets/school.png';
import waterImg from '../assets/water.png';
import houseImg from '../assets/house.png';
import roadImg from '../assets/road.png';

import { savePlanToFirestore } from "../utils/savePlanToFirestore";
import { db, auth } from '../firebase';
import SimpleCollaboration from './SimpleCollaboration';
import { canAccessPlan, listenToPlan } from '../utils/simpleCollaboration';
import { 
  getAllDatabaseResources, 
  addResourceToDatabase, 
  updateResourceInDatabase, 
  removeResourceFromDatabase,
  getPrimaryUserDatabase 
} from '../utils/databaseOperations';
import ResourcePopover from './ResourcePopover';

const resourceIcons = {
  // Basic Infrastructure
  school: schoolImg,
  water: waterImg,
  house: houseImg,
  road: roadImg,
  
  // Healthcare & Emergency
  hospital: '🏥', // You can use emojis or add actual images
  fireStation: '🚒',
  police: '🚔',
  
  // Recreation & Commerce
  park: '🌳',
  mall: '🏬',
  restaurant: '🍽️',
  
  // Transportation
  busStop: '🚌',
  gasStation: '⛽',
  parking: '🅿️',
  
  // Utilities
  powerPlant: '⚡',
  recycling: '♻️',
  tower: '📡',
};

// Helper function to get color for each resource type
const getResourceColor = (type) => {
  const colorMap = {
    school: 'deepskyblue',
    water: 'limegreen',
    house: '#0ff',
    road: '#0ff',
    hospital: 'red',
    fireStation: 'orange',
    police: 'blue',
    park: 'forestgreen',
    mall: 'purple',
    restaurant: 'gold',
    busStop: 'yellow',
    gasStation: 'orange',
    parking: 'gray',
    powerPlant: 'yellow',
    recycling: 'green',
    tower: 'silver',
  };
  return colorMap[type] || '#0ff';
};

const getDefaultResourceName = (type, idx) => {
  // Simple default naming, can be improved
  const names = {
    school: "School",
    water: "Tank",
    house: "House",
    road: "Road",
    hospital: "Hospital",
    fireStation: "Fire Station",
    police: "Police Station",
    park: "Park",
    mall: "Mall",
    restaurant: "Restaurant",
    busStop: "Bus Stop",
    gasStation: "Gas Station",
    parking: "Parking",
    powerPlant: "Power Plant",
    recycling: "Recycling Center",
    tower: "Tower",
  };
  return `${names[type] || type} ${idx + 1}`;
};

const DEFAULT_LOCATION = [15.8497, 74.4977]; // Belgaum city center

function PlanPage() {
  const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION);
  const [droppedResources, setDroppedResources] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [locationReady, setLocationReady] = useState(true); // Default to true
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [iconSizes, setIconSizes] = useState({});
  const [iconRotations, setIconRotations] = useState({});
  const [mapZoom, setMapZoom] = useState(15);
  const [resourceRadii, setResourceRadii] = useState({
    school: 800,
    water: 500,
    hospital: 1200,      // Larger service area
    fireStation: 1000,   // Emergency response area
    police: 1500,        // Patrol area
    park: 600,           // Recreation area
    mall: 400,           // Commercial area
    busStop: 300,        // Transit coverage
    restaurant: 200,     // Dining area
    gasStation: 250,     // Service area
    parking: 150,        // Parking coverage
    powerPlant: 2000,    // Power grid coverage
    recycling: 500,      // Collection area
    tower: 3000,         // Communication coverage
  });
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [planTitle, setPlanTitle] = useState("");
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [houses, setHouses] = useState([]);
  // Removed: qualityStats state (plan quality score logic is now in analytics page)
  // Database resources state
  const [databaseResources, setDatabaseResources] = useState([]);
  const [primaryDatabase, setPrimaryDatabase] = useState(null);
  const [showHouseForm, setShowHouseForm] = useState(false);
  const [houseFormData, setHouseFormData] = useState({ residents: 0, students: 0 });
  const [houseFormPosition, setHouseFormPosition] = useState(null);
  // Collaboration states
  const [planId, setPlanId] = useState(null);
  const [realtimePlanData, setRealtimePlanData] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [canEdit, setCanEdit] = useState(true);
  // Authentication state
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const mapRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [showResourcePopover, setShowResourcePopover] = useState(false);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // LOAD PLAN IF OPENING FROM SAVED PLANS OR SHARED LINK
  useEffect(() => {
    // Don't load plan until auth state is ready
    if (authLoading) return;
    
    const loadPlanFromUrl = async () => {
      const planIdFromUrl = searchParams.get('id');
      
      if (planIdFromUrl) {
        // Loading from shared link
        try {
          const planDoc = await getDoc(doc(db, 'plans', planIdFromUrl));
          if (planDoc.exists()) {
            const plan = planDoc.data();
            setPlanId(planIdFromUrl);
            
            // Check if user is authenticated
            const currentUserEmail = currentUser?.email;
            const currentUserId = currentUser?.uid;
            
            // Check if plan is public (anyone can view)
            if (plan.isPublic) {
              // Public plan - allow view access regardless of login status
              const isOwnerUser = currentUserId && (plan.userId === currentUserId || plan.userEmail === currentUserEmail);
              const isCollaborator = currentUserEmail && plan.collaborators && plan.collaborators.includes(currentUserEmail);
              
              setIsOwner(isOwnerUser || false);
              setCanEdit(isOwnerUser || isCollaborator || false); // Only owner/collaborators can edit public plans
              
              // Load plan data
              if (plan.center && typeof plan.center.lat === "number" && typeof plan.center.lng === "number") {
                setUserLocation([plan.center.lat, plan.center.lng]);
                setLocationReady(true);
              }
              if (Array.isArray(plan.resources)) {
                setDroppedResources(
                  plan.resources.map(r => ({
                    ...r,
                    position: { lat: r.lat, lng: r.lng }
                  }))
                );
              }
              setPlanTitle(plan.planName || plan.name || "");
              setEditingPlanId(planIdFromUrl);
              return;
            }
            
            // Private plan - check if user is logged in
            if (!currentUserEmail || !currentUserId) {
              alert("This is a private plan. Please log in to access it.");
              navigate('/login');
              return;
            }
            
            // Check permissions for private plan
            const hasAccess = canAccessPlan(plan, currentUserEmail, currentUserId);
            
            if (!hasAccess) {
              alert("You don't have permission to access this private plan.");
              navigate('/dashboard');
              return;
            }
            
            const isOwnerUser = plan.userId === currentUserId || plan.userEmail === currentUserEmail;
            const isCollaborator = plan.collaborators && plan.collaborators.includes(currentUserEmail);
            
            setIsOwner(isOwnerUser);
            setCanEdit(isOwnerUser || isCollaborator);
            
            // Load plan data
            if (plan.center && typeof plan.center.lat === "number" && typeof plan.center.lng === "number") {
              setUserLocation([plan.center.lat, plan.center.lng]);
              setLocationReady(true);
            }
            if (Array.isArray(plan.resources)) {
              setDroppedResources(
                plan.resources.map(r => ({
                  ...r,
                  position: { lat: r.lat, lng: r.lng }
                }))
              );
            }
            setPlanTitle(plan.planName || plan.name || "");
            setEditingPlanId(planIdFromUrl);
            return;
          } else {
            alert("Plan not found.");
            navigate('/dashboard');
            return;
          }
        } catch (error) {
          console.error("Error loading shared plan:", error);
          alert("Error loading plan. Please try again.");
          navigate('/dashboard');
          return;
        }
      }
    };

    // Check for shared link first
    if (searchParams.get('id')) {
      loadPlanFromUrl();
      return;
    }

    // If location.state is missing, redirect to plan-location page
    if (!location.state) {
      navigate('/plan-location', { replace: true });
      return;
    }

    if (location.state?.loadedPlan) {
      const plan = location.state.loadedPlan;
      const loadedPlanId = location.state.planId;
      
      // Set plan ID for collaboration
      setPlanId(loadedPlanId);
      
      // Check permissions
      const currentUserEmail = currentUser?.email;
      const currentUserId = currentUser?.uid;
      const isOwnerUser = plan.userId === currentUserId || plan.userEmail === currentUserEmail;
      setIsOwner(isOwnerUser);
      
      // Check if user can access this plan
      const hasAccess = canAccessPlan(plan, currentUserEmail, currentUserId);
      setCanEdit(hasAccess);
      
      if (!hasAccess) {
        alert("You don't have permission to access this plan.");
        navigate('/dashboard');
        return;
      }

      // Load plan data
      if (plan.center && typeof plan.center.lat === "number" && typeof plan.center.lng === "number") {
        setUserLocation([plan.center.lat, plan.center.lng]);
        setLocationReady(true);
      }
      if (Array.isArray(plan.resources)) {
        setDroppedResources(
          plan.resources.map(r => ({
            ...r,
            position: { lat: r.lat, lng: r.lng }
          }))
        );
      }
      setPlanTitle(plan.planName || plan.name || "");
      setEditingPlanId(loadedPlanId);
      return;
    }
    if (location.state?.coords) {
      // If coordinates are provided (from pincode), use them
      const coords = [location.state.coords.lat, location.state.coords.lng];
      console.log("Setting coordinates from pincode:", coords);
      setUserLocation(coords);
      setLocationReady(true);
    } else if (location.state?.useCurrentLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          console.log("Got current location:", coords);
          setUserLocation(coords);
          setLocationReady(true);
          
          // Try to update map view if map is already available with safety checks
          const updateMapViewSafely = () => {
            if (mapRef.current && 
                mapRef.current.setView && 
                mapRef.current._container && 
                mapRef.current._loaded) {
              try {
                mapRef.current.setView(coords, 15);
                console.log("Map view updated to current location");
              } catch (error) {
                console.error("Error setting map view in geolocation callback:", error);
              }
            } else {
              // Map not ready yet, try again later
              setTimeout(updateMapViewSafely, 100);
            }
          };
          
          setTimeout(updateMapViewSafely, 200);
        },
        (err) => {
          console.error("Geolocation error:", err);
          alert("Could not get your location. Using default location.");
          setUserLocation(DEFAULT_LOCATION);
          setLocationReady(true);
        }
      );
    }
  }, [location.state, navigate, searchParams, authLoading, currentUser]);

  // Listen to real-time updates
  useEffect(() => {
    if (!planId) return;

    const unsubscribe = listenToPlan(planId, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setRealtimePlanData(data);
        
        // Update resources in real-time
        if (data.resources) {
          setDroppedResources(
            data.resources.map(r => ({
              ...r,
              position: { lat: r.lat, lng: r.lng }
            }))
          );
        }
      }
    });

    return () => unsubscribe();
  }, [planId]);


  // Fetch house data from Firestore
  useEffect(() => {
    const fetchHouses = async () => {
      try {
        const snapshot = await getDocs(collection(db, "houses"));
        const houseList = snapshot.docs.map(doc => doc.data());
        setHouses(houseList);
      } catch (err) {
        console.error("Error fetching houses:", err);
      }
    };
    fetchHouses();
  }, []);

  // Merge houses from public and database sources
  const mergedHouses = React.useMemo(() => {
    let dbHouses = [];
    if (primaryDatabase && Array.isArray(primaryDatabase.houses)) {
      dbHouses = primaryDatabase.houses;
    }
    // Avoid duplicates by houseId
    const all = [...houses, ...dbHouses];
    const seen = new Set();
    return all.filter(h => {
      if (!h.houseId) return true;
      if (seen.has(h.houseId)) return false;
      seen.add(h.houseId);
      return true;
    });
  }, [houses, primaryDatabase]);

  // Load database resources
  useEffect(() => {
    const loadDatabaseResources = async () => {
      if (!currentUser) return;
      
      try {
        const resources = await getAllDatabaseResources();
        setDatabaseResources(resources);
        
        const primaryDb = await getPrimaryUserDatabase();
        setPrimaryDatabase(primaryDb);
      } catch (error) {
        console.error("Error loading database resources:", error);
      }
    };

    if (!authLoading && currentUser) {
      loadDatabaseResources();
    }
  }, [currentUser, authLoading]);

  console.log("Loaded houses:", houses);
  if (houses.length > 0) {
    console.log("First house:", houses[0]);
  }

  // Update map view when userLocation changes and map is ready
  useEffect(() => {
    if (mapRef.current && userLocation && locationReady) {
      // Add a longer delay and more checks to ensure the map is fully initialized
      const updateMapView = () => {
        try {
          if (mapRef.current && 
              mapRef.current.setView && 
              mapRef.current._container && 
              mapRef.current._loaded) {
            console.log("Updating map view to:", userLocation);
            mapRef.current.setView(userLocation, 15);
          } else {
            // If map isn't ready, try again in a bit
            setTimeout(updateMapView, 100);
          }
        } catch (error) {
          console.error("Error setting map view:", error);
        }
      };
      
      setTimeout(updateMapView, 150);
    }
  }, [userLocation, locationReady]);

  // Listen for zoom changes
  function ZoomListener() {
    const map = useMap();
    useEffect(() => {
      const onZoom = () => setMapZoom(map.getZoom());
      map.on('zoom', onZoom);
      setMapZoom(map.getZoom());
      return () => map.off('zoom', onZoom);
    }, [map]);
    return null;
  }

  function MapWithRef() {
    const map = useMapEvents({});
    useEffect(() => {
      if (map) {
        mapRef.current = map;
        console.log("Map reference set:", map);
      }
    }, [map]);
    return null;
  }

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        if (!canEdit) return; // Prevent editing if user doesn't have permission
        if (draggedItem) {
          if (draggedItem === 'house') {
            // Show form for house details
            setHouseFormPosition(e.latlng);
            setHouseFormData({ residents: 0, students: 0 });
            setShowHouseForm(true);
          } else {
            // Add other resources directly
            setDroppedResources((prev) => {
              const newResources = [
                ...prev,
                {
                  type: draggedItem,
                  position: e.latlng,
                  radius: resourceRadii[draggedItem] || undefined,
                },
              ];
              setSelectedIdx(newResources.length - 1); // Select the new resource
              return newResources;
            });
          }
        } else {
          setSelectedIdx(null);
        }
      },
    });
    return null;
  };

  // Handle house form submission
  const handleHouseFormSubmit = async () => {
    if (!houseFormPosition) return;

    const newHouse = {
      type: 'house',
      position: houseFormPosition,
      radius: resourceRadii.house || undefined,
      residents: parseInt(houseFormData.residents) || 0,
      students: parseInt(houseFormData.students) || 0,
    };

    // Add to dropped resources
    setDroppedResources((prev) => {
      const newResources = [...prev, newHouse];
      setSelectedIdx(newResources.length - 1);
      return newResources;
    });

    // Add to primary database if available
    if (primaryDatabase) {
      const resourceForDb = {
        houseId: `H${Date.now()}`,
        latitude: houseFormPosition.lat,
        longitude: houseFormPosition.lng,
        residents: parseInt(houseFormData.residents) || 0,
        students: parseInt(houseFormData.students) || 0,
        type: 'house'
      };
      
      await addResourceToDatabase(primaryDatabase.id, resourceForDb);
    }

    // Reset form
    setShowHouseForm(false);
    setHouseFormPosition(null);
    setHouseFormData({ residents: 0, students: 0 });
  };

  // --- Overlay controls on selected icon ---
  function IconOverlay() {
    if (
      selectedIdx === null ||
      !droppedResources[selectedIdx] ||
      !mapRef.current
    )
      return null;

    const res = droppedResources[selectedIdx];
    // Base size at zoom 15, scale with zoom
    const baseSize = iconSizes[selectedIdx] || 40;
    const scale = Math.pow(2, mapZoom - 15); // double size per +1 zoom, halve per -1
    const size = baseSize * scale;
    const rotation = iconRotations[selectedIdx] || 0;
    const point = mapRef.current.latLngToContainerPoint(res.position);

    // Overlay position
    return (
      <div
        style={{
          position: 'absolute',
          left: point.x - size / 2,
          top: point.y - size / 2,
          width: size,
          height: size,
          pointerEvents: 'none',
          zIndex: 1000,
        }}
      >
        {/* Main icon */}
        <img
          src={resourceIcons[res.type]}
          alt={res.type}
          style={{
            width: size,
            height: size,
            transform: `rotate(${rotation}deg)`,
            pointerEvents: 'auto',
            cursor: 'move',
            boxShadow: '0 0 8px #0ff8',
            border: '2px solid #0ff',
            borderRadius: 8,
            background: 'rgba(0,0,0,0.2)',
            position: 'absolute',
            left: 0,
            top: 0,
          }}
          onMouseDown={e => {
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const startPoint = mapRef.current.latLngToContainerPoint(res.position);

            function onMove(moveEvt) {
              const dx = moveEvt.clientX - startX;
              const dy = moveEvt.clientY - startY;
              const newPoint = L.point(startPoint.x + dx, startPoint.y + dy);
              const newLatLng = mapRef.current.containerPointToLatLng(newPoint);
              setDroppedResources(resources =>
                resources.map((r, i) =>
                  i === selectedIdx ? { ...r, position: newLatLng } : r
                )
              );
            }
            function onUp() {
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
            }
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
        />
        {/* Resize handle (bottom right) */}
        <div
          style={{
            position: 'absolute',
            right: -10,
            bottom: -10,
            width: 18,
            height: 18,
            background: '#0ff',
            borderRadius: '50%',
            border: '2px solid #23272f',
            cursor: 'nwse-resize',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
          onMouseDown={e => {
            e.stopPropagation();
            const startY = e.clientY;
            const startSize = baseSize;
            const onMove = moveEvt => {
              const delta = moveEvt.clientY - startY;
              setIconSizes(sizes => ({
                ...sizes,
                [selectedIdx]: Math.max(3, startSize + delta / scale), // allow icons as small as 8px
              }));
            };
            const onUp = () => {
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
          title="Resize"
        >
          <span style={{ color: '#23272f', fontWeight: 'bold' }}>↔</span>
        </div>
        {/* Rotate handle (top center) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: -28,
            transform: 'translateX(-50%)',
            width: 18,
            height: 18,
            background: '#0ff',
            borderRadius: '50%',
            border: '2px solid #23272f',
            cursor: 'grab',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
          onMouseDown={e => {
            e.stopPropagation();
            const startY = e.clientY;
            const startRotation = rotation;
            const onMove = moveEvt => {
              const delta = moveEvt.clientY - startY;
              setIconRotations(rot => ({
                ...rot,
                [selectedIdx]: (startRotation + delta * 2) % 360,
              }));
            };
            const onUp = () => {
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
          title="Rotate"
        >
          <span style={{ color: '#23272f', fontWeight: 'bold' }}>⟳</span>
        </div>
        {/* Remove button (top right) */}
        <div
          style={{
            position: 'absolute',
            right: -12,
            top: -12,
            width: 20,
            height: 20,
            background: '#f55',
            borderRadius: '50%',
            border: '2px solid #fff',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            pointerEvents: 'auto',
            zIndex: 2,
          }}
          onClick={async () => {
            const resourceToDelete = droppedResources[selectedIdx];
            
            // Remove from local state
            setDroppedResources(droppedResources.filter((_, i) => i !== selectedIdx));
            setSelectedIdx(null);
            
            // If it's a house and we have a database, remove from database too
            if (resourceToDelete?.type === 'house' && primaryDatabase && resourceToDelete.databaseId) {
              await removeResourceFromDatabase(resourceToDelete.databaseId, resourceToDelete.id);
            }
          }}
          title="Remove"
        >
          ×
        </div>
      </div>
    );
  }

  useEffect(() => {
    setDroppedResources(resources =>
      resources.map(r =>
        (r.type === 'school' || r.type === 'water')
          ? { ...r, radius: resourceRadii[r.type] }
          : r
      )
    );
  }, [resourceRadii]);

  const handleSaveClick = () => setShowSavePopup(true);

  const handleSavePlan = async () => {
    // Only include resources with valid position
    const validResources = droppedResources.filter(
      res => res.position && typeof res.position.lat === "number" && typeof res.position.lng === "number"
    );
    if (validResources.length === 0) {
      alert("Please place at least one resource on the map before saving.");
      return;
    }
    if (!userLocation || typeof userLocation[0] !== "number" || typeof userLocation[1] !== "number") {
      alert("User location is not set. Please select a location.");
      return;
    }
    const formattedResources = validResources.map((res, idx) => {
      const base = {
        type: res.type,
        name: getDefaultResourceName(res.type, idx),
        lat: res.position.lat,
        lng: res.position.lng,
      };
      if (typeof res.radius === "number") {
        base.radius = res.radius;
      }
      return base;
    });
    const planData = {
      planName: planTitle,
      center: { lat: userLocation[0], lng: userLocation[1] },
      resources: formattedResources,
      lastModified: new Date().toISOString(),
      // userId will be added in the utility if new
    };
    try {
      if (editingPlanId) {
        // Update existing plan
        await savePlanToFirestore(planData, editingPlanId);
      } else {
        // Create new plan
        await savePlanToFirestore({
          ...planData,
          createdAt: new Date().toISOString(),
        });
      }
      setShowSavePopup(false);
      setPlanTitle("");
      navigate('/saved-plans');
    } catch (err) {
      console.error("Error saving plan:", err);
      alert("Failed to save plan. " + (err && err.message ? err.message : "Please try again."));
    }
  };

  // Removed plan quality score logic

  // Show loading state while auth is being resolved
  if (authLoading) {
    return (
      <div style={{ 
        height: '100vh', 
        width: '100vw', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: 'linear-gradient(120deg, #181c24 0%, #23272f 100%)',
        color: '#0ff',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', background: 'linear-gradient(120deg, #181c24 0%, #23272f 100%)' }}>
      {/* Save Plan Modal */}
      {showSavePopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#23272f',
            borderRadius: 12,
            padding: 32,
            minWidth: 320,
            boxShadow: '0 0 24px #0ff8',
            color: '#0ff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <h2 style={{ color: '#0ff', marginBottom: 16 }}>Save Plan</h2>
            <input
              type="text"
              value={planTitle}
              onChange={e => setPlanTitle(e.target.value)}
              placeholder="Enter plan name"
              style={{
                padding: '10px',
                fontSize: 18,
                borderRadius: 8,
                border: '1px solid #0ff',
                marginBottom: 24,
                width: '100%',
                color: '#23272f',
                background: '#0ff2',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 16 }}>
              <button
                onClick={handleSavePlan}
                style={{
                  padding: '10px 32px',
                  fontSize: 18,
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(90deg, #0ff, #09f)',
                  color: '#23272f',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 0 8px #0ff8',
                }}
              >
                Save
              </button>
              <button
                onClick={() => setShowSavePopup(false)}
                style={{
                  padding: '10px 32px',
                  fontSize: 18,
                  borderRadius: 8,
                  border: 'none',
                  background: '#23272f',
                  color: '#0ff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 0 8px #0ff8',
                  border: '1px solid #0ff',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Access Level Indicator */}
      {searchParams.get('id') && (
        <div style={{
          position: 'absolute',
          top: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          background: isOwner ? 'rgba(0,255,0,0.1)' : (canEdit ? 'rgba(255,255,0,0.1)' : 'rgba(0,255,255,0.1)'),
          border: isOwner ? '1px solid rgba(0,255,0,0.3)' : (canEdit ? '1px solid rgba(255,255,0,0.3)' : '1px solid rgba(0,255,255,0.3)'),
          borderRadius: 8,
          padding: '8px 16px',
          color: isOwner ? '#0f0' : (canEdit ? '#ff0' : '#0ff'),
          fontSize: '14px',
          fontWeight: '600',
          zIndex: 2100,
        }}>
          {isOwner ? '👑 Owner' : (canEdit ? '✏️ Collaborator' : '👁️ Public View')}
        </div>
      )}

      {/* Login Suggestion for Public Viewers */}
      {searchParams.get('id') && !canEdit && !currentUser && (
        <div style={{
          position: 'absolute',
          top: 70,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,0,0.1)',
          border: '1px solid rgba(255,255,0,0.3)',
          borderRadius: 8,
          padding: '8px 16px',
          color: '#ff0',
          fontSize: '12px',
          zIndex: 2100,
          cursor: 'pointer',
        }}
        onClick={() => navigate('/login')}
      >
        💡 Log in to collaborate and edit this plan
      </div>
      )}
      
      {/* Back Button (top left, outside resource panel) */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute',
          top: 28,
          left: 28,
          background: 'rgba(0,255,255,0.12)',
          border: 'none',
          borderRadius: 8,
          color: '#0ff',
          fontWeight: 700,
          fontSize: 18,
          padding: '8px 22px',
          cursor: 'pointer',
          boxShadow: '0 0 8px #0ff4',
          zIndex: 2100,
        }}
      >
        ← Back
      </button>

      {/* Resource Popover Button (bottom left) */}
      {canEdit && (
        <>
          <button
            style={{
              position: 'absolute',
              left: 32,
              bottom: 90,
              width: '11vw',
              minWidth: 90,
              padding: '10px 0',
              fontSize: 18,
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(90deg, #0ff, #09f)',
              color: '#000',
              fontWeight: 700,
              letterSpacing: 1,
              boxShadow: '0 0 16px #0ff8',
              cursor: 'pointer',
              outline: 'none',
              zIndex: 2100,
            }}
            onClick={() => setShowResourcePopover(true)}
          >
            Add Resource
          </button>
          <button
            style={{
              position: 'absolute',
              left: 32,
              bottom: 32,
              width: '11vw',
              minWidth: 90,
              padding: '10px 0',
              fontSize: 18,
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(90deg, #0ff, #09f)',
              color: '#000',
              fontWeight: 700,
              letterSpacing: 1,
              boxShadow: '0 0 16px #0ff8',
              cursor: 'pointer',
              outline: 'none',
              zIndex: 2100,
            }}
            onClick={handleSaveClick}
          >
            Save
          </button>
        </>
      )}
      {/* Resource Popover Modal */}
      {showResourcePopover && canEdit && (
        <ResourcePopover
          onSelect={type => {
            setDraggedItem(type);
            setShowResourcePopover(false);
          }}
          onClose={() => setShowResourcePopover(false)}
          resourceRadii={resourceRadii}
          setResourceRadii={setResourceRadii}
        />
      )}

      {/* Collaboration Component */}
      {planId && (
        <SimpleCollaboration 
          planId={planId}
          planData={realtimePlanData || {}}
          isOwner={isOwner}
          onPlanUpdate={(updatedData) => {
            setRealtimePlanData(updatedData);
          }}
        />
      )}

      {/* Owner/Collaborator Badge */}
      {planId && (
        <div style={{
          position: 'absolute',
          top: 28,
          right: 320,
          padding: '4px 12px',
          background: isOwner ? '#ffd700' : '#00ff00',
          color: '#000',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 600,
          zIndex: 2100
        }}>
          {isOwner ? 'OWNER' : 'COLLABORATOR'}
        </div>
      )}

      {/* No Access Overlay */}
      {!canEdit && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255,68,68,0.1)',
          zIndex: 1000,
          pointerEvents: 'none'
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255,68,68,0.9)',
            color: '#fff',
            padding: 16,
            borderRadius: 8,
            textAlign: 'center'
          }}>
            <h3>No Access</h3>
            <p>You don't have permission to view this plan.</p>
          </div>
        </div>
      )}

      {/* Map Area */}
      <div style={{ height: '100vh', width: '100vw' }}>
        {locationReady && userLocation ? (
          <MapContainer
            center={userLocation}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            key={`map-${userLocation[0].toFixed(4)}-${userLocation[1].toFixed(4)}`}
          >
            {/* Satellite Base Layer */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles © Esri'
            />
            {/* Labels Overlay */}
            <TileLayer
              url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              attribution='Labels © Esri'
            />
            <ZoomListener />
            <MapWithRef />
            {canEdit && <MapClickHandler />}
            <ZoomControl position="topright" />
            <>
              <Marker
                position={userLocation}
                icon={L.icon({
                  iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
                  iconSize: [32, 32],
                  iconAnchor: [16, 32],
                })}
              />
              <Circle
                center={userLocation}
                radius={30}
                pathOptions={{
                  color: '#2e7d32',
                  fillColor: '#b7be9a',
                  fillOpacity: 0.3,
                }}
              />
            </>
            {droppedResources.map((res, idx) => {
              const size = (iconSizes[idx] || 40) * Math.pow(2, mapZoom - 15);
              const rotation = iconRotations[idx] || 0;
              const isSelected = selectedIdx === idx;
              const icon = resourceIcons[res.type];
              
              // Check if icon is an image URL (contains '.' for file extension) or emoji
              const isImageIcon = typeof icon === 'string' && icon.includes('.');
              
              return (
                <React.Fragment key={idx}>
                  <Marker
                    position={res.position}
                    eventHandlers={{
                      click: () => setSelectedIdx(idx),
                    }}
                    icon={L.divIcon({
                      html: isImageIcon 
                        ? `<img src="${icon}" style="width:${size}px;height:${size}px;transform:rotate(${rotation}deg);${isSelected ? 'box-shadow:0 0 12px #0ff,0 0 24px #0ff;border-radius:50%;' : ''}" />`
                        : `<div style="width:${size}px;height:${size}px;font-size:${size * 0.8}px;display:flex;align-items:center;justify-content:center;transform:rotate(${rotation}deg);${isSelected ? 'box-shadow:0 0 12px #0ff,0 0 24px #0ff;border-radius:50%;background:rgba(0,255,255,0.2);' : ''}">${icon}</div>`,
                      iconSize: [size, size],
                      className: 'custom-marker-icon',
                    })}
                  />
                  {res.radius && (
                    <Circle
                      center={res.position}
                      radius={res.radius}
                      pathOptions={{
                        color: getResourceColor(res.type),
                        fillColor: getResourceColor(res.type),
                        fillOpacity: 0.15,
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
            
            {/* Database Resources */}
            {databaseResources.map((resource, idx) => {
              const icon = resourceIcons[resource.type] || resourceIcons.house;
              const isImageIcon = typeof icon === 'string' && icon.includes('.');
              const size = 35 * Math.pow(2, mapZoom - 15); // Slightly smaller than placed resources
              
              return (
                <React.Fragment key={`db-${resource.databaseId}-${resource.id}`}>
                  <Marker
                    position={[resource.lat, resource.lng]}
                    icon={L.divIcon({
                      html: isImageIcon 
                        ? `<img src="${icon}" style="width:${size}px;height:${size}px;opacity:0.7;border:2px solid #ffa500;border-radius:50%;" />`
                        : `<div style="width:${size}px;height:${size}px;font-size:${size * 0.8}px;display:flex;align-items:center;justify-content:center;opacity:0.7;border:2px solid #ffa500;border-radius:50%;background:rgba(255,165,0,0.2);">${icon}</div>`,
                      iconSize: [size, size],
                      className: 'database-marker-icon',
                    })}
                  >
                    <Popup>
                      <div style={{ minWidth: 120 }}>
                        <div><strong>From Database:</strong> {resource.databaseName}</div>
                        <div><strong>Type:</strong> {resource.type}</div>
                        {resource.type === 'house' && (
                          <>
                            <div><strong>Residents:</strong> {resource.residents || 0}</div>
                            <div><strong>Students:</strong> {resource.students || 0}</div>
                          </>
                        )}
                        <div style={{ fontSize: '0.8em', color: '#888', marginTop: '5px' }}>
                          Database Resource (Read-only)
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}
            
            {mergedHouses
              .filter(house =>
                (house.lat !== undefined && house.long !== undefined && !isNaN(house.lat) && !isNaN(house.long)) ||
                (house.latitude !== undefined && house.longitude !== undefined && !isNaN(house.latitude) && !isNaN(house.longitude))
              )
              .map(house => {
                const lat = house.lat !== undefined ? house.lat : house.latitude;
                const long = house.long !== undefined ? house.long : house.longitude;
                return (
                  <Marker
                    key={house.houseId}
                    position={[
                      typeof lat === "string" ? parseFloat(lat) : lat,
                      typeof long === "string" ? parseFloat(long) : long
                    ]}
                  >
                    <Popup>
                      <div style={{ minWidth: 120 }}>
                        <div><strong>ID:</strong> {house.houseId}</div>
                        <div><strong>Residents:</strong> {house.residents}</div>
                        <div><strong>Students:</strong> {house.students}</div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })
            }
          </MapContainer>
        ) : (
          // Optionally, show a loading spinner or message
          <div style={{ color: "#0ff", textAlign: "center", marginTop: "40vh" }}>Loading map...</div>
        )}
        {/* Overlay controls for selected icon */}
        <IconOverlay />
      </div>

      {/* Removed plan quality score panel UI */}
    </div>
  );
}

export default PlanPage;

