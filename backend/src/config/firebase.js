const admin = require('firebase-admin');

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) return;
  
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } else {
    // Use application default credentials (Cloud Run)
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }
  console.log('Firebase Admin initialized');
}

module.exports = { admin, initializeFirebaseAdmin };
