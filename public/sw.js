// Service Worker for Bistro Mi Cafecito Background Push Notifications
const CACHE_NAME = 'bistro-notification-session-v1';
const FIRESTORE_REST_URL = 'https://firestore.googleapis.com/v1/projects/amazing-list-khh41/databases/ai-studio-fa7ffa24-2cc3-493d-81b3-17037139b0df/documents/notifications';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Helper to save/load the active session details using Cache API (since localStorage is unavailable in SW)
async function saveSession(session) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const dataResponse = new Response(JSON.stringify(session), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put('/api-session-details', dataResponse);
  } catch (e) {
    console.error('Error saving session in cache:', e);
  }
}

async function loadSession() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match('/api-session-details');
    if (response) {
      return await response.json();
    }
  } catch (e) {
    console.error('Error reading session from cache:', e);
  }
  return null;
}

// Receive active folio and details from the main React thread
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'SET_SESSION') {
    await saveSession(event.data.session);
    console.log('[SW] Guardado de sesión de fidelidad ok:', event.data.session);
    
    // Trigger immediate check
    checkBackgroundNotifications();
  }
});

// Map of displayed notification IDs to prevent duplicates
let notifiedIds = new Set();

async function checkBackgroundNotifications() {
  const session = await loadSession();
  if (!session || !session.folio) {
    return;
  }

  try {
    const response = await fetch(FIRESTORE_REST_URL);
    if (!response.ok) return;

    const data = await response.json();
    if (!data.documents) return;

    // Filter and find the latest notification that matches the user's folio or "all"
    for (const doc of data.documents) {
      const fields = doc.fields;
      if (!fields) continue;

      const id = fields.id?.stringValue;
      const title = fields.title?.stringValue || 'Aviso de Bistro Mi Cafecito';
      const body = fields.body?.stringValue || '';
      const targetCustomerFolio = fields.targetCustomerFolio?.stringValue || '';
      const timestampStr = fields.timestamp?.stringValue;
      const iconType = fields.icon?.stringValue || 'coffee';

      if (!id || notifiedIds.has(id)) continue;

      // Check if it's addressed to everyone ('all') or to this specific customer
      const isForMe = targetCustomerFolio === 'all' || targetCustomerFolio === session.folio;

      // Keep only notifications that are relatively current
      const notiTime = timestampStr ? new Date(timestampStr).getTime() : Date.now();
      const fiveMinutesAgo = Date.now() - (10 * 60 * 1000); // Only notify within last 10 minutes

      if (isForMe && notiTime > fiveMinutesAgo) {
        // Register it as notified to avoid double popups
        notifiedIds.add(id);

        // Map icons to emojis or localized titles
        let emoji = '☕';
        if (iconType === 'promo') emoji = '✨';
        if (iconType === 'cake') emoji = '🍰';
        if (iconType === 'gift') emoji = '🎁';
        if (iconType === 'alert') emoji = '🔔';

        // Display standard OS system notification from the Service Worker background context
        await self.registration.showNotification(`${emoji} ${title}`, {
          body: body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: id, // unique tag to avoid duplicate stacking
          renotify: true,
          vibrate: [200, 100, 200]
        });
      }
    }
  } catch (error) {
    console.error('[SW] Error checking background notifications:', error);
  }
}

// Background poller loop. When the browser or system keeps the Service Worker process alive in the background,
// it will poll Firestore every 25 seconds to check for any fresh alerts instantly.
setInterval(() => {
  checkBackgroundNotifications();
}, 25000);

// Also look up on startup
checkBackgroundNotifications();
