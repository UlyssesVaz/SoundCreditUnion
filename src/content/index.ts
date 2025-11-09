import { mountOverlay } from './overlay';
// REMOVED: import './styles.css';  <-- handled by overlay.tsx now

console.log('Sound CU Co-Pilot: Content script injected.');

// --- DEBUG MODE ON ---
console.log('DEBUG MODE: Force mounting Shadow DOM overlay...');
mountOverlay();

// --- NORMAL LOGIC (Commented out) ---
/*
if (window.location.hostname.includes('amazon') || window.location.hostname.includes('ebay')) {
    console.log('Shopping site detected!');
    setTimeout(mountOverlay, 1000);
}
*/