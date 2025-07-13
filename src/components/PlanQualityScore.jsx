import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getAllDatabaseResources } from '../utils/databaseOperations';

function getHousesCovered(resource, houses) {
  if (!resource.position || !resource.radius) return [];
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;
  const { lat: lat1, lng: lon1 } = resource.position;
  return houses.filter(house => {
    const lat2 = house.lat !== undefined ? house.lat : house.latitude;
    const lon2 = house.long !== undefined ? house.long : house.longitude;
    if (lat2 === undefined || lon2 === undefined) return false;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d <= resource.radius;
  });
}

function getAllResourceStats(resources, houses) {
  const grouped = {};
  resources.forEach((res, idx) => {
    if (!grouped[res.type]) grouped[res.type] = [];
    grouped[res.type].push({ ...res, idx });
  });
  const stats = [];
  Object.entries(grouped).forEach(([type, arr]) => {
    arr.forEach((res, i) => {
      const coveredHouses = getHousesCovered(res, houses);
      const residents = coveredHouses.reduce((sum, h) => sum + (h.residents || 0), 0);
      const students = type === "school"
        ? coveredHouses.reduce((sum, h) => sum + (h.students || 0), 0)
        : undefined;
      stats.push({
        type,
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
        houses: coveredHouses.length,
        residents,
        students,
        coveredHouses: coveredHouses.map(h => h.houseId)
      });
    });
  });
  return stats;
}

export default function PlanQualityScore() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [houses, setHouses] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const planDoc = await getDoc(doc(db, 'plans', planId));
      if (!planDoc.exists()) {
        setPlan(null);
        setLoading(false);
        return;
      }
      const planData = planDoc.data();
      setPlan(planData);
      // Fetch public houses
      const houseSnap = await getDocs(collection(db, 'houses'));
      const publicHouses = houseSnap.docs.map(doc => doc.data());
      // Fetch private houses from all user databases
      const privateHouses = await getAllDatabaseResources();
      // Merge houses, avoid duplicates by houseId
      const allHouses = [...publicHouses, ...privateHouses];
      const seen = new Set();
      const mergedHouses = allHouses.filter(h => {
        if (!h.houseId) return true;
        if (seen.has(h.houseId)) return false;
        seen.add(h.houseId);
        return true;
      });
      setHouses(mergedHouses);
      // Compute stats
      if (Array.isArray(planData.resources)) {
        const resources = planData.resources.map(r => ({
          ...r,
          position: { lat: r.lat, lng: r.lng }
        }));
        setStats(getAllResourceStats(resources, mergedHouses));
      }
      setLoading(false);
    }
    fetchData();
  }, [planId]);

  if (loading) return <div style={{ color: '#0ff', padding: 40 }}>Loading...</div>;
  if (!plan) return <div style={{ color: '#f55', padding: 40 }}>Plan not found.</div>;

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', background: '#181c24', color: '#0ff', borderRadius: 16, boxShadow: '0 0 24px #0ff4', padding: 32 }}>
      <h2 style={{ color: '#0ff', marginBottom: 16 }}>Plan Quality Score</h2>
      <div style={{ marginBottom: 24 }}>
        <b>Plan Name:</b> {plan.planName || plan.name || planId}
      </div>
      {stats.length === 0 ? (
        <div>No resources placed in this plan.</div>
      ) : (
        stats.map((stat, idx) => (
          <div key={idx} style={{ marginBottom: 18, borderBottom: '1px solid #0ff3', paddingBottom: 8 }}>
            <div><b>Resource:</b> {stat.label}</div>
            <div><b>Houses Covered:</b> {stat.houses}</div>
            <div><b>Residents Covered:</b> {stat.residents}</div>
            {stat.type === "school" && (
              <div><b>Students Covered:</b> {stat.students}</div>
            )}
          </div>
        ))
      )}
      <button onClick={() => navigate(-1)} style={{ marginTop: 24, background: '#0ff', color: '#181c24', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>Back</button>
    </div>
  );
}
