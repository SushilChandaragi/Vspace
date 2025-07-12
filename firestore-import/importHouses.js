const admin = require("firebase-admin");
const fs = require("fs");

// Load your service account key
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Load your house data
const houses = JSON.parse(fs.readFileSync("belgaum_house_dataset.json", "utf8"));

async function importData() {
  for (const house of houses) {
    // Add lat/long fields for compatibility
    const docId = house.houseId || undefined;
    await db.collection("houses").doc(docId).set({
      ...house,
      lat: house.latitude,
      long: house.longitude,
    });
    console.log(`Imported house ${docId}`);
  }
  console.log("Import complete!");
  process.exit();
}

importData();