document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const tabBtns = document.querySelectorAll('.tab-btn');
  const aiBtns = document.querySelectorAll('.ai-btn');
  const displayStatus = document.getElementById('displayStatus');
  const displayArea = document.getElementById('displayArea');
  const photoPreviewBar = document.getElementById('photoPreviewBar');
  const btnVoiceMic = document.getElementById('btnVoiceMic');
  const micIcon = document.getElementById('micIcon');
  const txtMicLabel = document.getElementById('txtMicLabel');
  const btnPhotoPick = document.getElementById('btnPhotoPick');
  const filePhotoInput = document.getElementById('filePhotoInput');
  const inputTopicText = document.getElementById('inputTopicText');
  const btnGenerateAi = document.getElementById('btnGenerateAi');
  const btnShootPlatform = document.getElementById('btnShootPlatform');
  const txtShootLabel = document.getElementById('txtShootLabel');

  // State
  let activePlatform = 'naver'; // naver | blogger | threads | insta
  let activeAi = 'gemini';     // gemini | chatgpt | claude
  let selectedPhotos = [];
  let isRecording = false;
  let recognition = null;
  let generatedPayload = null;

  // 1. Platform Tab Switcher
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activePlatform = btn.getAttribute('data-platform');
      updateShootButtonLabel();
    });
  });

  function updateShootButtonLabel() {
    switch (activePlatform) {
      case 'naver':
        txtShootLabel.textContent = '🚀 네이버 블로그로 글 옮기기 (자동 복사 & 앱 열기)';
        btnShootPlatform.style.background = 'linear-gradient(135deg, #03c75a 0%, #029a45 100%)';
        break;
      case 'blogger':
        txtShootLabel.textContent = '🚀 구글 블로거로 글 옮기기 (원클릭 복사)';
        btnShootPlatform.style.background = 'linear-gradient(135deg, #ea4335 0%, #c5221f 100%)';
        break;
      case 'threads':
        txtShootLabel.textContent = '🚀 스레드 카드로 글 옮기기 (1~4장 카드시리즈 복사)';
        btnShootPlatform.style.background = 'linear-gradient(135deg, #000000 0%, #333333 100%)';
        break;
      case 'insta':
        txtShootLabel.textContent = '🚀 인스타 릴스 대본 옮기기 (자막 & 캡션 복사)';
        btnShootPlatform.style.background = 'linear-gradient(135deg, #e1306c 0%, #c13584 100%)';
        break;
    }
  }

  // 2. AI Selector Switcher
  aiBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      aiBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeAi = btn.getAttribute('data-ai');
      const aiName = activeAi === 'gemini' ? '제미나이' : (activeAi === 'chatgpt' ? '챗GPT' : 'Claude');
      showToast(`🤖 ${aiName} AI 엔진이 선택되었습니다!`);
    });
  });

  // 3. Speech STT Setup
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        inputTopicText.value = (inputTopicText.value + ' ' + finalTranscript).trim();
      }
    };

    recognition.onerror = () => stopRecording();
    recognition.onend = () => stopRecording();
  }

  btnVoiceMic.addEventListener('click', () => {
    if (!recognition) {
      alert('사용하시는 브라우저에서 음성 인식을 지원하지 않습니다. 키보드로 작성해주세요!');
      return;
    }

    if (isRecording) {
      recognition.stop();
      stopRecording();
    } else {
      try {
        recognition.start();
        isRecording = true;
        btnVoiceMic.classList.add('active');
        micIcon.className = 'fa-solid fa-microphone mic-icon-pulse';
        txtMicLabel.textContent = '듣는 중...';
        showToast('🎙️ 말하는 음성이 실시간 텍스트로 전환됩니다!');
      } catch (e) {
        stopRecording();
      }
    }
  });

  function stopRecording() {
    isRecording = false;
    btnVoiceMic.classList.remove('active');
    micIcon.className = 'fa-solid fa-microphone';
    micIcon.style.color = '#38bdf8';
    txtMicLabel.textContent = '음성 입력';
  }

  // 4. Photo Picker Setup
  btnPhotoPick.addEventListener('click', () => filePhotoInput.click());

  filePhotoInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        selectedPhotos.push(event.target.result);
        renderPhotoPreviews();
      };
      reader.readAsDataURL(file);
    });

    btnPhotoPick.classList.add('active');
    showToast(`📸 ${files.length}장의 사진이 첨부되었습니다!`);
  });

  function renderPhotoPreviews() {
    photoPreviewBar.innerHTML = '';
    if (!selectedPhotos.length) {
      photoPreviewBar.classList.add('hidden');
      return;
    }

    photoPreviewBar.classList.remove('hidden');
    selectedPhotos.forEach((src) => {
      const img = document.createElement('img');
      img.src = src;
      img.className = 'photo-thumb';
      photoPreviewBar.appendChild(img);
    });
  }

  // 5. AI Generation Execution (Display Rendering)
  btnGenerateAi.addEventListener('click', () => {
    const textInput = inputTopicText.value.trim();
    if (!textInput && !selectedPhotos.length) {
      alert('주제/메모를 적으시거나 음성 말하기, 사진 선택 중 1가지 이상을 해주세요!');
      return;
    }

    const aiName = activeAi === 'gemini' ? '제미나이' : (activeAi === 'chatgpt' ? '챗GPT' : 'Claude');

    btnGenerateAi.disabled = true;
    btnGenerateAi.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 🧠 ${aiName} AI가 글과 이미지를 생성 중...`;
    displayStatus.textContent = `${aiName} AI 생성 진행 중...`;

    setTimeout(() => {
      generatedPayload = generateAiResult(textInput, selectedPhotos, activePlatform, activeAi);

      // Render into Display Area
      displayArea.innerHTML = generatedPayload.contentHtml;
      displayStatus.textContent = `🟢 ${aiName} AI 생성 완료! (상단 탭에서 플랫폼 선택 후 옮기기 가능)`;

      btnGenerateAi.disabled = false;
      btnGenerateAi.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> AI로 글 &amp; 이미지 생성하기`;

      // Scroll to display
      displayArea.scrollIntoView({ behavior: 'smooth' });
    }, 1000);
  });

  // 6. Platform Transfer Shooter (네이버 / 구글블로거 / 스레드 / 인스타)
  btnShootPlatform.addEventListener('click', () => {
    if (!generatedPayload) {
      alert('먼저 아래 [AI로 글 & 이미지 생성하기] 버튼을 눌러 글을 생성해 주세요!');
      return;
    }

    const fullTextToCopy = `${generatedPayload.title}\n\n${generatedPayload.plainText}\n\n${(generatedPayload.tags || []).map(t => '#' + t).join(' ')}`;

    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullTextToCopy);
    } else {
      const ta = document.createElement('textarea');
      ta.value = fullTextToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    if (activePlatform === 'naver') {
      showToast('🟢 제목+본문+태그 복사 완료! 네이버 블로그 앱이 열립니다.');
      const isAndroid = /android/i.test(navigator.userAgent);
      if (isAndroid) {
        window.location.href = 'intent://write#Intent;scheme=naverblog;package=com.nhn.android.blog;end';
      } else {
        window.location.href = 'naverblog://write';
      }
      setTimeout(() => {
        window.open('https://m.blog.naver.com/', '_blank');
      }, 1500);
    } else if (activePlatform === 'blogger') {
      showToast('🔵 구글 블로거용 글이 클립보드에 복사되었습니다! 에디터 창을 엽니다.');
      setTimeout(() => {
        window.open('https://www.blogger.com/blog/posts/', '_blank');
      }, 1000);
    } else if (activePlatform === 'threads') {
      showToast('🧵 스레드 카드용 글이 복사되었습니다! Threads 앱/웹으로 이동합니다.');
      setTimeout(() => {
        window.open('https://www.threads.net/', '_blank');
      }, 1000);
    } else if (activePlatform === 'insta') {
      showToast('📸 인스타 릴스 대본 및 캡션이 복사되었습니다!');
      setTimeout(() => {
        window.open('https://www.instagram.com/', '_blank');
      }, 1000);
    }
  });

  // AI Content Generator Engine matching user prompt & sketch design
  function generateAiResult(rawInput, photos, platform, aiModel) {
    const topicStr = rawInput || (photos.length ? '오늘의 현장 후기' : '인기 장소 방문기');
    const words = topicStr.split(/\s+/).filter(w => w.length > 1);
    const mainKw = words[0] || '일상';
    const subKw = words.slice(1, 4).join(' ') || '후기';

    const aiLabel = aiModel === 'gemini' ? '제미나이(Gemini)' : (aiModel === 'chatgpt' ? '챗GPT(ChatGPT)' : 'Claude 3.5');

    // Instagram Reels Output
    if (platform === 'insta') {
      const title = `🎬 [인스타 릴스] ${topicStr.slice(0, 20)} 대본 (${aiLabel} 생성)`;
      const html = `
        <div style="font-family: pretendard, sans-serif;">
          <h3 style="font-size: 14px; color: #e1306c; margin-bottom: 8px;">🎬 ${aiLabel}가 생성한 15초/30초 릴스 대본</h3>
          
          <div style="background: #1e293b; border-left: 4px solid #e1306c; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
            <p style="font-size: 12px; font-weight: bold; color: #f472b6;">[0~3초 도입 훅]</p>
            <p style="font-size: 13px; color: #fff;"><strong>화면 자막:</strong> "${topicStr.slice(0, 18)}!"</p>
            <p style="font-size: 12px; color: #cbd5e1; margin-top: 4px;"><strong>나레이션:</strong> "아직도 몰랐다고? 오늘 직접 가서 확인한 꿀팁 전격 공개!"</p>
          </div>

          <div style="background: #1e293b; border-left: 4px solid #3b82f6; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
            <p style="font-size: 12px; font-weight: bold; color: #60a5fa;">[4~20초 핵심 비주얼]` + (photos.length ? ` (📸 업로드 사진 ${photos.length}장 컷 전환)` : '') + `</p>
            <p style="font-size: 13px; color: #fff;"><strong>화면 자막:</strong> ${mainKw} 놓치면 안 될 실전 포인트 ✨</p>
            <p style="font-size: 12px; color: #cbd5e1; margin-top: 4px;"><strong>나레이션:</strong> "직접 경험해보니 ${subKw} 부분이 기대 이상으로 만점이었습니다!"</p>
          </div>

          <div style="background: #1e293b; border-left: 4px solid #10b981; padding: 10px; border-radius: 8px;">
            <p style="font-size: 12px; font-weight: bold; color: #34d399;">[21~30초 공유 유도 (CTA)]</p>
            <p style="font-size: 13px; color: #fff;"><strong>화면 자막:</strong> 저장해두고 꼭 가보세요! 📌</p>
          </div>

          <h4 style="font-size: 12px; color: #fbbf24; margin-top: 12px; margin-bottom: 4px;">📝 Instagram 피드 캡션</h4>
          <p style="font-size: 12px; color: #e2e8f0; background: #0f172a; padding: 10px; border-radius: 8px;">
            ${topicStr} 🔥<br>
            친구 태그하고 공유해보세요 ✨<br><br>
            #${mainKw} #${words[1] || '일상'} #릴스추천 #핫플
          </p>
        </div>
      `;

      return {
        title: title,
        contentHtml: html,
        plainText: `${topicStr} 릴스 대본\n#${mainKw} #${subKw}`,
        tags: [mainKw, '릴스', '핫플']
      };
    }

    // Threads Format
    if (platform === 'threads') {
      const title = `🧵 [Threads 카드] ${topicStr.slice(0, 20)} (${aiLabel} 생성)`;
      const html = `
        <div style="font-family: pretendard, sans-serif;">
          <h3 style="font-size: 14px; color: #38bdf8; margin-bottom: 8px;">🧵 ${aiLabel}가 구성한 Threads 3장 카드</h3>

          <div style="background: #1e293b; border: 1px solid #334155; padding: 10px; border-radius: 8px; margin-bottom: 8px;">
            <p style="font-size: 12px; color: #38bdf8; font-weight: bold;">[카드 1/3]</p>
            <p style="font-size: 13px; color: #fff;">${topicStr} 솔직 후기 공유합니다! 다들 이것만 기억하세요.</p>
          </div>

          <div style="background: #1e293b; border: 1px solid #334155; padding: 10px; border-radius: 8px; margin-bottom: 8px;">
            <p style="font-size: 12px; color: #38bdf8; font-weight: bold;">[카드 2/3]</p>
            <p style="font-size: 13px; color: #fff;">${mainKw} 핵심은 바로 가성비와 동선 체크! 미리 알고 가면 시간 절약 200% 됩니다.</p>
          </div>

          <div style="background: #1e293b; border: 1px solid #334155; padding: 10px; border-radius: 8px;">
            <p style="font-size: 12px; color: #38bdf8; font-weight: bold;">[카드 3/3]</p>
            <p style="font-size: 13px; color: #fff;">궁금하신 점은 댓글로 남겨주시면 답글 드릴게요! 📌 #${mainKw}</p>
          </div>
        </div>
      `;

      return {
        title: title,
        contentHtml: html,
        plainText: `${topicStr}\n카드 1: ${mainKw}\n카드 2: ${subKw}`,
        tags: [mainKw, '스레드', '일상']
      };
    }

    // Naver Blog / Google Blogger Dynamic Format
    let blogTitle = ``;
    if (topicStr.includes('맛집') || topicStr.includes('식당') || topicStr.includes('먹')) {
      blogTitle = `🍽️ ${topicStr} 솔직 방문 후기! 분위기부터 맛까지 내돈내산 총정리`;
    } else if (topicStr.includes('여행') || topicStr.includes('공원') || topicStr.includes('산책') || topicStr.includes('다녀')) {
      blogTitle = `🌿 ${topicStr} 다녀온 생생 후기! 주차부터 인생샷 포인트까지`;
    } else {
      blogTitle = `✨ ${topicStr} 솔직 후기! 실전 경험담 & 꼭 알아야 할 꿀팁 3가지`;
    }

    let html = `<div style="font-family: pretendard, sans-serif; line-height: 1.8; color: #e2e8f0;">`;
    
    // AI Badge Indicator
    html += `<div style="display:inline-block; font-size:11px; background:#0284c7; color:#fff; padding:2px 8px; border-radius:4px; margin-bottom:12px; font-weight:bold;">
      🤖 Engine: ${aiLabel}
    </div>`;

    // Title
    html += `<h2 style="font-size: 17px; font-weight: bold; color: #03c75a; margin-bottom: 12px;">${blogTitle}</h2>`;

    // Intro
    html += `<p style="font-size: 13px; margin-bottom: 16px; color: #cbd5e1;">
      안녕하세요! 오늘은 <strong>${topicStr}</strong>에 대해 제가 직접 경험하고 다녀온 솔직 생생 정보와 꿀팁을 전해드립니다!
    </p>`;

    // Insert User Photos
    if (photos.length > 0) {
      html += `<div style="margin: 16px 0; text-align: center;">
        <img src="${photos[0]}" style="max-width: 100%; border-radius: 10px; border: 1px solid #38bdf8;" />
        <p style="font-size: 11px; color: #94a3b8; margin-top: 4px;">▲ 현장 실물 컷 (첨부 사진 1)</p>
      </div>`;
    }

    // Body 1
    html += `<h3 style="font-size: 15px; color: #38bdf8; border-left: 4px solid #03c75a; padding-left: 8px; margin: 18px 0 10px 0;">1. ${mainKw} 솔직한 경험과 첫인상</h3>`;
    html += `<p style="font-size: 13px; margin-bottom: 14px; color: #cbd5e1;">
      직접 둘러보니 분위기나 완성도가 만족스러웠고, 특히 <strong>${topicStr}</strong>와 관련해서 챙겨볼 디테일이 많아서 돈과 시간이 아깝지 않았습니다.
    </p>`;

    if (photos.length > 1) {
      html += `<div style="margin: 16px 0; text-align: center;">
        <img src="${photos[1]}" style="max-width: 100%; border-radius: 10px; border: 1px solid #38bdf8;" />
        <p style="font-size: 11px; color: #94a3b8; margin-top: 4px;">▲ 추가 현장 사진 (첨부 사진 2)</p>
      </div>`;
    }

    // Callout Box
    html += `<div style="background: #1e293b; border: 1px solid #03c75a; border-radius: 10px; padding: 12px; margin: 16px 0;">
      <h4 style="color: #34d399; font-size: 13px; margin-bottom: 6px; font-weight: bold;">💡 이용 전 필수 꿀팁</h4>
      <ul style="color: #cbd5e1; font-size: 12px; margin-left: 16px; line-height: 1.6;">
        <li>인기 많은 시간대는 피해서 방문하시는 걸 추천!</li>
        <li>${subKw || '필수 준비물'} 사전 체크로 동선 효율 200%Up</li>
      </ul>
    </div>`;

    // Conclusion
    html += `<h3 style="font-size: 15px; color: #38bdf8; border-left: 4px solid #03c75a; padding-left: 8px; margin: 18px 0 10px 0;">2. 총평 및 마무리</h3>`;
    html += `<p style="font-size: 13px; margin-bottom: 14px; color: #cbd5e1;">
      이상으로 <strong>${topicStr}</strong> 후기를 마칩니다. 정보가 도움이 되셨다면 공감과 이웃추가 부탁드립니다! 😊
    </p>`;

    const tags = Array.from(new Set([mainKw, words[1] || '솔직후기', words[2] || '일상', '내돈내산', '꿀팁'])).filter(Boolean);

    html += `<p style="font-size: 12px; color: #03c75a; font-weight: bold; margin-top: 14px;">
      ${tags.map(t => '#' + t).join(' ')}
    </p>`;

    html += `</div>`;

    const plainText = `안녕하세요!\n오늘 직접 다녀온 '${topicStr}' 솔직 후기 공유합니다.\n\n1. ${mainKw} 첫인상\n실제 다녀와보니 매우 만족스러웠고 디테일도 인상적이었습니다.\n\n2. 이용 꿀팁\n- 인기 시간대 사전 체크\n- ${subKw || '준비물'} 챙기기\n\n도움이 되셨다면 공감 부탁드립니다!`;

    return {
      title: blogTitle,
      contentHtml: html,
      plainText: plainText,
      tags: tags
    };
  }

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast-popup';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
});
