import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyARpgd3k-CCDnP4p_lm5F_WmXQmx6vPSng",
  authDomain: "manufacturing-complaint-system.firebaseapp.com",
  projectId: "manufacturing-complaint-system",
  storageBucket: "manufacturing-complaint-system.firebasestorage.app",
  messagingSenderId: "886725416574",
  appId: "1:886725416574:web:842aeb568881ea0bd5ea2f",
  measurementId: "G-MTX60QH7T7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
