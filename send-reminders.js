/* Reminder sender — GitHub Actions cron দিয়ে চলে (Blaze লাগে না)।
   প্রতিটা enabled reminder-এর নির্ধারিত সময়ে (Asia/Dhaka) FCM push পাঠায়। */
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
});
const db = admin.firestore();
const msg = admin.messaging();

// বর্তমান Bangladesh সময় (UTC+6)
const nowUTC = new Date();
const bd = new Date(nowUTC.getTime() + 6 * 3600 * 1000);
const hh = String(bd.getUTCHours()).padStart(2, '0');
const mm = String(bd.getUTCMinutes()).padStart(2, '0');
const curHM = hh + ':' + mm;
const day = bd.getUTCDay();              // 0=রবি ... 6=শনি
const today = bd.toISOString().split('T')[0];
const WINDOW = 10;                        // workflow প্রতি ~10 মিনিটে চলে

function diffMin(a, b) { // "HH:MM" পার্থক্য মিনিটে
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return Math.abs((ah * 60 + am) - (bh * 60 + bm));
}

(async () => {
  const userRefs = await db.collection('users').listDocuments();
  let sent = 0;
  for (const uref of userRefs) {
    const remSnap = await uref.collection('state').doc('ctg-reminders-v1').get();
    if (!remSnap.exists) continue;
    let list = [];
    try { list = JSON.parse(remSnap.data().json || '[]'); } catch (e) { continue; }

    const due = list.filter(r =>
      r && r.on && r.time &&
      diffMin(r.time, curHM) <= WINDOW &&
      (!r.days || !r.days.length || r.days.indexOf(day) >= 0) &&
      r.srvLast !== today + ' ' + r.time
    );
    if (!due.length) continue;

    // tokens
    const tokSnap = await uref.collection('tokens').get();
    const tokens = tokSnap.docs.map(d => d.id);
    if (!tokens.length) continue;

    for (const r of due) {
      try {
        await msg.sendEachForMulticast({
          tokens,
          notification: { title: r.label || 'Reminder', body: '⏰ আপনার নির্ধারিত সময় হয়েছে।' },
          webpush: { fcmOptions: { link: '/' } }
        });
        r.srvLast = today + ' ' + r.time;
        sent++;
      } catch (e) { console.error('send err', e.message); }
    }
    // srvLast আপডেট করে দ্বৈত notification ঠেকানো
    await uref.collection('state').doc('ctg-reminders-v1').set(
      { json: JSON.stringify(list), ts: Date.now() }, { merge: true }
    );
  }
  console.log('Done. notifications sent:', sent, 'at BD', curHM);
})();
