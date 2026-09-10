document.addEventListener('DOMContentLoaded', () => {
  const bindTabButton = document.getElementById('bindTabButton');
  const contextStatus = document.getElementById('contextStatus');
  const postingModeInput = document.getElementById('postingModeInput');
  const selectAiEngine = document.getElementById('selectAiEngine');
  const inputTopic = document.getElementById('inputTopic');
  const inputKeywords = document.getElementById('inputKeywords');
  const selectImageStyle = document.getElementById('selectImageStyle');
  const selectImageCount = document.getElementById('selectImageCount');
  const btnGenerateAll = document.getElementById('btnGenerateAll');
  const previewCard = document.getElementById('previewCard');
  const previewTitle = document.getElementById('previewTitle');
  const previewContainer = document.getElementById('previewContainer');
  const btnInjectActiveTab = document.getElementById('btnInjectActiveTab');

  let currentActiveTab = null;
  let generatedPayload = null;

  // 1. Initial Tab Detection
  checkActiveTab();

  bindTabButton.addEventListener('click', () => {
    checkActiveTab(true);
  });

  async function checkActiveTab(userClicked = false) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        currentActiveTab = tab;
        const url = tab.url || '';
        
        if (url.includes('blog.naver.com') || url.includes('editor.naver.com')) {
          contextStatus.innerHTML = `🟢 <strong>네이버 블로그 에디터</strong> 연결됨: ${escapeHtml(tab.title || '')}`;
          postingModeInput.value = 'blog';
        } else if (url.includes('cafe.naver.com')) {
          contextStatus.innerHTML = `🟢 <strong>네이버 카페 에디터</strong> 연결됨: ${escapeHtml(tab.title || '')}`;
          postingModeInput.value = 'blog';
        } else if (url.includes('threads.net') || url.includes('threads.com')) {
          contextStatus.innerHTML = `🟢 <strong>Threads (스레드)</strong> 연결됨: ${escapeHtml(tab.title || '')}`;
          postingModeInput.value = 'threads';
        } else if (url.includes('instagram.com')) {
          contextStatus.innerHTML = `🟢 <strong>Instagram (인스타그램)</strong> 연결됨: ${escapeHtml(tab.title || '')}`;
          postingModeInput.value = 'instagram';
        } else if (url.includes('blogger.com') || url.includes('tistory.com')) {
          contextStatus.innerHTML = `🟢 <strong>블로그 에디터</strong> 연결됨: ${escapeHtml(tab.title || '')}`;
          postingModeInput.value = 'blog';
        } else {
          contextStatus.innerHTML = `🌐 현재 탭: ${escapeHtml(tab.title || '일반 웹페이지')} (글쓰기 페이지로 이동 시 1초 자동인식)`;
        }

        if (userClicked) {
          showToast('🟢 현재 탭이 성공적으로 연결되었습니다!');
        }
      }
    } catch (e) {
      console.warn('Tab query failed:', e);
    }
  }

  // 2. Generate Content & Images
  btnGenerateAll.addEventListener('click', () => {
    const topic = inputTopic.value.trim();
    if (!topic) {
      alert('포스팅할 주제를 입력해 주세요!');
      inputTopic.focus();
      return;
    }

    btnGenerateAll.disabled = true;
    btnGenerateAll.textContent = '⏳ Gemini AI 본문 & 이미지 생성 중...';

    setTimeout(() => {
      generatedPayload = generateAiPayload(
        topic,
        inputKeywords.value.trim(),
        postingModeInput.value,
        selectImageCount.value,
        selectImageStyle.value
      );

      previewTitle.textContent = generatedPayload.title;
      previewContainer.innerHTML = generatedPayload.contentHtml;

      previewCard.classList.remove('hidden');
      btnGenerateAll.disabled = false;
      btnGenerateAll.textContent = '✨ AI 글 · 이미지 생성하기';
    }, 1000);
  });

  // 3. Inject Payload into Active Tab
  btnInjectActiveTab.addEventListener('click', async () => {
    if (!generatedPayload) return;

    btnInjectActiveTab.disabled = true;
    btnInjectActiveTab.textContent = '🚀 에디터로 데이터 자동 채우는 중...';

    // Store in chrome.storage.local
    chrome.storage.local.set({ blodock_transfer_payload: generatedPayload }, async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'INJECT_BLODOCK_PAYLOAD',
          payload: generatedPayload
        }, (response) => {
          btnInjectActiveTab.disabled = false;
          btnInjectActiveTab.textContent = '🚀 연결된 탭에 0.1초 자동 채우기';
          
          if (chrome.runtime.lastError) {
            // Tab was not on write page -> open write page
            chrome.tabs.create({ url: 'https://blog.naver.com/MyBlog.naver?Redirect=Write' });
          } else {
            showToast('🎉 에디터에 제목, 본문, 이미지, 태그가 자동 입력되었습니다!');
          }
        });
      }
    });
  });

  function generateAiPayload(topic, subKwStr, mode, imgCount, style) {
    const mainKeyword = topic.split(' ')[0] || topic;
    const subKws = subKwStr ? subKwStr.split(',').map(s => s.trim()) : [mainKeyword, '추천', '정보', '꿀팁'];
    const count = parseInt(imgCount) || 3;

    const topicImages = [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80'
    ];

    const title = `[${topic} 완벽 정리] 솔직 후기부터 꼭 알아야 할 꿀팁 총정리`;
    let html = `<div style="font-family: pretendard, sans-serif; line-height: 1.8; color: #222;">`;
    html += `<p style="font-size: 16px; margin-bottom: 20px; color: #333;">안녕하세요! 오늘은 많은 분들이 관심 가져주시는 <strong>${topic}</strong>에 대해 가장 알차고 핵심적인 정보를 깊이 있게 전달해 드리겠습니다.</p>`;

    if (count >= 1) {
      html += `<div style="text-align: center; margin: 25px 0;"><img src="${topicImages[0]}" style="max-width:100%; border-radius:12px; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" /><p style="font-size:13px; color:#666; margin-top:6px;">▲ ${topic} 대표 비주얼</p></div>`;
    }

    html += `<h2 style="font-size: 20px; font-weight: 800; border-left: 5px solid #03c75a; padding-left: 12px; margin: 30px 0 15px 0; color: #111;">1. ${topic} 핵심 포인트 및 특징</h2>`;
    html += `<p style="font-size: 15px; margin-bottom: 18px; color: #333; line-height: 1.8;"><strong>${topic}</strong>은(는) 뛰어난 편의성과 만족도를 바탕으로 최근 큰 인기를 얻고 있습니다. 사전 정보를 숙지하고 접근하시면 더욱 큰 효과를 보실 수 있습니다.</p>`;

    if (count >= 2) {
      html += `<div style="text-align: center; margin: 25px 0;"><img src="${topicImages[1]}" style="max-width:100%; border-radius:12px; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" /><p style="font-size:13px; color:#666; margin-top:6px;">▲ ${topic} 상세 세부 안내</p></div>`;
    }

    html += `<h2 style="font-size: 20px; font-weight: 800; border-left: 5px solid #03c75a; padding-left: 12px; margin: 30px 0 15px 0; color: #111;">2. 놓치면 안 되는 실전 이용 꿀팁</h2>`;
    html += `<div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 18px; margin: 25px 0;">
      <h4 style="color: #166534; font-size: 15px; margin-bottom: 8px;">💡 스마트 체크리스트</h4>
      <ul style="color: #14532d; font-size: 14px; margin-left: 20px; line-height: 1.7;">
        <li>이용 전 필수 확인사항 체크</li>
        <li>가성비와 만족도를 극대화하는 노하우</li>
        <li>이웃 분들에게 적극 추천하는 핵심 포인트</li>
      </ul>
    </div>`;

    if (count >= 3) {
      html += `<div style="text-align: center; margin: 25px 0;"><img src="${topicImages[2]}" style="max-width:100%; border-radius:12px; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" /><p style="font-size:13px; color:#666; margin-top:6px;">▲ 현장 캡처 및 후기 인증</p></div>`;
    }

    html += `<h2 style="font-size: 20px; font-weight: 800; border-left: 5px solid #03c75a; padding-left: 12px; margin: 30px 0 15px 0; color: #111;">3. 총평 및 마무리</h2>`;
    html += `<p style="font-size: 15px; margin-bottom: 20px;">이상으로 <strong>${topic}</strong>에 관한 상세 포스팅을 마칩니다. 정보가 도움이 되셨다면 공감과 이웃 추가 부탁드립니다! 😊</p>`;
    html += `</div>`;

    return {
      title: title,
      contentHtml: html,
      plainText: `${topic} 포스팅`,
      tags: [mainKeyword, ...subKws].filter(Boolean),
      timestamp: Date.now()
    };
  }

  function showToast(msg) {
    alert(msg);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
});
