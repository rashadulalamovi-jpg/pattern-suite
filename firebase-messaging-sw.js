/* FCM background handler — index.html-এর পাশে একই folder-এ রাখুন।
নিচের FB_CONFIG-এ index.html-এর হুবহু একই config বসান। */
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');

firebase.initializeApp({
   apiKey: "AIzaSyB6BZuchGQ-i87jHhVHtgiS0bohsXXufhk",
   authDomain: "ctg-click-shop-crm.firebaseapp.com",
   projectId: "ctg-click-shop-crm",
   storageBucket: "ctg-click-shop-crm.firebasestorage.app",
   messagingSenderId: "418153694896",
   appId: "1:418153694896:web:9821e895e5f41d441ddd75"
});

const ICON='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#bd2020"/><g fill="none" stroke="#fff" stroke-width="5"><circle cx="32" cy="32" r="18"/><circle cx="32" cy="32" r="10"/></g><circle cx="32" cy="32" r="4" fill="#fff"/></svg>');

const messaging = firebase.messaging();
messaging.onBackgroundMessage(function(payload){
   const n = (payload && (payload.notification || payload.data)) || {};
   self.registration.showNotification(n.title || 'Reminder', {
      body: n.body || '⏰ আপনার নির্ধারিত সময় হয়েছে।',
      icon: ICON, badge: ICON, tag: 'ctg-rem'
   });
});

self.addEventListener('notificationclick', function(e){
   e.notification.close();
   e.waitUntil(clients.matchAll({type:'window'}).then(function(list){
      for(const c of list){ if('focus' in c) return c.focus(); }
      if(clients.openWindow) return clients.openWindow('./');
   }));
});
