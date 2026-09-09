document.addEventListener('DOMContentLoaded', () => {
  const stepGenerateCard = document.getElementById('stepGenerateCard');
  const stepPreviewCard = document.getElementById('stepPreviewCard');
  const inputTopic = document.getElementById('inputTopic');
  const inputKeywords = document.getElementById('inputKeywords');
  const btnGenerate = document.getElementById('btnGenerate');
  const btnInjectToNaver = document.getElementById('btnInjectToNaver');
  const btnRegenerate = document.getElementById('btnRegenerate');
  const previewTitle = document.getElementById('previewTitle');
  const previewBody = document.getElementById('previewBody');
  const txtStatus = document.getElementById('txtStatus');

  let generatedPayload = null;

  btnGenerate.addEventListener('click', async () => {
    const topic = inputTopic.value.trim();
    if (!topic) {
      alert('포스팅 주제를 입력해주세요!');
      inputTopic.focus();
      return;
    }

    txtStatus.textContent = '⏳ AI가 글과 이미지를 생성 중입니다... (약 2~3초 소요)';
    btnGenerate.disabled = true;

    // Simulate/Generate AI Content + Images
    generatedPayload = generateAiPostPayload(topic, inputKeywords.value.trim());

    // Show Preview Card
    previewTitle.textContent = generatedPayload.title;
    previewBody.innerHTML = generatedPayload.contentHtml;
    
    stepGenerateCard.classList.add('hide');
    stepPreviewCard.classList.remove('hide');
    txtStatus.textContent = '🟢 AI 글과 이미지 작성이 완료되었습니다! 내용을 확인하시고 [자동채우기]를 누르세요.';
    btnGenerate.disabled = false;
  });

  btnRegenerate.addEventListener('click', () => {
    stepPreviewCard.classList.add('hide');
    stepGenerateCard.classList.remove('hide');
    txtStatus.textContent = '주제를 다시 수정하신 후 생성 버튼을 누르세요.';
  });

  btnInjectToNaver.addEventListener('click', async () => {
    if (!generatedPayload) return;

    txtStatus.textContent = '🚀 네이버 스마트에디터로 데이터 전송 중...';

    // Store in extension storage
    chrome.storage.local.set({ blodock_transfer_payload: generatedPayload }, async () => {
      // Find active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab && tab.url && (tab.url.includes('blog.naver.com') || tab.url.includes('naver.com'))) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'INJECT_BLODOCK_PAYLOAD',
          payload: generatedPayload
        }, (response) => {
          txtStatus.textContent = '🎉 네이버 에디터에 제목, 본문, 이미지, 태그가 자동 채워졌습니다!';
        });
      } else {
        // If not currently on Naver Blog write page, open write page
        chrome.tabs.create({ url: 'https://blog.naver.com/MyBlog.naver?Redirect=Write' });
        txtStatus.textContent = '🟢 네이버 블로그 글쓰기 창으로 이동합니다. 이동 후 자동으로 입력됩니다!';
      }
    });
  });

  function generateAiPostPayload(topic, subKeywordsStr) {
    const mainKeyword = topic.split(' ')[0] || topic;
    const subKeywords = subKeywordsStr ? subKeywordsStr.split(',').map(s => s.trim()) : [mainKeyword, '추천', '정보'];

    const title = `[추천] ${topic} 완벽 정리 및 솔직 후기 (핵심 요약)`;
    
    const sampleImages = [
      `https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80`,
      `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80`
    ];

    const contentHtml = `
      <div style="font-family: pretendard, sans-serif; line-height: 1.8; color: #222;">
        <p style="font-size: 16px; margin-bottom: 20px; color: #444;">
          안녕하세요! 오늘은 많은 분들이 궁금해하시는 <strong>${topic}</strong>에 대해 핵심 정보와 가이드를 알기 쉽게 정성껏 정리해 드리겠습니다.
        </p>

        <div style="text-align: center; margin: 25px 0;">
          <img src="${sampleImages[0]}" alt="${topic}" class="preview-img" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);" />
          <p style="font-size: 13px; color: #666; margin-top: 6px;">▲ ${topic} 관련 대표 이미지</p>
        </div>

        <h2 style="font-size: 20px; font-weight: 800; border-left: 5px solid #03c75a; padding-left: 12px; margin: 30px 0 15px 0; color: #111;">
          1. ${topic} 핵심 포인트 &amp; 주요 특징
        </h2>
        <p style="font-size: 15px; margin-bottom: 16px;">
          첫 번째로 기억하셔야 할 점은 바로 구성과 편의성입니다. 실제로 접해보면 기대 이상으로 만족도가 높으며, 입소문이 난 이유를 명확히 알 수 있습니다.
        </p>

        <div style="text-align: center; margin: 25px 0;">
          <img src="${sampleImages[1]}" alt="상세 설명" class="preview-img" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);" />
          <p style="font-size: 13px; color: #666; margin-top: 6px;">▲ 스마트에디터 ONE 호환 이미지 서식</p>
        </div>

        <h2 style="font-size: 20px; font-weight: 800; border-left: 5px solid #03c75a; padding-left: 12px; margin: 30px 0 15px 0; color: #111;">
          2. 이용 전 꼭 확인해야 할 꿀팁
        </h2>
        <p style="font-size: 15px; margin-bottom: 16px;">
          미리 알고 방문하거나 이용하시면 훨씬 더 알차고 스마트하게 즐기실 수 있습니다. 아래 체크리스트를 참고해 보세요!
        </p>

        <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <h4 style="color: #166534; font-size: 15px; margin-bottom: 8px;">💡 스마트 요약 포인트</h4>
          <ul style="color: #14532d; font-size: 14px; margin-left: 20px; line-height: 1.7;">
            <li>방문/이용 전 사전 확인 권장</li>
            <li>가성비와 만족도를 동시에 챙기는 핵심 노하우</li>
            <li>이웃 분들에게 강력 추천하는 보장된 꿀팁</li>
          </ul>
        </div>

        <h2 style="font-size: 20px; font-weight: 800; border-left: 5px solid #03c75a; padding-left: 12px; margin: 30px 0 15px 0; color: #111;">
          3. 총평 및 마무리
        </h2>
        <p style="font-size: 15px; margin-bottom: 20px;">
          이상으로 <strong>${topic}</strong>에 대한 포스팅을 마칩니다. 궁금하셨던 정보에 도움이 되셨기를 바라며, 도움이 되셨다면 공감과 이웃 추가 부탁드립니다! 😊
        </p>
      </div>
    `;

    return {
      title: title,
      contentHtml: contentHtml,
      plainText: `${topic} 포스팅 내용`,
      tags: [mainKeyword, ...subKeywords].filter(Boolean),
      timestamp: Date.now()
    };
  }
});
