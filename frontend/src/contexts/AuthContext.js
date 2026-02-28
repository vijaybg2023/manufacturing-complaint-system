import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function getIdToken() {
    if (!currentUser) return null;
    return currentUser.getIdToken();
  }

  async function signInWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  async function signInWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function registerWithEmail(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    setDbUser(null);
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          const res = await fetch('/api/users/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) setDbUser(await res.json());
        } catch (e) {
          console.error('Failed to load user profile:', e);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = { currentUser, dbUser, getIdToken, signInWithGoogle, signInWithEmail, registerWithEmail, logout, loading };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
