// Naver Blog SmartEditor ONE Content Script
console.log('[BLODOCK Extension] Naver Blog SmartEditor ONE Content Script loaded.');

function attemptAutoFillNaverBlog() {
  chrome.storage.local.get(['blodock_transfer_payload'], (result) => {
    let payload = result.blodock_transfer_payload;

    if (!payload) {
      try {
        const raw = localStorage.getItem('bldock_naver_transfer_data');
        if (raw) payload = JSON.parse(raw);
      } catch (e) {}
    }

    if (!payload || !payload.title) return;

    injectIntoNaverEditor(payload);
  });
}

function injectIntoNaverEditor(payload) {
  let attempts = 0;
  const maxAttempts = 20;

  const interval = setInterval(() => {
    attempts++;

    // Try finding Naver SmartEditor ONE Title
    const titleInput = document.querySelector('.se-document-title input') ||
                       document.querySelector('.se-document-title textarea') ||
                       document.querySelector('input[placeholder*="제목"]') ||
                       document.querySelector('[class*="title"] input');

    // Try finding Naver SmartEditor ONE Main Body Container
    const bodyContainer = document.querySelector('.se-main-container') ||
                          document.querySelector('.se-component-content') ||
                          document.querySelector('.se-content');

    if (titleInput || bodyContainer) {
      clearInterval(interval);

      if (titleInput && payload.title) {
        titleInput.focus();
        titleInput.value = payload.title;
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        titleInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      if (bodyContainer && payload.contentHtml) {
        bodyContainer.focus();
        
        // Execute HTML paste into editor
        try {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(bodyContainer);
          selection.removeAllRanges();
          selection.addRange(range);

          document.execCommand('insertHTML', false, payload.contentHtml);
        } catch (e) {
          console.warn('[BLODOCK Extension] Direct insertHTML fallback:', e);
          bodyContainer.innerHTML = payload.contentHtml;
        }
      }

      showFloatingNotice('🟢 BLODOCK 본문 & 제목 원클릭 자동 입력 완료!');
    }

    if (attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 500);
}

function showFloatingNotice(msg) {
  if (document.getElementById('blodock-notice-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'blodock-notice-banner';
  banner.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999999;
    background: linear-gradient(135deg, #03c75a 0%, #029a45 100%);
    color: #ffffff;
    padding: 12px 20px;
    border-radius: 12px;
    font-weight: bold;
    font-size: 14px;
    box-shadow: 0 8px 24px rgba(3, 199, 90, 0.4);
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: pretendard, -apple-system, sans-serif;
  `;
  banner.innerHTML = `<span>⚓ ${msg}</span>`;

  document.body.appendChild(banner);
  setTimeout(() => {
    banner.style.opacity = '0';
    banner.style.transition = 'opacity 0.5s ease';
    setTimeout(() => banner.remove(), 500);
  }, 4000);
}

// Execute auto-fill check
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attemptAutoFillNaverBlog);
} else {
  attemptAutoFillNaverBlog();
}
