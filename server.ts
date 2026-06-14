import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  where 
} from "firebase/firestore";
import webPush from "web-push";
import firebaseConfig from "./firebase-applet-config.json";

// Initialize Firebase with config
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const app = express();
const PORT = 3000;

app.use(express.json());

// Stable memory container for VAPID Keys
let vapidKeys: { publicKey: string; privateKey: string } | null = null;

// Retrieve or dynamically generate stable VAPID key pairs within Firestore configuration space
async function getOrCreateVapidKeys() {
  if (vapidKeys) return vapidKeys;
  try {
    const docRef = doc(db, "config", "vapid_keys");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      vapidKeys = docSnap.data() as { publicKey: string; privateKey: string };
      console.log("[SERVER] VAPID keys loaded from Firestore configuration documents.");
    } else {
      const generated = webPush.generateVAPIDKeys();
      vapidKeys = {
        publicKey: generated.publicKey,
        privateKey: generated.privateKey
      };
      await setDoc(docRef, vapidKeys);
      console.log("[SERVER] VAPID keys generated and persisted successfully inside Firestore config.");
    }
  } catch (error) {
    console.error("[SERVER] Error retrieving stable VAPID config:", error);
    // Temporary fallback on absolute emergency database lookup failures
    if (!vapidKeys) {
      const generated = webPush.generateVAPIDKeys();
      vapidKeys = { publicKey: generated.publicKey, privateKey: generated.privateKey };
    }
  }
  return vapidKeys;
}

// Setup global webpush keys
async function configureWebPush() {
  try {
    const keys = await getOrCreateVapidKeys();
    webPush.setVapidDetails(
      "mailto:soporte@bistromicafecito.com",
      keys.publicKey,
      keys.privateKey
    );
    console.log("[SERVER] Web Push module initialized successfully.");
  } catch (err) {
    console.error("[SERVER] Failed to configure push credentials:", err);
  }
}

// API: Get VAPID Public Key for client browser subscriptions
app.get("/api/push-public-key", async (req, res) => {
  try {
    const keys = await getOrCreateVapidKeys();
    res.json({ publicKey: keys.publicKey });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to retrieve public key" });
  }
});

// API: Broadcast real Web Push notifications instantly to target client devices.
// This handles sending push updates to browsers when they are fully minimized, closed, or locked in iOS/Android.
app.post("/api/send-push", async (req, res) => {
  const { title, body, targetCustomerFolio, icon } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: "Missing notification parameters" });
  }

  try {
    await configureWebPush();

    // Fetch active push subscriptions from Firestore
    const subscriptionsRef = collection(db, "push_subscriptions");
    let snapshot;

    if (targetCustomerFolio && targetCustomerFolio !== "all") {
      // Query specific customer folio
      const q = query(subscriptionsRef, where("folio", "==", targetCustomerFolio));
      snapshot = await getDocs(q);
    } else {
      // Fetch all customer subscriptions
      snapshot = await getDocs(subscriptionsRef);
    }

    const recipients: any[] = [];
    snapshot.forEach((docSnap) => {
      recipients.push({ docId: docSnap.id, ...docSnap.data() });
    });

    console.log(`[PUSH] Found ${recipients.length} target subscriptions for folio [${targetCustomerFolio}].`);

    if (recipients.length === 0) {
      return res.json({ status: "success", deliveredCount: 0, message: "No subscribers found" });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || "coffee",
      url: "/"
    });

    const sendPromises = recipients.map(async (rec) => {
      if (!rec.subscription) return;
      try {
        await webPush.sendNotification(rec.subscription, payload);
        console.log(`[PUSH] Success payload delivery to subscription user: [${rec.folio}]`);
      } catch (err: any) {
        console.warn(`[PUSH] Subscription error or expired token for User ${rec.folio}:`, err.message);
        // Note: In a production environment we can optionally purge stale subscriptions
      }
    });

    await Promise.all(sendPromises);
    res.json({ status: "success", deliveredCount: recipients.length });
  } catch (err: any) {
    console.error("[SERVER] Error sending web push notifications:", err);
    res.status(500).json({ error: err.message || "Push dispatch failed" });
  }
});

// Setup Vite and serve routes
async function startServer() {
  await configureWebPush();

  // Vite development middleware or static production handler
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Running full-stack on http://0.0.0.0:${PORT}`);
  });
}

startServer();
