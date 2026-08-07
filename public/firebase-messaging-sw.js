importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDnV6fj-4Sul45w7SNW4WT4MWuEAJF2Y6k",
  authDomain: "bookmyauditorium-81514.firebaseapp.com",
  projectId: "bookmyauditorium-81514",
  storageBucket: "bookmyauditorium-81514.firebasestorage.app",
  messagingSenderId: "876749603919",
  appId: "1:876749603919:web:37d7786c31cf8db201163a",
  measurementId: "G-S4L5S2N4Q6"
};

// Force immediate activation so we don't get stuck with old cached Service Workers
self.addEventListener('install', function(event) {
  self.skipWaiting();
});
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

// Initialize Firebase App
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Optional: Background message handler
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload?.notification?.title || payload?.data?.title || payload?.title || "Book My Auditorium";
  const notificationOptions = {
    body: payload?.notification?.body || payload?.data?.body || payload?.data?.message || payload?.body || "New update received",
    icon: 'https://backendappwrite.vercel.app/logos/logo4.jpg',
    badge: 'https://backendappwrite.vercel.app/logos/logo4.jpg',
    vibrate: [200, 100, 200],
    tag: payload?.data?.bookingId || 'bma-push',
    renotify: true,
    data: payload?.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
