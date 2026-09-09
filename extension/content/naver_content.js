// Naver Blog SmartEditor ONE Content Script - Full Automation Engine
console.log('[BLODOCK Extension] Naver Blog SmartEditor ONE Full Automation loaded.');

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
  const maxAttempts = 30;

  const interval = setInterval(() => {
    attempts++;

    // Naver SmartEditor ONE Title Input
    const titleInput = document.querySelector('.se-document-title input') ||
                       document.querySelector('.se-document-title textarea') ||
                       document.querySelector('input[placeholder*="제목"]') ||
                       document.querySelector('[class*="title"] input') ||
                       document.querySelector('.se-title-text');

    // Naver SmartEditor ONE Main Body Container
    const bodyContainer = document.querySelector('.se-main-container') ||
                          document.querySelector('.se-component-content') ||
                          document.querySelector('.se-content') ||
                          document.querySelector('.se-component');

    if (titleInput || bodyContainer) {
      clearInterval(interval);

      // 1. Inject Title
      if (titleInput && payload.title) {
        titleInput.focus();
        if (titleInput.tagName === 'INPUT' || titleInput.tagName === 'TEXTAREA') {
          titleInput.value = payload.title;
        } else {
          titleInput.innerText = payload.title;
        }
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        titleInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 2. Inject HTML Content + Images
      if (bodyContainer && payload.contentHtml) {
        bodyContainer.focus();
        try {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(bodyContainer);
          selection.removeAllRanges();
          selection.addRange(range);

          document.execCommand('insertHTML', false, payload.contentHtml);
        } catch (e) {
          console.warn('[BLODOCK Extension] Fallback direct HTML injection:', e);
          bodyContainer.innerHTML = payload.contentHtml;
        }
      }

      // 3. Inject Tags if present
      if (payload.tags && payload.tags.length > 0) {
        injectTags(payload.tags);
      }

      // 4. Show Floating Auto-Publish Control Panel
      showFloatingNotice(payload);
    }

    if (attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 500);
}

function injectTags(tags) {
  setTimeout(() => {
    const tagInput = document.querySelector('.se-tag-input') ||
                     document.querySelector('input[placeholder*="태그"]') ||
                     document.querySelector('input[placeholder*="Tag"]');
    if (tagInput) {
      tagInput.focus();
      tags.forEach(tag => {
        tagInput.value = tag;
        tagInput.dispatchEvent(new Event('input', { bubbles: true }));
        tagInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
      });
    }
  }, 1000);
}

function triggerFinalPublishSequence() {
  // Step A: Click header publish button
  const headerPublishBtn = document.querySelector('.se-header-btn-publish') ||
                           document.querySelector('button[class*="publish"]') ||
                           document.querySelector('button.btn_publish') ||
                           document.querySelector('a.btn_publish');

  if (headerPublishBtn) {
    headerPublishBtn.click();

    // Step B: Click confirm publish button in popover after 800ms
    setTimeout(() => {
      const confirmPublishBtn = document.querySelector('.se-popup-button-confirm') ||
                                document.querySelector('button[class*="confirm"]') ||
                                document.querySelector('button[class*="submit"]');

      if (confirmPublishBtn) {
        confirmPublishBtn.click();
        showBannerStatus('🎉 네이버 블로그에 포스팅이 최종 100% 자동 발행되었습니다!');
      } else {
        showBannerStatus('🟢 발행 설정창이 열렸습니다. [발행] 버튼을 눌러 마무리하세요.');
      }
    }, 800);
  } else {
    showBannerStatus('🟢 글과 이미지가 모두 채워졌습니다. 우측 상단 [발행]을 누르세요!');
  }
}

function showFloatingNotice(payload) {
  if (document.getElementById('blodock-notice-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'blodock-notice-banner';
  banner.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999999;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #ffffff;
    padding: 16px 20px;
    border-radius: 16px;
    border: 1px solid #38bdf8;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-family: pretendard, -apple-system, sans-serif;
    min-width: 280px;
  `;

  banner.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <span style="font-size: 14px; font-weight: 800; color: #38bdf8;">⚓ BLODOCK 자동 발행 로봇</span>
      <span style="font-size: 11px; background: #03c75a; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold;">연동 완료</span>
    </div>
    <div id="blodock-status-txt" style="font-size: 12px; color: #cbd5e1; line-height: 1.4;">
      🟢 본문, 서식 및 이미지가 에디터에 자동 채워졌습니다!
    </div>
    <button id="btnTriggerAutoPublishNow" style="
      background: linear-gradient(135deg, #03c75a 0%, #029a45 100%);
      color: #ffffff;
      border: none;
      padding: 10px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(3, 199, 90, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    ">
      🚀 원클릭 최종 자동 발행 실행
    </button>
  `;

  document.body.appendChild(banner);

  document.getElementById('btnTriggerAutoPublishNow').addEventListener('click', () => {
    triggerFinalPublishSequence();
  });
}

function showBannerStatus(msg) {
  const statusTxt = document.getElementById('blodock-status-txt');
  if (statusTxt) {
    statusTxt.innerHTML = msg;
  }
}

// Execute auto-fill check
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attemptAutoFillNaverBlog);
} else {
  attemptAutoFillNaverBlog();
}
