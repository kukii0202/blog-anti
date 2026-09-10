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
    const subKws = subKwStr ? subKwStr.split(',').map(s => s.trim()) : [mainKeyword, '준비물', '꿀팁', '후기'];
    const count = parseInt(imgCount) || 3;

    let title = '';
    let introText = '';
    let sec1Heading = '';
    let sec1Text = '';
    let sec2Heading = '';
    let sec2Text = '';
    let checklistItems = [];
    let sec3Heading = '';
    let sec3Text = '';

    const lowerTopic = topic.toLowerCase();

    if (lowerTopic.includes('운동회') || lowerTopic.includes('체육대회') || lowerTopic.includes('행사')) {
      title = `[${topic} 준비물 & 꿀팁] 즐겁고 안전하게 즐기는 알찬 가이드`;
      introText = `선선하고 청명한 하늘이 펼쳐지는 계절, 온 가족과 아이들이 기대하는 <strong>${topic}</strong>의 계절이 찾아왔습니다! 오늘은 당일 허둥지둥하지 않고 완벽하게 즐기기 위한 필수 준비물과 핵심 꿀팁을 정성껏 정리해 드립니다.`;
      
      sec1Heading = `📌 1. ${topic} 필수 준비물 체크리스트`;
      sec1Text = `야외 활동이 많은 날인 만큼 돗자리, 얼음물, 모자, 선크림은 기본 필수품입니다. 특히 그늘막이나 대형 타월, 간편한 간식과 손소독제까지 챙기시면 훨씬 쾌적한 하루를 보낼 수 있습니다.`;
      
      sec2Heading = `🏃‍♂️ 2. 안전하게 즐기는 실전 참여 꿀팁`;
      sec2Text = `갑작스러운 신체 활동으로 부상을 입지 않도록 시작 전 가벼운 스트레칭은 필수입니다. 얇은 옷을 여러 겹 입어 체온 조절을 쉽게 하고, 편안한 운동화를 착용하시는 것을 추천합니다.`;
      
      checklistItems = [
        '편안한 신발과 활동성 좋은 복장 착용',
        '얼음물, 이온음료 및 간편한 고칼로리 간식',
        '야외 햇빛 차단을 위한 모자, 선글라스, 선크림'
      ];
      
      sec3Heading = `🎉 3. 추억 남기기 및 총평`;
      sec3Text = `가족, 친구들과 소중한 추억을 남기는 뜻깊은 시간에 멋진 사진도 많이 남기시길 바랍니다. 도움이 되셨다면 공감과 이웃 추가 부탁드립니다! 😊`;
    } else if (lowerTopic.includes('맛집') || lowerTopic.includes('카페') || lowerTopic.includes('식당')) {
      title = `[${topic} 솔직 후기] 위치부터 추천 대표 메뉴, 주차 팁까지 완벽 정리`;
      introText = `안녕하세요! 오늘은 많은 분들이 꼭 가보고 싶어 하시는 핫플레이스 <strong>${topic}</strong>에 다녀왔습니다. 맛과 분위기, 편의성까지 솔직하게 소개해 드릴게요!`;
      
      sec1Heading = `🍽️ 1. 매장 분위기 및 대표 시그니처 메뉴`;
      sec1Text = `깔끔하고 감성적인 인테리어가 인상적이었으며, 대표 메뉴의 깊은 풍미와 넉넉한 양이 돋보였습니다. 신선한 재료 사용이 느껴져 만족도가 아주 높았습니다.`;
      
      sec2Heading = `💡 2. 방문 전 꼭 알아야 할 꿀팁`;
      sec2Text = `주말이나 피크 타임에는 웨이팅이 발생할 수 있으니 사전 원격 줄서기나 약간 일찍 방문하시는 것을 권장합니다. 전용 주차장 및 공영주차장 정보도 미리 체크하세요.`;
      
      checklistItems = [
        '피크 타임 사전 예약 또는 원격 줄서기',
        '인기 대표 시그니처 메뉴 우선 주문',
        '인근 주차 지원 가능 여부 미리 확인'
      ];
      
      sec3Heading = `✨ 3. 총평 및 재방문 의사`;
      sec3Text = `음식의 퀄리티와 친절도 모두 만족스러웠던 곳입니다. 데이트나 모임 장소로 강력 추천해 드립니다!`;
    } else {
      title = `[${topic} 완벽 안내] 핵심 요약 정보 및 실전 활용 가이드`;
      introText = `안녕하세요! 오늘은 많은 문의가 있었던 <strong>${topic}</strong>에 대해 핵심 정보만을 깔끔하게 요약하여 전해드리겠습니다.`;
      
      sec1Heading = `🔍 1. ${topic} 주요 특징 및 포인트`;
      sec1Text = `최근 많은 유저들에게 관심 받는 가장 큰 이유는 높은 편의성과 체계적인 가성비입니다. 기본기에 충실하여 누구든 쉽게 접근하실 수 있습니다.`;
      
      sec2Heading = `🎯 2. 실전 적용 시 유용한 핵심 팁`;
      sec2Text = `미리 주요 체크 항목을 기억해 두고 진행하시면 시행착오를 대폭 줄이고 원하는 결과를 얻으실 수 있습니다.`;
      
      checklistItems = [
        '시작 전 주요 가이드라인 숙지',
        '효율을 극대화하는 순서대로 진행',
        '궁금한 점은 사전 체크리스트로 검토'
      ];
      
      sec3Heading = `📝 3. 마무리 및 요약`;
      sec3Text = `이상으로 <strong>${topic}</strong>에 대한 알찬 정리를 마칩니다. 도움이 되셨다면 공감과 댓글 부탁드립니다! 😊`;
    }

    const topicImages = [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80'
    ];

    let html = `<div style="font-family: pretendard, sans-serif; line-height: 1.8; color: #222;">`;
    html += `<p style="font-size: 16px; margin-bottom: 20px; color: #333;">${introText}</p>`;

    if (count >= 1) {
      html += `<div style="text-align: center; margin: 25px 0;"><img src="${topicImages[0]}" style="max-width:100%; border-radius:12px; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" /><p style="font-size:13px; color:#666; margin-top:6px;">▲ ${topic} 대표 스케치 현장</p></div>`;
    }

    html += `<h2 style="font-size: 20px; font-weight: 800; border-left: 5px solid #03c75a; padding-left: 12px; margin: 30px 0 15px 0; color: #111;">${sec1Heading}</h2>`;
    html += `<p style="font-size: 15px; margin-bottom: 18px; color: #333; line-height: 1.8;">${sec1Text}</p>`;

    if (count >= 2) {
      html += `<div style="text-align: center; margin: 25px 0;"><img src="${topicImages[1]}" style="max-width:100%; border-radius:12px; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" /><p style="font-size:13px; color:#666; margin-top:6px;">▲ ${topic} 관련 세부 장면</p></div>`;
    }

    html += `<h2 style="font-size: 20px; font-weight: 800; border-left: 5px solid #03c75a; padding-left: 12px; margin: 30px 0 15px 0; color: #111;">${sec2Heading}</h2>`;
    html += `<p style="font-size: 15px; margin-bottom: 18px; color: #333; line-height: 1.8;">${sec2Text}</p>`;

    html += `<div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 18px; margin: 25px 0;">
      <h4 style="color: #166534; font-size: 15px; margin-bottom: 8px;">💡 ${topic} 핵심 체크리스트</h4>
      <ul style="color: #14532d; font-size: 14px; margin-left: 20px; line-height: 1.7;">
        ${checklistItems.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>`;

    if (count >= 3) {
      html += `<div style="text-align: center; margin: 25px 0;"><img src="${topicImages[2]}" style="max-width:100%; border-radius:12px; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" /><p style="font-size:13px; color:#666; margin-top:6px;">▲ 현장 후기 및 이미지 컷</p></div>`;
    }

    html += `<h2 style="font-size: 20px; font-weight: 800; border-left: 5px solid #03c75a; padding-left: 12px; margin: 30px 0 15px 0; color: #111;">${sec3Heading}</h2>`;
    html += `<p style="font-size: 15px; margin-bottom: 20px;">${sec3Text}</p>`;
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
