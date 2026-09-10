document.addEventListener('DOMContentLoaded', () => {
  const btnVoiceMic = document.getElementById('btnVoiceMic');
  const micIcon = document.getElementById('micIcon');
  const txtMicLabel = document.getElementById('txtMicLabel');
  const btnPhotoPick = document.getElementById('btnPhotoPick');
  const filePhotoInput = document.getElementById('filePhotoInput');
  const photoPreviewBar = document.getElementById('photoPreviewBar');
  const inputTopicText = document.getElementById('inputTopicText');
  const selectOutputFormat = document.getElementById('selectOutputFormat');
  const btnGenerateAi = document.getElementById('btnGenerateAi');
  const resultSection = document.getElementById('resultSection');
  const previewContainer = document.getElementById('previewContainer');
  const btnShootNaver = document.getElementById('btnShootNaver');

  let selectedPhotos = [];
  let isRecording = false;
  let recognition = null;
  let generatedPayload = null;

  // 1. Voice Speech STT Setup
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

    recognition.onerror = (e) => {
      console.warn('Speech recognition error:', e);
      stopRecording();
    };

    recognition.onend = () => {
      stopRecording();
    };
  }

  btnVoiceMic.addEventListener('click', () => {
    if (!recognition) {
      alert('사용하시는 브라우저에서 음성 인식을 지원하지 않습니다. 키보드로 입력해주세요!');
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
        txtMicLabel.textContent = '🔴 듣는 중... (클릭 시 종료)';
        showToast('🎙️ 말씀하시면 실시간 텍스트로 변환됩니다!');
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
    txtMicLabel.textContent = '🎤 마이크로 말하기';
  }

  // 2. Photo Picker
  btnPhotoPick.addEventListener('click', () => {
    filePhotoInput.click();
  });

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
    selectedPhotos.forEach((src, idx) => {
      const img = document.createElement('img');
      img.src = src;
      img.className = 'photo-thumb';
      photoPreviewBar.appendChild(img);
    });
  }

  // 3. AI Generation Engine
  btnGenerateAi.addEventListener('click', () => {
    const textInput = inputTopicText.value.trim();
    if (!textInput && !selectedPhotos.length) {
      alert('음성 말하기, 사진 선택, 메모 중 1가지 이상을 입력해 주세요!');
      return;
    }

    btnGenerateAi.disabled = true;
    btnGenerateAi.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 🧠 Gemini AI 변환 중...';

    setTimeout(() => {
      const format = selectOutputFormat.value;
      generatedPayload = generateAiContent(textInput, selectedPhotos, format);

      previewContainer.innerHTML = generatedPayload.contentHtml;
      resultSection.classList.remove('hidden');

      if (format === 'reels_insta') {
        btnShootNaver.style.display = 'none';
      } else {
        btnShootNaver.style.display = 'flex';
      }

      btnGenerateAi.disabled = false;
      btnGenerateAi.innerHTML = '<i class="fa-solid fa-bolt"></i> ✨ Gemini AI 1초 변환 생성';

      // Scroll to result
      resultSection.scrollIntoView({ behavior: 'smooth' });
    }, 1200);
  });

  // 4. Shoot to Naver Blog App (Deep Link)
  btnShootNaver.addEventListener('click', () => {
    if (!generatedPayload) return;

    // Copy to clipboard
    const fullTextToCopy = `${generatedPayload.title}\n\n${generatedPayload.plainText}\n\n${(generatedPayload.tags || []).map(t => '#' + t).join(' ')}`;

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

    showToast('🟢 글과 제목이 복사되었습니다! 네이버 블로그 앱이 열립니다.');

    // Launch Naver Blog App Scheme / Intent
    const isAndroid = /android/i.test(navigator.userAgent);
    if (isAndroid) {
      window.location.href = 'intent://write#Intent;scheme=naverblog;package=com.nhn.android.blog;end';
    } else {
      window.location.href = 'naverblog://write';
    }

    setTimeout(() => {
      window.open('https://m.blog.naver.com/', '_blank');
    }, 1500);
  });

  function generateAiContent(textInput, photos, format) {
    const mainKw = textInput.split(' ')[0] || '일상';

    if (format === 'reels_insta') {
      const title = `🎬 인스타그램 릴스 (15초/30초 자막 & 나레이션 대본)`;
      const html = `
        <div style="color: #f8fafc; font-family: pretendard, sans-serif;">
          <h3 style="font-size: 15px; color: #38bdf8; margin-bottom: 10px;">🎬 [릴스 자막 &amp; 나레이션 대본]</h3>
          
          <div style="background: #1e293b; border-left: 4px solid #ec4899; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
            <p style="font-weight: bold; color: #f472b6; margin-bottom: 4px;">[0~3초 도입 훅(Hook)]</p>
            <p style="font-size: 13px; color: #fff;"><strong>화면 자막:</strong> ${textInput || '오늘 진짜 대박이었던 순간! 😱'}</p>
            <p style="font-size: 12px; color: #cbd5e1; margin-top: 4px;"><strong>나레이션:</strong> "너 아직도 이거 모른다고? 오늘 제가 직접 다녀왔습니다!"</p>
          </div>

          <div style="background: #1e293b; border-left: 4px solid #3b82f6; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
            <p style="font-weight: bold; color: #60a5fa; margin-bottom: 4px;">[4~20초 본문 핵심 포인트]</p>
            <p style="font-size: 13px; color: #fff;"><strong>화면 자막:</strong> 꿀팁 3가지 완벽 정리 ✨</p>
            <p style="font-size: 12px; color: #cbd5e1; margin-top: 4px;"><strong>나레이션:</strong> "첫 번째로 체크해야 할 포인트는 분위기와 가성비! 챙겨가면 완전 이득입니다."</p>
          </div>

          <div style="background: #1e293b; border-left: 4px solid #10b981; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
            <p style="font-weight: bold; color: #34d399; margin-bottom: 4px;">[21~30초 마감 CTA]</p>
            <p style="font-size: 13px; color: #fff;"><strong>화면 자막:</strong> 저장해두고 꼭 가보세요! 📌</p>
            <p style="font-size: 12px; color: #cbd5e1; margin-top: 4px;"><strong>나레이션:</strong> "더 자세한 정보는 아래 캡처 참고하시고, 공유랑 저장 필수!"</p>
          </div>

          <h4 style="font-size: 13px; color: #fbbf24; margin-top: 14px; margin-bottom: 6px;">📝 피드 캡처 문구 &amp; 추천 해시태그</h4>
          <p style="font-size: 12px; color: #e2e8f0; line-height: 1.6; background: #0f172a; padding: 10px; border-radius: 8px;">
            ${textInput || mainKw} 솔직 후기! ✨<br>
            친구 태그하고 이번 주말에 꼭 도전해보세요 🔥<br><br>
            #${mainKw} #릴스추천 #핫플레이스 #꿀팁공유 #일상
          </p>
        </div>
      `;

      return {
        title: title,
        contentHtml: html,
        plainText: `${textInput} 릴스 대본`,
        tags: [mainKw, '릴스', '핫플레이스', '추천']
      };
    } else {
      // Blog Format
      const title = `[${textInput || '일상 후기'}] 솔직 경험 담은 추천 및 꿀팁 총정리`;
      
      const defaultImg = photos.length > 0 ? photos[0] : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80';

      let html = `<div style="font-family: pretendard, sans-serif; line-height: 1.8; color: #222;">`;
      html += `<p style="font-size: 16px; margin-bottom: 20px; color: #333;">안녕하세요! 오늘은 많은 분들이 궁금해하시는 <strong>${textInput || '오늘의 주제'}</strong>에 대해 실전 정보와 알찬 팁을 가득 정리해 드립니다.</p>`;
      
      html += `<div style="text-align: center; margin: 25px 0;"><img src="${defaultImg}" style="max-width:100%; border-radius:12px;" /><p style="font-size:13px; color:#666; margin-top:6px;">▲ ${mainKw} 관련 현장 비주얼</p></div>`;

      html += `<h2 style="font-size: 20px; font-weight: 800; border-left: 5px solid #03c75a; padding-left: 12px; margin: 30px 0 15px 0; color: #111;">1. ${mainKw} 핵심 포인트</h2>`;
      html += `<p style="font-size: 15px; margin-bottom: 18px; color: #333;">직접 경험해본 결과 구성과 만족도가 매우 높았으며, 미리 주요 포인트를 숙지하고 방문하시면 더욱 알차게 즐기실 수 있습니다.</p>`;

      html += `<div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 18px; margin: 25px 0;">
        <h4 style="color: #166534; font-size: 15px; margin-bottom: 8px;">💡 필수 체크리스트</h4>
        <ul style="color: #14532d; font-size: 14px; margin-left: 20px; line-height: 1.7;">
          <li>방문/이용 전 사전 유의사항 체크</li>
          <li>가성비와 만족도를 동시에 챙기는 꿀팁</li>
        </ul>
      </div>`;

      html += `<h2 style="font-size: 20px; font-weight: 800; border-left: 5px solid #03c75a; padding-left: 12px; margin: 30px 0 15px 0; color: #111;">2. 마무리 및 요약</h2>`;
      html += `<p style="font-size: 15px; margin-bottom: 20px;">이상으로 <strong>${textInput || '오늘의 주제'}</strong> 포스팅을 마칩니다. 정보가 유용하셨다면 공감 부탁드립니다! 😊</p>`;
      html += `</div>`;

      return {
        title: title,
        contentHtml: html,
        plainText: `${textInput} 블로그 포스팅`,
        tags: [mainKw, '추천', '꿀팁', '후기']
      };
    }
  }

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast-popup';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
});
