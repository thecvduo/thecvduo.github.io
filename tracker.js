// ===================================================================
// Visitor tracker — logs a pageview each time someone opens a page.
// Records: which page, approximate city/country (from IP), device
// type, referrer, and the exact time. Loaded on every public page
// except admin.html.
// ===================================================================

import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function getVisitorId() {
  try {
    let id = localStorage.getItem('cvduo_visitor_id');
    if (!id) {
      id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('cvduo_visitor_id', id);
    }
    return id;
  } catch (err) {
    // localStorage unavailable (e.g. private browsing) — fall back to a per-load id
    return 'v_' + Date.now().toString(36);
  }
}

function getPagePath() {
  const last = window.location.pathname.split('/').filter(Boolean).pop();
  return last || 'index.html';
}

async function getLocation() {
  try {
    const res = await fetch('https://free.freeipapi.com/api/json');
    if (!res.ok) return {};
    const data = await res.json();
    return {
      country: data.countryName || '',
      city: data.cityName || '',
      region: data.regionName || ''
    };
  } catch (err) {
    return {};
  }
}

async function track() {
  const location = await getLocation();

  try {
    await addDoc(collection(db, 'pageviews'), {
      page: getPagePath(),
      visitorId: getVisitorId(),
      referrer: document.referrer || '',
      userAgent: navigator.userAgent || '',
      language: navigator.language || '',
      country: location.country || '',
      city: location.city || '',
      region: location.region || '',
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error('visitor tracking failed', err);
  }
}

track();
