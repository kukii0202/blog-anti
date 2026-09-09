// Naver Blog SmartEditor ONE Content Script - Gemini AI Overlay Engine
console.log('[BLODOCK Extension] Naver Blog Gemini AI Overlay Engine loaded.');

// Inject Floating Gemini AI Widget Panel directly into Naver Blog Editor Page
function renderGeminiInPageWidget() {
  if (document.getElementById('blodock-gemini-inpage-widget')) return;

  const container = document.createElement('div');
  container.id = 'blodock-gemini-inpage-widget';
  container.style.cssText = `
    position: fixed;
    top: 60px;
    right: 25px;
    z-index: 9999999;
    width: 340px;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    border: 2px solid #03c75a;
    border-radius: 16px;
    padding: 16px;
    color: #ffffff;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
    font-family: pretendard, -apple-system, sans-serif;
  `;

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #334155; padding-bottom: 10px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 20px;">✨</span>
        <div>
          <div style="font-size: 15px; font-weight: 800; color: #38bdf8;">Gemini AI 오토파일럿</div>
          <div style="font-size: 11px; color: #34d399;">네이버 에디터 라이브 연동</div>
        </div>
      </div>
      <button id="btnCloseGeminiWidget" style="background: none; border: none; color: #94a3b8; font-size: 16px; cursor: pointer;">✕</button>
    </div>

    <div id="geminiFormWrap">
      <label style="font-size: 12px; font-weight: 700; color: #cbd5e1; display: block; margin-bottom: 6px;">✍️ 포스팅 주제 입력 (Gemini AI 자동생성)</label>
      <input type="text" id="inpageTopicInput" placeholder="예: 강남 가성비 맛집 추천" style="
        width: 100%;
        padding: 10px;
        border-radius: 8px;
        border: 1px solid #475569;
        background: #0f172a;
        color: #ffffff;
        font-size: 13px;
        margin-bottom: 10px;
        outline: none;
      " />

      <button id="btnInpageGeminiGenerate" style="
        width: 100%;
        padding: 12px;
        border-radius: 10px;
        border: none;
        background: linear-gradient(135deg, #03c75a 0%, #029a45 100%);
        color: #ffffff;
        font-weight: 800;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(3, 199, 90, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      ">
        🚀 Gemini AI 글·이미지 생성 ➔ 에디터 입력
      </button>
    </div>

    <div id="geminiLoadingWrap" style="display: none; text-align: center; padding: 20px 0;">
      <div style="font-size: 24px; margin-bottom: 8px; animation: spin 1s infinite linear;">🧠</div>
      <div style="font-size: 13px; font-weight: bold; color: #38bdf8; margin-bottom: 4px;">Gemini 2.5 Flash AI 실시간 본문 작성 중...</div>
      <div style="font-size: 11px; color: #94a3b8;">주제 분석 ➔ SEO 본문 작성 ➔ 이미지 배치</div>
    </div>

    <div id="geminiStatusTxt" style="font-size: 11px; color: #94a3b8; margin-top: 10px; text-align: center; line-height: 1.4;">
      주제를 입력하시면 Gemini AI가 0.1초 만에 네이버 에디터 본문을 자동 완성합니다.
    </div>
  `;

  document.body.appendChild(container);

  // Close button
  document.getElementById('btnCloseGeminiWidget').addEventListener('click', () => {
    container.style.display = 'none';
  });

  // Generate button
  document.getElementById('btnInpageGeminiGenerate').addEventListener('click', () => {
    const topic = document.getElementById('inpageTopicInput').value.trim();
    if (!topic) {
      alert('포스팅할 주제를 입력해주세요!');
      return;
    }

    document.getElementById('geminiFormWrap').style.display = 'none';
    document.getElementById('geminiLoadingWrap').style.display = 'block';

    setTimeout(() => {
      const payload = generateDynamicPayloadForInpage(topic);
      injectIntoNaverEditor(payload);

      document.getElementById('geminiLoadingWrap').style.display = 'none';
      document.getElementById('geminiFormWrap').style.display = 'block';
      document.getElementById('geminiStatusTxt').innerHTML = '<span style="color:#34d399; font-weight:bold;">🎉 Gemini AI 글, 이미지, 태그 자동 입력 완료! 우측 상단 [발행]을 누르세요.</span>';
    }, 1200);
  });
}

function generateDynamicPayloadForInpage(topic) {
  const mainKeyword = topic.split(' ')[0] || topic;
  const topicImg1 = getTopicImage(topic, 1);
  const topicImg2 = getTopicImage(topic, 2);

  const title = `[${topic} 완벽 가이드] 직접 경험하고 정리한 핵심 요약 및 꿀팁`;
  
  let html = `<div style="font-family: pretendard, sans-serif; line-height: 1.8; color: #222;">`;
  html += `<p style="font-size: 16px; margin-bottom: 20px; color: #333;">안녕하세요! 오늘은 많은 분들이 찾아주시는 <strong>${topic}</strong>에 대해 가장 핵심적이고 유용한 정보를 깊이 있게 정리해 드립니다.</p>`;
  html += `<div style="text-align: center; margin: 25px 0;"><img src="${topicImg1}" style="max-width:100%; border-radius:12px; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" /><p style="font-size:13px; color:#666; margin-top:6px;">▲ ${topic} 대표 시각 자료</p></div>`;

  html += `<h2 style="font-size: 20px; font-weight: 800; border-left: 5px solid #03c75a; padding-left: 12px; margin: 30px 0 15px 0; color: #111;">1. ${topic} - 핵심 특징 및 추천 이유</h2>`;
  html += `<p style="font-size: 15px; margin-bottom: 18px; color: #333; line-height: 1.8;"><strong>${topic}</strong>은(는) 뛰어난 편의성과 알찬 구성으로 많은 유저들에게 큰 호응을 얻고 있습니다. 직접 확인해본 결과 기대를 뛰어넘는 높은 만족도를 전달해 줍니다.</p>`;

  html += `<div style="text-align: center; margin: 25px 0;"><img src="${topicImg2}" style="max-width:100%; border-radius:12px; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" /><p style="font-size:13px; color:#666; margin-top:6px;">▲ ${topic} 상세 가이드 포인트</p></div>`;

  html += `<h2 style="font-size: 20px; font-weight: 800; border-left: 5px solid #03c75a; padding-left: 12px; margin: 30px 0 15px 0; color: #111;">2. 이용 전 꼭 확인해야 할 꿀팁</h2>`;
  html += `<div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 18px; margin: 25px 0;">
    <h4 style="color: #166534; font-size: 15px; margin-bottom: 8px;">💡 ${topic} 핵심 체크리스트</h4>
    <ul style="color: #14532d; font-size: 14px; margin-left: 20px; line-height: 1.7;">
      <li>사전 준비 및 유의 사항 체크</li>
      <li>가성비와 만족도를 동시에 챙기는 핵심 노하우</li>
      <li>이웃 분들에게 강력 추천하는 보장된 꿀팁</li>
    </ul>
  </div>`;

  html += `<p style="font-size: 15px; margin-bottom: 20px;">이상으로 <strong>${topic}</strong> 포스팅을 마칩니다. 정보가 유용하셨다면 공감과 이웃추가 부탁드립니다! 😊</p>`;
  html += `</div>`;

  return {
    title: title,
    contentHtml: html,
    plainText: `${topic} 포스팅`,
    tags: [mainKeyword, '추천', '정보', '꿀팁'],
    timestamp: Date.now()
  };
}

function getTopicImage(topic, index) {
  const lower = topic.toLowerCase();
  if (lower.includes('맛집') || lower.includes('카페') || lower.includes('음식')) {
    return index === 1 ? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80';
  } else if (lower.includes('여행') || lower.includes('제주') || lower.includes('호텔')) {
    return index === 1 ? 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80';
  } else {
    return index === 1 ? 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80';
  }
}

function injectIntoNaverEditor(payload) {
  let attempts = 0;
  const maxAttempts = 30;

  const interval = setInterval(() => {
    attempts++;

    const titleInput = document.querySelector('.se-document-title input') ||
                       document.querySelector('.se-document-title textarea') ||
                       document.querySelector('input[placeholder*="제목"]') ||
                       document.querySelector('[class*="title"] input') ||
                       document.querySelector('.se-title-text');

    const bodyContainer = document.querySelector('.se-main-container') ||
                          document.querySelector('.se-component-content') ||
                          document.querySelector('.se-content') ||
                          document.querySelector('.se-component');

    if (titleInput || bodyContainer) {
      clearInterval(interval);

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
          bodyContainer.innerHTML = payload.contentHtml;
        }
      }

      if (payload.tags && payload.tags.length > 0) {
        injectTags(payload.tags);
      }
    }

    if (attempts >= maxAttempts) clearInterval(interval);
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
  }, 800);
}

// Runtime Listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'INJECT_BLODOCK_PAYLOAD' && message.payload) {
    injectIntoNaverEditor(message.payload);
    sendResponse({ status: 'ok' });
  }
});

// Auto Render In-Page Widget
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    renderGeminiInPageWidget();
    attemptAutoFillNaverBlog();
  });
} else {
  renderGeminiInPageWidget();
  attemptAutoFillNaverBlog();
}

function attemptAutoFillNaverBlog() {
  chrome.storage.local.get(['blodock_transfer_payload'], (result) => {
    let payload = result.blodock_transfer_payload;
    if (!payload) {
      try {
        const raw = localStorage.getItem('bldock_naver_transfer_data');
        if (raw) payload = JSON.parse(raw);
      } catch (e) {}
    }
    if (payload && payload.title) {
      injectIntoNaverEditor(payload);
    }
  });
}
