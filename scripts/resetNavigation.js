// Script to reset navigation to day 1
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase configuration (from your .env.local)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function resetNavigation() {
  try {
    const docRef = doc(db, 'userPreferences', 'default-user');
    await setDoc(docRef, {
      currentDay: 1,
      currentPage: 1,
      updatedAt: serverTimestamp(),
    });
    console.log('✅ Navigation reset to day 1!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting navigation:', error);
    process.exit(1);
  }
}

resetNavigation();
