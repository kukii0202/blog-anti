// Threads Content Script - Auto-fills Threads Composer
console.log('[BLODOCK Extension] Threads Content Script loaded.');

function attemptAutoFillThreads() {
  chrome.storage.local.get(['blodock_transfer_payload'], (result) => {
    const payload = result.blodock_transfer_payload;
    if (!payload) return;

    let textToInsert = '';
    if (payload.threads && payload.threads.length > 0) {
      textToInsert = payload.threads[0].text || payload.plainText;
    } else {
      textToInsert = payload.plainText || payload.title;
    }

    if (!textToInsert) return;

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const textbox = document.querySelector('[role="textbox"]') ||
                      document.querySelector('div[contenteditable="true"]');

      if (textbox) {
        clearInterval(interval);
        textbox.focus();

        try {
          document.execCommand('insertText', false, textToInsert);
        } catch (e) {
          textbox.innerText = textToInsert;
        }

        textbox.dispatchEvent(new Event('input', { bubbles: true }));
        showFloatingNotice('🟢 BLODOCK Threads 스레드 본문 자동 입력 완료!');
      }

      if (attempts >= 15) clearInterval(interval);
    }, 600);
  });
}

function showFloatingNotice(msg) {
  if (document.getElementById('blodock-threads-notice')) return;
  const banner = document.createElement('div');
  banner.id = 'blodock-threads-notice';
  banner.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999999;
    background: #000000;
    color: #ffffff;
    border: 1px solid #333;
    padding: 12px 20px;
    border-radius: 12px;
    font-weight: bold;
    font-size: 14px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    font-family: pretendard, -apple-system, sans-serif;
  `;
  banner.innerHTML = `<span>⚓ ${msg}</span>`;
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 4000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attemptAutoFillThreads);
} else {
  attemptAutoFillThreads();
}
