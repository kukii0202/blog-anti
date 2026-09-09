// Blogger Content Script
console.log('[BLODOCK Extension] Blogger Content Script loaded.');

function attemptAutoFillBlogger() {
  chrome.storage.local.get(['blodock_transfer_payload'], (result) => {
    const payload = result.blodock_transfer_payload;
    if (!payload || !payload.title) return;

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const titleInput = document.querySelector('input[aria-label*="제목"]') || document.querySelector('input[type="text"]');
      if (titleInput) {
        clearInterval(interval);
        titleInput.focus();
        titleInput.value = payload.title;
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        showFloatingNotice('🟢 BLODOCK Google Blogger 본문 & 제목 준비 완료!');
      }
      if (attempts >= 15) clearInterval(interval);
    }, 600);
  });
}

function showFloatingNotice(msg) {
  if (document.getElementById('blodock-blogger-notice')) return;
  const banner = document.createElement('div');
  banner.id = 'blodock-blogger-notice';
  banner.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999999;
    background: #ff5722;
    color: #ffffff;
    padding: 12px 20px;
    border-radius: 12px;
    font-weight: bold;
    font-size: 14px;
    box-shadow: 0 8px 24px rgba(255,87,34,0.4);
    font-family: pretendard, -apple-system, sans-serif;
  `;
  banner.innerHTML = `<span>⚓ ${msg}</span>`;
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 4000);
}

attemptAutoFillBlogger();
