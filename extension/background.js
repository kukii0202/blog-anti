// BLODOCK Extension Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('[BLODOCK Extension] Extension installed successfully.');
});

// Listener for cross-script messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'BLODOCK_PAYLOAD_UPDATE') {
    chrome.storage.local.set({ blodock_transfer_payload: message.payload }, () => {
      console.log('[BLODOCK Extension] Payload stored in chrome.storage:', message.payload);
      sendResponse({ status: 'ok' });
    });
    return true; // Keep message channel open for async response
  }

  if (message.type === 'GET_BLODOCK_PAYLOAD') {
    chrome.storage.local.get(['blodock_transfer_payload'], (result) => {
      sendResponse({ payload: result.blodock_transfer_payload || null });
    });
    return true;
  }
});
