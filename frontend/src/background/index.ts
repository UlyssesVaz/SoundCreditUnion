console.log('Sound CU Co-Pilot: Background service worker started.');

// Optional: Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed for the first time');
    // Could open a welcome page here later
  }
});