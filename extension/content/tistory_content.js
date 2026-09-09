// Tistory Content Script
console.log('[BLODOCK Extension] Tistory Content Script loaded.');

function attemptAutoFillTistory() {
  chrome.storage.local.get(['blodock_transfer_payload'], (result) => {
    const payload = result.blodock_transfer_payload;
    if (!payload || !payload.title) return;

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const titleInput = document.querySelector('#post-title-inp') || document.querySelector('input[name="title"]');
      if (titleInput) {
        clearInterval(interval);
        titleInput.focus();
        titleInput.value = payload.title;
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        showFloatingNotice('🟢 BLODOCK 티스토리 본문 & 제목 준비 완료!');
      }
      if (attempts >= 15) clearInterval(interval);
    }, 600);
  });
}

function showFloatingNotice(msg) {
  if (document.getElementById('blodock-tistory-notice')) return;
  const banner = document.createElement('div');
  banner.id = 'blodock-tistory-notice';
  banner.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999999;
    background: #ff5000;
    color: #ffffff;
    padding: 12px 20px;
    border-radius: 12px;
    font-weight: bold;
    font-size: 14px;
    box-shadow: 0 8px 24px rgba(255,80,0,0.4);
    font-family: pretendard, -apple-system, sans-serif;
  `;
  banner.innerHTML = `<span>⚓ ${msg}</span>`;
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 4000);
}

attemptAutoFillTistory();
