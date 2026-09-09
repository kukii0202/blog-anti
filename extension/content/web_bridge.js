// Web Bridge Content Script - Listens to messages from BLODOCK Web App
console.log('[BLODOCK Extension] Web Bridge active on BLODOCK web app.');

window.addEventListener('message', (event) => {
  if (!event.data || typeof event.data !== 'object') return;

  if (event.data.type === 'BLODOCK_NAVER_TRANSFER' || event.data.type === 'BLODOCK_UNIVERSAL_TRANSFER') {
    const payload = event.data;
    chrome.runtime.sendMessage({
      type: 'BLODOCK_PAYLOAD_UPDATE',
      payload: payload
    }, (response) => {
      console.log('[BLODOCK Extension] Web Bridge synced payload to extension storage.', response);
    });
  }
});
