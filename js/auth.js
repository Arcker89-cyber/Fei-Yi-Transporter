// auth.js - ระบบตรวจสอบ Authentication สำหรับหน้า Admin

import { auth } from './firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// ตรวจสอบว่า user login หรือยัง
export function requireAuth() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        console.log('✅ User authenticated:', user.email);
        resolve(user);
      } else {
        // User is not signed in
        console.log('❌ User not authenticated, redirecting to login...');
        window.location.href = 'admin-login.html';
        reject('Not authenticated');
      }
    });
  });
}

// Logout function
export async function logout() {
  try {
    await signOut(auth);
    console.log('✅ Logout successful');
    window.location.href = 'admin-login.html';
  } catch (error) {
    console.error('❌ Logout error:', error);
    if (typeof showError === 'function') {
      await showError('เกิดข้อผิดพลาดในการออกจากระบบ');
    } else {
      alert('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
  }
}

// Get current user
export function getCurrentUser() {
  return auth.currentUser;
}

// ใช้ฟังก์ชันนี้ในทุกหน้า admin
// เพียงแค่ import และเรียก requireAuth()
