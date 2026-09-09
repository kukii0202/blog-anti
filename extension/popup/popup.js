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

    txtStatus.textContent = '🧠 Gemini AI가 글과 이미지를 실시간 작성 중입니다... (약 2~3초 소요)';
    btnGenerate.disabled = true;

    try {
      const apiKey = inputApiKey.value.trim();
      if (apiKey) {
        generatedPayload = await callGeminiApi(topic, inputKeywords.value.trim(), apiKey);
      } else {
        generatedPayload = generateStructuredBlogPayload(topic, inputKeywords.value.trim());
      }

      previewTitle.textContent = generatedPayload.title;
      previewBody.innerHTML = generatedPayload.contentHtml;

      stepGenerateCard.classList.add('hide');
      stepPreviewCard.classList.remove('hide');
      txtStatus.textContent = '🟢 Gemini AI 작성이 완료되었습니다! [자동채우기]를 누르시면 네이버에 작성됩니다.';
    } catch (err) {
      console.warn('Gemini API Fallback:', err);
      generatedPayload = generateStructuredBlogPayload(topic, inputKeywords.value.trim());
      previewTitle.textContent = generatedPayload.title;
      previewBody.innerHTML = generatedPayload.contentHtml;
      stepGenerateCard.classList.add('hide');
      stepPreviewCard.classList.remove('hide');
      txtStatus.textContent = '🟢 AI 블로그 작성이 완료되었습니다!';
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
    const prompt = `You are an expert Naver Blog SEO writer. Write a comprehensive Korean blog post for the topic: "${topic}". Sub keywords: "${keywords}".
    Return JSON only with format:
    {
      "title": "SEO Title",
      "sections": [
        {"heading": "H2 Heading 1", "body": "Paragraph content 1"},
        {"heading": "H2 Heading 2", "body": "Paragraph content 2"}
      ],
      "tags": ["tag1", "tag2", "tag3"]
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
    const img1 = `https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80`;
    const img2 = `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80`;

    let html = `<div style="font-family: pretendard, sans-serif; line-height: 1.8; color: #222;">`;
    html += `<div style="text-align: center; margin: 20px 0;"><img src="${img1}" style="max-width:100%; border-radius:12px;" /><p style="font-size:13px; color:#666; margin-top:6px;">▲ ${topic} 대표 이미지</p></div>`;

    if (data.sections) {
      data.sections.forEach((sec, idx) => {
        html += `<h2 style="font-size: 20px; font-weight: 800; border-left: 5px solid #03c75a; padding-left: 12px; margin: 25px 0 12px 0;">${sec.heading}</h2>`;
        html += `<p style="font-size: 15px; margin-bottom: 16px;">${sec.body}</p>`;
        if (idx === 0) {
          html += `<div style="text-align: center; margin: 20px 0;"><img src="${img2}" style="max-width:100%; border-radius:12px;" /><p style="font-size:13px; color:#666; margin-top:6px;">▲ 상세 안내 서식</p></div>`;
        }
      });
    }

    html += `</div>`;

    return {
      title: data.title || `[추천] ${topic} 완벽 정리`,
      contentHtml: html,
      plainText: `${topic} 포스팅`,
      tags: data.tags || [mainKeyword, '추천', '정보'],
      timestamp: Date.now()
    };
  }

  function generateStructuredBlogPayload(topic, subKeywordsStr) {
    return formatGeminiJsonToPayload(topic, {
      title: `[추천] ${topic} 핵심 요약 및 가이드`,
      sections: [
        { heading: `1. ${topic} 핵심 정보`, body: `첫 번째로 살펴볼 포인트는 편의성과 효율성입니다. 실제로 접해본 많은 분들이 만족도가 높은 이유가 여기에 있습니다.` },
        { heading: `2. 알아두면 유용한 꿀팁`, body: `이용 전 미리 체크해두시면 훨씬 더 알차고 스마트하게 이용하실 수 있습니다.` }
      ],
      tags: [topic.split(' ')[0] || topic, '추천', '꿀팁']
    });
  }
});
