document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const tabBtns = document.querySelectorAll('.tab-btn');
  const displayStatus = document.getElementById('displayStatus');
  const displayArea = document.getElementById('displayArea');
  const photoPreviewBar = document.getElementById('photoPreviewBar');
  const btnVoiceMic = document.getElementById('btnVoiceMic');
  const micIcon = document.getElementById('micIcon');
  const txtMicLabel = document.getElementById('txtMicLabel');
  const btnPhotoPick = document.getElementById('btnPhotoPick');
  const filePhotoInput = document.getElementById('filePhotoInput');
  const inputTopicText = document.getElementById('inputTopicText');
  const btnShootPlatform = document.getElementById('btnShootPlatform');
  const txtShootLabel = document.getElementById('txtShootLabel');

  // AI Popup Overlay Elements
  const btnOpenGemini = document.getElementById('btnOpenGemini');
  const btnOpenGpt = document.getElementById('btnOpenGpt');
  const btnOpenClaude = document.getElementById('btnOpenClaude');
  const aiModalOverlay = document.getElementById('aiModalOverlay');
  const aiModalTitle = document.getElementById('aiModalTitle');
  const btnCloseAiModal = document.getElementById('btnCloseAiModal');
  const btnImportClipboard = document.getElementById('btnImportClipboard');
  const aiFrame = document.getElementById('aiFrame');
  const aiFallbackBox = document.getElementById('aiFallbackBox');
  const linkDirectAi = document.getElementById('linkDirectAi');

  // State
  let activePlatform = 'naver';
  let activeAiEngine = 'gemini';
  let selectedPhotos = [];
  let isRecording = false;
  let recognition = null;
  let importedContent = null;

  // 1. Platform Tabs Switcher
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
        txtShootLabel.textContent = '🚀 구글 블로거로 글 옮기기 (원클릭 복사 & 에디터 열기)';
        btnShootPlatform.style.background = 'linear-gradient(135deg, #ea4335 0%, #c5221f 100%)';
        break;
      case 'threads':
        txtShootLabel.textContent = '🚀 스레드 카드로 글 옮기기 (Threads 앱/웹 열기)';
        btnShootPlatform.style.background = 'linear-gradient(135deg, #000000 0%, #333333 100%)';
        break;
      case 'insta':
        txtShootLabel.textContent = '🚀 인스타 릴스 대본 옮기기 (자막 & 캡션 복사)';
        btnShootPlatform.style.background = 'linear-gradient(135deg, #e1306c 0%, #c13584 100%)';
        break;
    }
  }

  // 2. Open Real AI Popup Overlay Modal
  btnOpenGemini.addEventListener('click', () => openAiModal('gemini', 'https://gemini.google.com/', '✨ 제미나이(Gemini) 대화 창'));
  btnOpenGpt.addEventListener('click', () => openAiModal('chatgpt', 'https://chatgpt.com/', '⚡ 챗GPT(ChatGPT) 대화 창'));
  btnOpenClaude.addEventListener('click', () => openAiModal('claude', 'https://claude.ai/', '🧠 Claude 대화 창'));

  function openAiModal(engine, url, title) {
    activeAiEngine = engine;
    aiModalTitle.innerHTML = title;
    aiModalOverlay.classList.remove('hidden');
    linkDirectAi.href = url;

    // Load iframe
    try {
      aiFrame.src = url;
      aiFallbackBox.classList.add('hidden');
    } catch (e) {
      aiFallbackBox.classList.remove('hidden');
    }

    // Backup timer in case X-Frame-Options blocks iframe
    setTimeout(() => {
      aiFallbackBox.classList.remove('hidden');
    }, 2000);
  }

  // Close AI Modal Popup ("팝업 죽이기")
  btnCloseAiModal.addEventListener('click', () => {
    aiModalOverlay.classList.add('hidden');
    aiFrame.src = 'about:blank';
    showToast('🔴 AI 팝업창을 닫았습니다.');
  });

  // 3. Import Copied Text from AI Modal Clipboard to Display Box
  btnImportClipboard.addEventListener('click', async () => {
    try {
      let text = '';
      if (navigator.clipboard && navigator.clipboard.readText) {
        text = await navigator.clipboard.readText();
      } else {
        text = inputTopicText.value;
      }

      if (!text) {
        alert('AI 창에서 대화하신 글을 먼저 복사(Copy)해 주세요!');
        return;
      }

      // Populate Display Box
      processAndRenderDisplay(text);
      aiModalOverlay.classList.add('hidden');
      aiFrame.src = 'about:blank';
      showToast('🟢 AI 작업 결과가 디스플레이로 쏙 들어왔습니다!');
    } catch (err) {
      alert('클립보드 접근이 제한되었습니다. 아래 챗창에 직접 붙여넣기를 해주셔도 됩니다!');
    }
  });

  // Render Display Content with Photos
  function processAndRenderDisplay(rawText) {
    const lines = rawText.split('\n').filter(l => l.trim());
    const title = lines[0] || 'AI가 생성한 포스팅';

    let html = `<div style="font-family: pretendard, sans-serif; color: #f8fafc; line-height: 1.8;">`;
    html += `<div style="display:inline-block; font-size:11px; background:#0284c7; color:#fff; padding:2px 8px; border-radius:4px; margin-bottom:10px; font-weight:bold;">
      🤖 가져온 AI: ${activeAiEngine.toUpperCase()}
    </div>`;

    html += `<h2 style="font-size:16px; font-weight:bold; color:#03c75a; margin-bottom:12px;">${title}</h2>`;

    // Render User Photos inside Display Box
    if (selectedPhotos.length > 0) {
      html += `<div style="margin: 14px 0; text-align: center;">
        <img src="${selectedPhotos[0]}" style="max-width: 100%; border-radius: 10px; border: 1px solid #38bdf8;" />
        <p style="font-size: 11px; color: #94a3b8; margin-top: 4px;">▲ 첨부하신 사진 1</p>
      </div>`;
    }

    // Content body
    html += `<div style="font-size:13px; color:#e2e8f0; white-space: pre-wrap;">${lines.slice(1).join('\n')}</div>`;

    if (selectedPhotos.length > 1) {
      html += `<div style="margin: 14px 0; text-align: center;">
        ${selectedPhotos.slice(1).map(p => `<img src="${p}" style="max-width: 100%; border-radius: 10px; margin-bottom: 8px; border: 1px solid #38bdf8;" />`).join('')}
        <p style="font-size: 11px; color: #94a3b8;">▲ 첨부하신 사진 2</p>
      </div>`;
    }

    html += `</div>`;

    displayArea.innerHTML = html;
    displayStatus.textContent = `🟢 AI 창 작업글 수신 완료! (아래 버튼으로 ${activePlatform.toUpperCase()}로 쏘세요)`;

    importedContent = {
      title: title,
      body: rawText
    };
  }

  // 4. Speech STT Setup
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
      alert('사용하시는 브라우저에서 음성 인식을 지원하지 않습니다.');
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
        showToast('🎙️ 음성이 입력창으로 전환됩니다!');
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

  // 5. Photo Picker
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
    showToast(`📸 ${files.length}장의 사진이 추가되었습니다!`);
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

  // 6. Platform Transfer Shooter
  btnShootPlatform.addEventListener('click', () => {
    const textToCopy = importedContent ? importedContent.body : inputTopicText.value;

    if (!textToCopy) {
      alert('먼저 AI 창을 열어 글을 만드시거나, 아래 챗창에 글을 작성/복사해 주세요!');
      return;
    }

    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy);
    } else {
      const ta = document.createElement('textarea');
      ta.value = textToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    if (activePlatform === 'naver') {
      showToast('🟢 글이 복사되었습니다! 네이버 블로그 앱 글쓰기 창으로 이동합니다.');
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
      showToast('🔵 구글 블로거용 글이 복사되었습니다!');
      setTimeout(() => window.open('https://www.blogger.com/blog/posts/', '_blank'), 1000);
    } else if (activePlatform === 'threads') {
      showToast('🧵 Threads용 글이 복사되었습니다!');
      setTimeout(() => window.open('https://www.threads.net/', '_blank'), 1000);
    } else if (activePlatform === 'insta') {
      showToast('📸 인스타 릴스 대본이 복사되었습니다!');
      setTimeout(() => window.open('https://www.instagram.com/', '_blank'), 1000);
    }
  });

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast-popup';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
});
