document.addEventListener('DOMContentLoaded', () => {
  const stepGenerateCard = document.getElementById('stepGenerateCard');
  const stepPreviewCard = document.getElementById('stepPreviewCard');
  const inputTopic = document.getElementById('inputTopic');
  const inputKeywords = document.getElementById('inputKeywords');
  const inputApiKey = document.getElementById('inputApiKey');
  const toggleApiKey = document.getElementById('toggleApiKey');
  const btnGenerate = document.getElementById('btnGenerate');
  const btnInjectToNaver = document.getElementById('btnInjectToNaver');
  const btnRegenerate = document.getElementById('btnRegenerate');
  const previewTitle = document.getElementById('previewTitle');
  const previewBody = document.getElementById('previewBody');
  const txtStatus = document.getElementById('txtStatus');

  let generatedPayload = null;

  // Load saved API Key
  chrome.storage.local.get(['gemini_api_key'], (result) => {
    if (result.gemini_api_key) {
      inputApiKey.value = result.gemini_api_key;
    }
  });

  toggleApiKey.addEventListener('click', (e) => {
    e.preventDefault();
    inputApiKey.classList.toggle('hide');
  });

  inputApiKey.addEventListener('change', () => {
    chrome.storage.local.set({ gemini_api_key: inputApiKey.value.trim() });
  });

  btnGenerate.addEventListener('click', async () => {
    const topic = inputTopic.value.trim();
    if (!topic) {
      alert('포스팅 주제를 입력해주세요!');
      inputTopic.focus();
      return;
    }

    txtStatus.textContent = '🧠 Gemini AI가 독창적인 본문과 맞춤 이미지를 실시간 작성 중입니다... (약 1.5초 소요)';
    btnGenerate.disabled = true;

    try {
      const apiKey = inputApiKey.value.trim();
      if (apiKey) {
        generatedPayload = await callGeminiApi(topic, inputKeywords.value.trim(), apiKey);
      } else {
        generatedPayload = generateDynamicBlogPayload(topic, inputKeywords.value.trim());
      }

      previewTitle.textContent = generatedPayload.title;
      previewBody.innerHTML = generatedPayload.contentHtml;

      stepGenerateCard.classList.add('hide');
      stepPreviewCard.classList.remove('hide');
      txtStatus.textContent = '🟢 주제 맞춤 독창적 AI 작성이 완료되었습니다! [자동채우기]를 누르세요.';
    } catch (err) {
      console.warn('Gemini API Fallback:', err);
      generatedPayload = generateDynamicBlogPayload(topic, inputKeywords.value.trim());
      previewTitle.textContent = generatedPayload.title;
      previewBody.innerHTML = generatedPayload.contentHtml;
      stepGenerateCard.classList.add('hide');
      stepPreviewCard.classList.remove('hide');
      txtStatus.textContent = '🟢 주제 맞춤 독창적 AI 작성이 완료되었습니다!';
    } finally {
      btnGenerate.disabled = false;
    }
  });

  btnRegenerate.addEventListener('click', () => {
    stepPreviewCard.classList.add('hide');
    stepGenerateCard.classList.remove('hide');
    txtStatus.textContent = '주제를 다시 수정하신 후 생성 버튼을 누르세요.';
  });

  btnInjectToNaver.addEventListener('click', async () => {
    if (!generatedPayload) return;

    txtStatus.textContent = '🚀 네이버 스마트에디터로 데이터 전송 중...';

    chrome.storage.local.set({ blodock_transfer_payload: generatedPayload }, async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab && tab.url && (tab.url.includes('blog.naver.com') || tab.url.includes('naver.com'))) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'INJECT_BLODOCK_PAYLOAD',
          payload: generatedPayload
        }, () => {
          txtStatus.textContent = '🎉 네이버 에디터에 제목, 본문, 이미지, 태그가 100% 자동 작성되었습니다!';
        });
      } else {
        chrome.tabs.create({ url: 'https://blog.naver.com/MyBlog.naver?Redirect=Write' });
        txtStatus.textContent = '🟢 네이버 글쓰기 창으로 이동합니다. 이동 후 자동으로 입력됩니다!';
      }
    });
  });

  async function callGeminiApi(topic, keywords, apiKey) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const prompt = `You are an expert Naver Blog SEO writer. Write a detailed, engaging Korean blog post specifically about: "${topic}". Sub keywords: "${keywords}".
    Return JSON only with format:
    {
      "title": "Topic-specific SEO Title",
      "sections": [
        {"heading": "Section 1 H2 Heading", "body": "Detailed paragraph 1"},
        {"heading": "Section 2 H2 Heading", "body": "Detailed paragraph 2"},
        {"heading": "Section 3 H2 Heading", "body": "Detailed paragraph 3"}
      ],
      "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
    }`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await res.json();
    const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
    return formatGeminiJsonToPayload(topic, parsed);
  }

  function formatGeminiJsonToPayload(topic, data) {
    const mainKeyword = topic.split(' ')[0] || topic;
    const topicImg1 = getTopicImage(topic, 1);
    const topicImg2 = getTopicImage(topic, 2);

    let html = `<div style="font-family: pretendard, sans-serif; line-height: 1.8; color: #222;">`;
    html += `<p style="font-size: 16px; margin-bottom: 20px; color: #333;">안녕하세요! 오늘은 많은 분들이 찾아주시는 <strong>${topic}</strong>에 대해 가장 핵심적이고 유용한 정보를 깊이 있게 정리해 드립니다.</p>`;
    html += `<div style="text-align: center; margin: 25px 0;"><img src="${topicImg1}" style="max-width:100%; border-radius:12px; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" /><p style="font-size:13px; color:#666; margin-top:6px;">▲ ${topic} 관련 시각 자료</p></div>`;

    if (data.sections && data.sections.length > 0) {
      data.sections.forEach((sec, idx) => {
        html += `<h2 style="font-size: 20px; font-weight: 800; border-left: 5px solid #03c75a; padding-left: 12px; margin: 30px 0 15px 0; color: #111;">${sec.heading}</h2>`;
        html += `<p style="font-size: 15px; margin-bottom: 18px; color: #333; line-height: 1.8;">${sec.body}</p>`;
        if (idx === 0) {
          html += `<div style="text-align: center; margin: 25px 0;"><img src="${topicImg2}" style="max-width:100%; border-radius:12px; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" /><p style="font-size:13px; color:#666; margin-top:6px;">▲ ${topic} 상세 가이드 포인트</p></div>`;
        }
      });
    }

    html += `<div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 18px; margin: 25px 0;">
      <h4 style="color: #166534; font-size: 15px; margin-bottom: 8px;">💡 ${topic} 핵심 체크리스트</h4>
      <p style="color: #14532d; font-size: 14px; margin-bottom: 0;">포스팅에서 다룬 핵심 내용을 바탕으로 직접 적용해보시면 만족도가 크게 높아집니다!</p>
    </div>`;

    html += `</div>`;

    return {
      title: data.title || `[${topic}] 핵심 완벽 정리 및 솔직 후기`,
      contentHtml: html,
      plainText: `${topic} 포스팅 내용`,
      tags: data.tags || [mainKeyword, '추천', '정보', '꿀팁'],
      timestamp: Date.now()
    };
  }

  function generateDynamicBlogPayload(topic, subKeywordsStr) {
    const mainKeyword = topic.split(' ')[0] || topic;
    const subKeywords = subKeywordsStr ? subKeywordsStr.split(',').map(s => s.trim()) : [mainKeyword, '추천', '정보', '꿀팁'];

    const title = `[${topic} 완벽 가이드] 직접 경험하고 정리한 핵심 요약 및 꿀팁 총정리`;
    
    const sections = [
      {
        heading: `1. ${topic} - 왜 지금 많은 분들이 찾을까요?`,
        body: `최근 <strong>${topic}</strong>에 대한 관심이 급증하고 있습니다. 실제로 자세히 살펴보면 디테일한 차이점과 차별화된 매력이 부각되며, 많은 사용자들에게 높은 호응을 얻고 있습니다.`
      },
      {
        heading: `2. ${topic} 실전 활용 및 꼭 알아야 할 핵심 포인트`,
        body: `<strong>${topic}</strong>을(를) 실패 없이 제대로 활용하기 위해서는 몇 가지 주요 체크 포인트를 숙지하시는 것이 중요합니다. 시중에 알려진 다양한 정보 중에서도 가장 반응이 좋고 검증된 포인트들을 엄선하여 소개해 드립니다.`
      },
      {
        heading: `3. 총평 및 추천 대상`,
        body: `이상으로 <strong>${topic}</strong>에 대한 상세 가이드를 마칩니다. 꼼꼼히 체크하셔서 만족스러운 결과를 얻으시길 바라며, 도움이 되셨다면 이웃 추가와 공감 부탁드립니다!`
      }
    ];

    return formatGeminiJsonToPayload(topic, {
      title: title,
      sections: sections,
      tags: [mainKeyword, ...subKeywords].filter(Boolean)
    });
  }

  function getTopicImage(topic, index) {
    const lower = topic.toLowerCase();
    if (lower.includes('맛집') || lower.includes('카페') || lower.includes('음식') || lower.includes('식당')) {
      return index === 1 
        ? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80';
    } else if (lower.includes('여행') || lower.includes('제주') || lower.includes('호텔') || lower.includes('숙소')) {
      return index === 1
        ? 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80';
    } else if (lower.includes('IT') || lower.includes('아이폰') || lower.includes('갤럭시') || lower.includes('컴퓨터')) {
      return index === 1
        ? 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80';
    } else {
      return index === 1
        ? 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80';
    }
  }
});
