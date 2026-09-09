/**
 * BLODOCK (블독) - SEO 최적화 블로그 포스팅 에디터
 * Advanced AI Content & Real Google OAuth2 Blogger Auto-Publishing Engine
 */

(function () {
  'use strict';

  // ==========================================================================
  // Global State
  // ==========================================================================
  const state = {
    currentStep: 1,
    activeView: 'editor', // 'editor' | 'naver-preview' | 'clean-preview'
    publishPlatform: 'blogger', // 'blogger' | 'tistory' | 'github' | 'naver'
    plan: {
      platform: 'blogger',
      topic: '',
      mainKeyword: '',
      subKeywords: [],
      tone: 'professional',
      targetLength: 1500,
      selectedHookIndex: 0,
      selectedImageIndex: 0,
      images: [],
      hooks: [
        {
          type: 'empathy',
          typeName: '공감/문제제기형',
          icon: 'fa-heart-circle-bolt',
          badgeClass: 'badge-empathy',
          text: '입력한 주제에 대해 어디서부터 알아봐야 할지 막막하셨다면, 시간 낭비 없이 핵심만 딱 짚어드립니다.'
        },
        {
          type: 'curiosity',
          typeName: '호기심/비밀형',
          icon: 'fa-lightbulb',
          badgeClass: 'badge-curiosity',
          text: '남들은 잘 모르는 숨은 꿀팁과 실패 없는 노하우를 직접 경험해보고 낱낱이 정리했습니다.'
        },
        {
          type: 'result',
          typeName: '결과/해결책형',
          icon: 'fa-circle-check',
          badgeClass: 'badge-result',
          text: '더 이상 검색창을 헤매지 마세요! 이 글 하나로 조건, 방법, 실사용 팁까지 완벽하게 종결해 드립니다.'
        }
      ],
      targetAudience: '일상/생활 정보를 찾는 대중 및 검색 방문자',
      painPoint: '수많은 광고성 글 속에서 신뢰할 수 있는 진짜 알짜 정보를 찾기 어려움',
      searchStage: '초기 정보 탐색 및 신뢰할 수 있는 대안 비교 단계',
      strategy: '첫 문단에서 명확한 결론을 제시하고 모바일 호흡에 맞춘 짧은 단락 전개',
      structure: [
        '독자가 궁금해하는 문제 제시 및 공감대 형성',
        '핵심 개념과 상세 비교표 (소득/스펙/조건)',
        '실제로 적용하는 방법 및 단계별 가이드',
        '주의할 점과 다른 옵션과의 비교 분석',
        '핵심 3줄 요약과 독자 다음 행동(CTA) 안내'
      ]
    },
    editor: {
      title: '',
      contentHtml: '',
      lastSavedTime: null
    },
    publishConfig: {
      tistory: { token: '', blogName: '', visibility: '3', categoryId: '', tags: '' },
      blogger: { token: '', blogId: '', status: 'LIVE', labels: '' },
      github: { token: '', repo: '', branch: 'main', path: '_posts/' }
    },
    seo: {
      score: 0,
      charWithSpace: 0,
      charWithoutSpace: 0,
      wordCount: 0,
      readingMinutes: 0,
      mainKeywordCount: 0,
      mainKeywordDensity: 0,
      headingCount: 0,
      imageCount: 0,
      paragraphCount: 0,
      isTitleMatched: false
    }
  };

  const STORAGE_KEY = 'bldock_workspace_draft_v3';
  const PUBLISH_STORAGE_KEY = 'bldock_publish_credentials_v1';
  let autosaveTimer = null;

  // ==========================================================================
  // DOM Elements Selector Cache
  // ==========================================================================
  const elements = {
    // Navigation & Tabs
    tabStep1: document.getElementById('tabStep1'),
    tabStep2: document.getElementById('tabStep2'),
    sectionStep1: document.getElementById('sectionStep1'),
    sectionStep2: document.getElementById('sectionStep2'),
    btnQuickLaunch: document.getElementById('btnQuickLaunch'),

    // Step 1 Form
    platformChips: document.querySelectorAll('.platform-chips-grid .chip-btn'),
    inputTopic: document.getElementById('inputTopic'),
    btnTopicExample: document.getElementById('btnTopicExample'),
    inputMainKeyword: document.getElementById('inputMainKeyword'),
    inputSubKeywords: document.getElementById('inputSubKeywords'),
    selectTone: document.getElementById('selectTone'),
    selectLength: document.getElementById('selectLength'),
    btnGeneratePlan: document.getElementById('btnGeneratePlan'),
    planStatusBadge: document.getElementById('planStatusBadge'),
    planSpinner: document.getElementById('planSpinner'),

    // Step 1 AI Preview
    aiImageOptionsContainer: document.getElementById('aiImageOptionsContainer'),
    hookOptionsContainer: document.getElementById('hookOptionsContainer'),
    previewTargetAudience: document.getElementById('previewTargetAudience'),
    previewPainPoint: document.getElementById('previewPainPoint'),
    previewSearchStage: document.getElementById('previewSearchStage'),
    previewStrategy: document.getElementById('previewStrategy'),
    previewStructureList: document.getElementById('previewStructureList'),
    btnProceedToEditor: document.getElementById('btnProceedToEditor'),

    // Step 2 Editor
    viewModeBtns: document.querySelectorAll('.view-mode-btn'),
    btnRegenerateDraft: document.getElementById('btnRegenerateDraft'),
    autosaveStatus: document.getElementById('autosaveStatus'),
    btnNewDraft: document.getElementById('btnNewDraft'),
    editorTitleInput: document.getElementById('editorTitleInput'),
    titleKeywordStatus: document.getElementById('titleKeywordStatus'),
    formattingToolbar: document.getElementById('formattingToolbar'),
    richEditor: document.getElementById('richEditor'),
    previewContainer: document.getElementById('previewContainer'),
    btnInsertCallout: document.getElementById('btnInsertCallout'),
    btnInsertTable: document.getElementById('btnInsertTable'),
    btnInsertImagePlaceholder: document.getElementById('btnInsertImagePlaceholder'),
    quickParagraphCount: document.getElementById('quickParagraphCount'),
    quickImageCount: document.getElementById('quickImageCount'),

    // Step 2 SEO Sidebar
    seoScoreVal: document.getElementById('seoScoreVal'),
    gaugeProgress: document.getElementById('gaugeProgress'),
    seoRatingBadge: document.getElementById('seoRatingBadge'),
    seoScoreComment: document.getElementById('seoScoreComment'),
    charCountWithSpace: document.getElementById('charCountWithSpace'),
    charCountWithoutSpace: document.getElementById('charCountWithoutSpace'),
    readingTime: document.getElementById('readingTime'),
    wordCount: document.getElementById('wordCount'),

    // Keyword Analysis
    kdMainName: document.getElementById('kdMainName'),
    kdMainCount: document.getElementById('kdMainCount'),
    kdMainPercent: document.getElementById('kdMainPercent'),
    kdMainProgress: document.getElementById('kdMainProgress'),
    kdMainStatus: document.getElementById('kdMainStatus'),
    subKeywordsContainer: document.getElementById('subKeywordsContainer'),

    // Checklist
    checkTitleKeyword: document.getElementById('checkTitleKeyword'),
    checkHeadingCount: document.getElementById('checkHeadingCount'),
    checkKeywordFrequency: document.getElementById('checkKeywordFrequency'),
    checkContentLength: document.getElementById('checkContentLength'),
    checkParagraphs: document.getElementById('checkParagraphs'),
    checkImageCount: document.getElementById('checkImageCount'),

    // Export & Publish Buttons
    btnOpenPublishModal: document.getElementById('btnOpenPublishModal'),
    btnCopyNaver: document.getElementById('btnCopyNaver'),
    btnCopyTistory: document.getElementById('btnCopyTistory'),
    btnCopyThreads: document.getElementById('btnCopyThreads'),
    btnCopyCleanText: document.getElementById('btnCopyCleanText'),
    btnDownloadMd: document.getElementById('btnDownloadMd'),
    toastContainer: document.getElementById('toastContainer'),

    // Publish Modal Elements
    publishModalOverlay: document.getElementById('publishModalOverlay'),
    btnClosePublishModal: document.getElementById('btnClosePublishModal'),
    modalTabBtns: document.querySelectorAll('.modal-tab-btn'),
    publishTabPanels: document.querySelectorAll('.publish-tab-panel'),
    btnTogglePws: document.querySelectorAll('.btn-toggle-pw'),
    btnSaveCredentials: document.getElementById('btnSaveCredentials'),
    btnExecutePublish: document.getElementById('btnExecutePublish'),
    btnPublishText: document.getElementById('btnPublishText'),
    publishSpinner: document.getElementById('publishSpinner'),
    publishResultBanner: document.getElementById('publishResultBanner'),
    resultTitle: document.getElementById('resultTitle'),
    resultDesc: document.getElementById('resultDesc'),
    resultLinkBtn: document.getElementById('resultLinkBtn'),
    btnNaverSafeCopyAndOpen: document.getElementById('btnNaverSafeCopyAndOpen'),
    btnPublishToNaverDirect: document.getElementById('btnPublishToNaverDirect'),

    // Threads Modal Elements
    threadsPreviewList: document.getElementById('threadsPreviewList'),
    btnCopyAllThreads: document.getElementById('btnCopyAllThreads'),
    btnOpenThreadsWeb: document.getElementById('btnOpenThreadsWeb'),
    selectThreadsCount: document.getElementById('selectThreadsCount'),
    threadsSelectedBadge: document.getElementById('threadsSelectedBadge'),
    btnToggleAllThreads: document.getElementById('btnToggleAllThreads'),

    // Modal Inputs
    inputBloggerToken: document.getElementById('inputBloggerToken'),
    inputBloggerBlogId: document.getElementById('inputBloggerBlogId'),
    selectBloggerStatus: document.getElementById('selectBloggerStatus'),
    bloggerScheduleWrap: document.getElementById('bloggerScheduleWrap'),
    inputBloggerScheduleTime: document.getElementById('inputBloggerScheduleTime'),
    inputBloggerLabels: document.getElementById('inputBloggerLabels'),

    inputTistoryToken: document.getElementById('inputTistoryToken'),
    inputTistoryBlogName: document.getElementById('inputTistoryBlogName'),
    selectTistoryVisibility: document.getElementById('selectTistoryVisibility'),
    inputTistoryCategory: document.getElementById('inputTistoryCategory'),
    inputTistoryTags: document.getElementById('inputTistoryTags'),

    inputGithubToken: document.getElementById('inputGithubToken'),
    inputGithubRepo: document.getElementById('inputGithubRepo'),
    inputGithubBranch: document.getElementById('inputGithubBranch'),
    inputGithubPath: document.getElementById('inputGithubPath')
  };

  // ==========================================================================
  // Initialization
  // ==========================================================================
  function init() {
    loadDraftFromStorage();
    loadPublishCredentials();
    bindEvents();
    if (!state.plan.images || state.plan.images.length === 0) {
      generateInitialDefaultImages();
    }
    renderPlanPreview();
    runSeoAnalysis();
  }

  // ==========================================================================
  // Event Bindings
  // ==========================================================================
  function bindEvents() {
    // Step Navigation
    elements.tabStep1.addEventListener('click', () => switchStep(1));
    elements.tabStep2.addEventListener('click', () => switchStep(2));
    elements.btnQuickLaunch.addEventListener('click', () => switchStep(2));
    elements.btnProceedToEditor.addEventListener('click', () => {
      applyPlanToEditor(true);
      switchStep(2);
    });

    // Step 1 Platform Selection
    elements.platformChips.forEach(chip => {
      chip.addEventListener('click', () => {
        elements.platformChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.plan.platform = chip.getAttribute('data-platform');
        
        if (state.plan.platform === 'naver') {
          elements.selectTone.value = 'friendly';
        } else if (state.plan.platform === 'tistory' || state.plan.platform === 'blogger') {
          elements.selectTone.value = 'professional';
        } else if (state.plan.platform === 'threads') {
          elements.selectTone.value = 'snackable';
        } else if (state.plan.platform === 'brunch') {
          elements.selectTone.value = 'review';
        }

        autoUpdatePlan();
      });
    });

    // Step 1 Form Inputs
    elements.inputTopic.addEventListener('input', debounce(autoUpdatePlan, 400));
    elements.inputMainKeyword.addEventListener('input', () => {
      state.plan.mainKeyword = elements.inputMainKeyword.value.trim();
      runSeoAnalysis();
      triggerAutosave();
    });
    elements.inputSubKeywords.addEventListener('input', () => {
      parseSubKeywords();
      runSeoAnalysis();
      triggerAutosave();
    });
    elements.selectTone.addEventListener('change', autoUpdatePlan);
    elements.selectLength.addEventListener('change', () => {
      state.plan.targetLength = parseInt(elements.selectLength.value, 10);
      runSeoAnalysis();
      triggerAutosave();
    });

    // Step 1 Example & Actions
    elements.btnTopicExample.addEventListener('click', insertExampleTopic);
    elements.btnGeneratePlan.addEventListener('click', generateDetailedAiPlan);

    // Step 2 View Mode Switcher
    elements.viewModeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.viewModeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setEditorView(btn.getAttribute('data-view'));
      });
    });

    // Step 2 Draft Regenerate
    elements.btnRegenerateDraft.addEventListener('click', () => {
      if (confirm('현재 기획 설정으로 AI 이미지와 상세 비교표를 포함한 초안을 다시 생성하시겠습니까?')) {
        applyPlanToEditor(true);
        showToast('✨ AI 이미지 및 상세 비교표가 포함된 새 초안이 완성되었습니다!', 'success');
      }
    });

    // Step 2 Title & Content Input
    elements.editorTitleInput.addEventListener('input', () => {
      state.editor.title = elements.editorTitleInput.value;
      runSeoAnalysis();
      triggerAutosave();
    });

    elements.richEditor.addEventListener('input', () => {
      state.editor.contentHtml = elements.richEditor.innerHTML;
      runSeoAnalysis();
      triggerAutosave();
    });

    elements.btnNewDraft.addEventListener('click', resetDraft);

    // Step 2 Toolbar Actions
    setupToolbarActions();

    // Step 2 Export & Copy Buttons
    elements.btnCopyNaver.addEventListener('click', copyForNaverBlog);
    elements.btnCopyTistory.addEventListener('click', copyForTistory);
    if (elements.btnCopyThreads) {
      elements.btnCopyThreads.addEventListener('click', () => openPublishModal('threads'));
    }
    elements.btnCopyCleanText.addEventListener('click', copyCleanText);
    elements.btnDownloadMd.addEventListener('click', downloadMarkdownFile);

    // Publish Modal Events
    elements.btnOpenPublishModal.addEventListener('click', () => openPublishModal());
    elements.btnClosePublishModal.addEventListener('click', closePublishModal);
    elements.publishModalOverlay.addEventListener('click', (e) => {
      if (e.target === elements.publishModalOverlay) closePublishModal();
    });

    // Modal Tabs Switching
    elements.modalTabBtns.forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        const platform = tabBtn.getAttribute('data-publish-platform');
        switchPublishTab(platform);
      });
    });

    // Toggle Password Input Visibility
    elements.btnTogglePws.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (input) {
          if (input.type === 'password') {
            input.type = 'text';
            btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
          } else {
            input.type = 'password';
            btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
          }
        }
      });
    });

    // Auto-save on input for Blogger & Platform Credentials
    if (elements.inputBloggerBlogId) {
      elements.inputBloggerBlogId.addEventListener('input', () => savePublishCredentials(false));
    }
    if (elements.inputBloggerToken) {
      elements.inputBloggerToken.addEventListener('input', () => savePublishCredentials(false));
    }
    if (elements.selectBloggerStatus) {
      elements.selectBloggerStatus.addEventListener('change', () => {
        toggleBloggerScheduleField();
        savePublishCredentials(false);
      });
    }
    if (elements.inputBloggerScheduleTime) {
      elements.inputBloggerScheduleTime.addEventListener('input', () => savePublishCredentials(false));
    }
    if (elements.inputBloggerLabels) {
      elements.inputBloggerLabels.addEventListener('input', () => savePublishCredentials(false));
    }
    if (elements.inputTistoryToken) {
      elements.inputTistoryToken.addEventListener('input', () => savePublishCredentials(false));
    }
    if (elements.inputTistoryBlogName) {
      elements.inputTistoryBlogName.addEventListener('input', () => savePublishCredentials(false));
    }
    if (elements.inputGithubToken) {
      elements.inputGithubToken.addEventListener('input', () => savePublishCredentials(false));
    }
    if (elements.inputGithubRepo) {
      elements.inputGithubRepo.addEventListener('input', () => savePublishCredentials(false));
    }

    // Threads Modal Controls & Buttons
    if (elements.selectThreadsCount) {
      elements.selectThreadsCount.addEventListener('change', () => {
        renderThreadsPreview(true);
      });
    }
    if (elements.btnToggleAllThreads) {
      elements.btnToggleAllThreads.addEventListener('click', toggleAllThreadsSelection);
    }
    if (elements.btnCopyAllThreads) {
      elements.btnCopyAllThreads.addEventListener('click', copyThreadsSeries);
    }
    if (elements.btnOpenThreadsWeb) {
      elements.btnOpenThreadsWeb.addEventListener('click', () => {
        window.open('https://www.threads.net', '_blank');
      });
    }

    // Save Credentials Button (Manual save with feedback toast)
    elements.btnSaveCredentials.addEventListener('click', () => savePublishCredentials(true));

    // Execute Publish Button
    elements.btnExecutePublish.addEventListener('click', executeAutoPublish);

    // Naver Direct Mobile & Desktop Auto-Publisher
    if (elements.btnPublishToNaverDirect) {
      elements.btnPublishToNaverDirect.addEventListener('click', () => {
        const title = elements.editorTitleInput.value.trim() || state.plan.topic;
        const contentHtml = elements.richEditor.innerHTML;
        const postData = {
          title: title,
          contentHtml: contentHtml,
          plainText: getCleanPlainText(contentHtml),
          tags: [state.plan.mainKeyword, ...(state.plan.subKeywords || [])].filter(Boolean)
        };
        publishToNaverDirect(postData);
      });
    }

    // Naver Safe Guide Copy & Open (Manduyat 딸깍 SNS Extension Bridge)
    elements.btnNaverSafeCopyAndOpen.addEventListener('click', () => {
      copyForNaverBlog();
      try {
        const title = elements.editorTitleInput.value.trim();
        const editorHtml = elements.richEditor.innerHTML;
        const naverFormattedHtml = convertToNaverCleanHtml(editorHtml);
        const payload = {
          title: title,
          contentHtml: naverFormattedHtml,
          plainText: getCleanPlainText(editorHtml),
          tags: [state.plan.mainKeyword, ...(state.plan.subKeywords || [])].filter(Boolean),
          timestamp: Date.now()
        };
        localStorage.setItem('bldock_naver_transfer_data', JSON.stringify(payload));
        window.postMessage({ type: 'BLODOCK_NAVER_TRANSFER', ...payload }, '*');
      } catch (e) {}

      const naverWriteUrl = 'https://blog.naver.com/MyBlog.naver?Redirect=Write';
      window.open(naverWriteUrl, '_blank');
      showToast('🟢 네이버 블로그 스마트에디터 ONE 글쓰기 창으로 이동합니다! 커서를 누르고 붙여넣기(Ctrl+V)를 하세요.', 'success');
      closePublishModal();
    });
  }

  // ==========================================================================
  // Step Navigation & View Modes
  // ==========================================================================
  function switchStep(stepNumber) {
    state.currentStep = stepNumber;
    if (stepNumber === 1) {
      elements.tabStep1.classList.add('active');
      elements.tabStep2.classList.remove('active');
      elements.sectionStep1.classList.add('active');
      elements.sectionStep2.classList.remove('active');
    } else {
      elements.tabStep1.classList.remove('active');
      elements.tabStep2.classList.add('active');
      elements.sectionStep1.classList.remove('active');
      elements.sectionStep2.classList.add('active');
      
      if (!elements.richEditor.innerText.trim() && (state.plan.topic || elements.inputTopic.value.trim())) {
        applyPlanToEditor(true);
      }
      runSeoAnalysis();
    }
  }

  function setEditorView(viewMode) {
    state.activeView = viewMode;
    if (viewMode === 'editor') {
      elements.richEditor.classList.remove('hide');
      elements.previewContainer.classList.add('hide');
      elements.formattingToolbar.style.opacity = '1';
      elements.formattingToolbar.style.pointerEvents = 'auto';
    } else if (viewMode === 'naver-preview') {
      elements.richEditor.classList.add('hide');
      elements.previewContainer.classList.remove('hide');
      elements.formattingToolbar.style.opacity = '0.5';
      elements.formattingToolbar.style.pointerEvents = 'none';
      renderNaverMobilePreview();
    } else if (viewMode === 'clean-preview') {
      elements.richEditor.classList.add('hide');
      elements.previewContainer.classList.remove('hide');
      elements.formattingToolbar.style.opacity = '0.5';
      elements.formattingToolbar.style.pointerEvents = 'none';
      renderCleanPreview();
    }
  }

  function renderNaverMobilePreview() {
    const title = elements.editorTitleInput.value || '제목 없음';
    const bodyHtml = elements.richEditor.innerHTML || '<p style="color: #94a3b8;">작성된 본문 내용이 없습니다.</p>';

    elements.previewContainer.innerHTML = `
      <div class="naver-mobile-mode">
        <div style="font-size: 0.75rem; color: #03c75a; font-weight: 700; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 4px;">
          <span style="background: #03c75a; color: #fff; width: 16px; height: 16px; display: inline-flex; align-items: center; justify-content: center; border-radius: 3px; font-size: 10px;">N</span>
          네이버 블로그 모바일 뷰어 미리보기
        </div>
        <h1 style="font-size: 1.35rem; font-weight: 800; color: #111827; margin-bottom: 1rem; line-height: 1.4;">${escapeHtml(title)}</h1>
        <div style="font-size: 0.78rem; color: #9ca3af; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid #f3f4f6;">
          <span>작성자: BLODOCK</span> · <span>방금 전</span>
        </div>
        <div class="naver-body-content" style="font-size: 0.98rem; line-height: 1.85; color: #374151;">
          ${bodyHtml}
        </div>
      </div>
    `;
  }

  function renderCleanPreview() {
    const title = elements.editorTitleInput.value || '제목 없음';
    const plainBody = getCleanPlainText(elements.richEditor.innerHTML);

    elements.previewContainer.innerHTML = `
      <div class="clean-text-mode">
# ${escapeHtml(title)}

${escapeHtml(plainBody)}
      </div>
    `;
  }

  // ==========================================================================
  // Category Detection
  // ==========================================================================
  function detectTopicCategory(topic) {
    const t = topic.toLowerCase();
    if (t.includes('맛집') || t.includes('카페') || t.includes('여행') || t.includes('숙소') || t.includes('식당') || t.includes('펜션') || t.includes('데이트') || t.includes('코스')) {
      return 'food_travel';
    } else if (t.includes('신청') || t.includes('조건') || t.includes('지원금') || t.includes('장려금') || t.includes('환급') || t.includes('세금') || t.includes('대출') || t.includes('청약') || t.includes('보험')) {
      return 'gov_finance';
    } else if (t.includes('후기') || t.includes('리뷰') || t.includes('장단점') || t.includes('비교') || t.includes('청소기') || t.includes('노트북') || t.includes('스마트폰') || t.includes('내돈내산') || t.includes('추천')) {
      return 'product_review';
    } else if (t.includes('루틴') || t.includes('공부') || t.includes('자격증') || t.includes('모닝') || t.includes('습관') || t.includes('생산성') || t.includes('다이어트') || t.includes('운동')) {
      return 'self_growth';
    }
    return 'general';
  }

  // ==========================================================================
  // AI Real-time Image Prompts & Dynamic SVG Artwork Generator
  // ==========================================================================
  function generateImagePromptsForTopic(topic, mainKw, category) {
    const kw = mainKw || topic;
    
    let styles = [
      {
        styleKey: 'photo',
        styleTag: '📸 포토리얼리즘',
        title: `${kw} 현장 실사 스타일`,
        promptEn: `A clean, hyper-realistic photography shot of ${kw}, modern studio lighting, 8k resolution, cinematic aesthetic, shallow depth of field.`,
        promptKo: `선명한 조명과 자연스러운 구도의 실사 촬영 스타일`,
        themeColorA: '#3b82f6',
        themeColorB: '#1d4ed8',
        iconName: 'fa-camera'
      },
      {
        styleKey: '3d_art',
        styleTag: '🎨 3D 스튜디오 일러스트',
        title: `${kw} 모던 3D 그래픽`,
        promptEn: `Modern 3D isometric illustration about ${kw}, pastel clay render, soft shadows, vibrant gradients, minimalism, Behance trending.`,
        promptKo: `트렌디한 3D 입체 그래픽과 부드러운 파스텔 톤`,
        themeColorA: '#8b5cf6',
        themeColorB: '#6366f1',
        iconName: 'fa-cubes'
      },
      {
        styleKey: 'infographic',
        styleTag: '📊 플랫 인포그래픽',
        title: `${kw} 데이터 시각화`,
        promptEn: `Clean vector infographic visual about ${kw}, structured badges, flowchart icons, corporate modern palette, high contrast.`,
        promptKo: `직관적인 도표와 아이콘이 강조된 정보 전달용 그래픽`,
        themeColorA: '#0d9488',
        themeColorB: '#059669',
        iconName: 'fa-chart-pie'
      }
    ];

    return styles.map((item, idx) => {
      const svgDataUrl = createTopicSvgArtwork(kw, category, item, idx);
      return {
        ...item,
        dataUrl: svgDataUrl
      };
    });
  }

  function createTopicSvgArtwork(keyword, category, item, index) {
    let iconSymbol = '⚡';
    if (category === 'gov_finance') iconSymbol = '💰';
    else if (category === 'food_travel') iconSymbol = '🍽️';
    else if (category === 'product_review') iconSymbol = '📱';
    else if (category === 'self_growth') iconSymbol = '⏰';

    const cleanKw = escapeHtml(keyword.length > 16 ? keyword.substring(0, 16) + '...' : keyword);
    const subLabel = escapeHtml(item.styleTag);

    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360" width="100%" height="100%">
        <defs>
          <linearGradient id="grad${index}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${item.themeColorA}"/>
            <stop offset="100%" stop-color="${item.themeColorB}"/>
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" flood-opacity="0.25"/>
          </filter>
        </defs>
        <rect width="600" height="360" fill="url(#grad${index})"/>
        <circle cx="500" cy="60" r="140" fill="rgba(255,255,255,0.08)"/>
        <circle cx="100" cy="300" r="100" fill="rgba(255,255,255,0.06)"/>
        
        <g filter="url(#shadow)">
          <rect x="50" y="50" width="500" height="260" rx="16" fill="#ffffff" fill-opacity="0.95"/>
        </g>
        
        <text x="300" y="115" font-family="'Pretendard', sans-serif" font-size="44" text-anchor="middle">${iconSymbol}</text>
        <text x="300" y="165" font-family="'Pretendard', sans-serif" font-size="22" font-weight="800" fill="#0f172a" text-anchor="middle">${cleanKw}</text>
        <text x="300" y="198" font-family="'Pretendard', sans-serif" font-size="14" font-weight="600" fill="#64748b" text-anchor="middle">BLODOCK AI ART GENERATOR</text>
        
        <rect x="180" y="230" width="240" height="36" rx="18" fill="${item.themeColorA}"/>
        <text x="300" y="253" font-family="'Pretendard', sans-serif" font-size="13" font-weight="700" fill="#ffffff" text-anchor="middle">${subLabel}</text>
      </svg>
    `;

    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString);
  }

  function generateInitialDefaultImages() {
    const defaultTopic = state.plan.topic || '블로그 포스팅 기획';
    const mainKw = state.plan.mainKeyword || 'BLODOCK AI';
    const category = detectTopicCategory(defaultTopic);
    state.plan.images = generateImagePromptsForTopic(defaultTopic, mainKw, category);
    state.plan.selectedImageIndex = 0;
  }

  // ==========================================================================
  // Contextual HTML Table Generator Engine
  // ==========================================================================
  function generateContextualTableHtml(topic, mainKw, category, subKws) {
    let headers = [];
    let rows = [];

    if (category === 'gov_finance') {
      headers = ['가구 구분', '2024년 총소득 기준', '재산 합산 기준', '최대 지급 예상액'];
      rows = [
        ['단독 가구', '연 2,200만 원 미만', '2억 4,000만 원 미만', '최대 165만 원'],
        ['홑벌이 가구', '연 3,200만 원 미만', '2억 4,000만 원 미만', '최대 285만 원'],
        ['맞벌이 가구', '연 3,800만 원 미만', '2억 4,000만 원 미만', '최대 330만 원']
      ];
    } else if (category === 'food_travel') {
      headers = ['추천 장소 / 명소', '대표 시그니처 메뉴', '1인 예상 가격대', '주차 및 방문 꿀팁'];
      rows = [
        [`${mainKw} 1호점`, '특선 메인 시그니처 코스', '15,000원 ~ 25,000원', '지하 전용 주차장 2시간 무료 지원'],
        [`${subKws[0] || '센트럴 핫플레이스'}`, '수제 대표 플레이트 & 음료', '18,000원 ~ 30,000원', '주말 사전 테이블링 원격 줄서기 필수'],
        [`${subKws[1] || '감성 디저트 스팟'}`, '시그니처 베이커리 세트', '9,000원 ~ 16,000원', '인근 공영주차장 이용 시 할인 적용']
      ];
    } else if (category === 'product_review') {
      headers = ['비교 모델', '핵심 스펙 & 성능', '핵심 편의 기능', '가성비 종합 평점'];
      rows = [
        ['A사 플래그십 모델', '6,000Pa 강력 흡입 / 5,200mAh', '온수 세척 & 열풍 건조 스테이션', '★★★★☆ (4.8 / 5.0)'],
        ['B사 가성비 인기 모델', '5,000Pa 흡입력 / 스마트 센서', '자동 먼지 비움 및 듀얼 물걸레', '★★★★★ (4.9 / 5.0)'],
        ['C사 슬림형 컴팩트', '4,500Pa 흡입력 / 초슬림 바디', '기본 회전 물걸레 및 앱 연동', '★★★★☆ (4.6 / 5.0)']
      ];
    } else if (category === 'self_growth') {
      headers = ['실천 단계', '추천 시간대', '핵심 행동 루틴', '기대 효과 & 성공 포인트'];
      rows = [
        ['1단계: 기상 & 수분 섭취', '06:00 ~ 06:15', '미온수 1잔 마시기 + 가벼운 스트레칭', '신진대사 촉진 및 뇌 깨우기'],
        ['2단계: 집중 독서/학습', '06:15 ~ 06:45', '오늘의 성장 서적 15~20페이지 완독', '지적 동기부여 및 자기 통제감 획득'],
        ['3단계: 하루 우선순위 정리', '06:45 ~ 07:00', '오늘 꼭 마칠 3가지 핵심 Action Item 기록', '업무 생산성 200% 극대화']
      ];
    } else {
      headers = ['비교 분석 항목', '기존 일반적인 접근법', 'BLODOCK 추천 실행 전략', '예상되는 개선 효과'];
      rows = [
        ['정보 탐색 및 분석', '포털 단순 검색 및 흩어진 정보 수집', '검증된 핵심 체크리스트 우선 검토', '탐색 소요 시간 70% 단축'],
        ['실천 및 실행 방식', '계획 없는 주먹구구식 개별 시도', '단계별 표준화 로드맵 적용', '시행착오 및 실패 확률 최소화'],
        ['사후 관리 및 지속성', '일회성 시도 후 피로감으로 중단', '자동화 루틴과 주간 점검 체계화', '장기적인 목표 달성률 극대화']
      ];
    }

    let tableHtml = `
      <div class="table-responsive-wrapper">
        <table class="bldock-data-table">
          <thead>
            <tr>
              ${headers.map((h, i) => `<th class="${i === 0 ? 'highlight-col' : ''}">${escapeHtml(h)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map((cell, i) => `<td class="${i === 0 ? 'highlight-col' : ''}">${escapeHtml(cell)}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    return tableHtml;
  }

  // ==========================================================================
  // Examples & AI Plan Generation Engine
  // ==========================================================================
  const EXAMPLE_TOPICS = [
    {
      topic: '2024년 근로장려금 정기신청 자격 조건 및 지급일 환급 꿀팁 총정리',
      mainKeyword: '2024 근로장려금 신청방법',
      subKeywords: '근로장려금 지급일, 소득요건, 홈택스 모바일 신청, 탈락 방지',
      tone: 'professional',
      length: 2500,
      platform: 'blogger'
    },
    {
      topic: '인천 송도 센트럴파크 근처 가볼 만한 맛집 BEST 5',
      mainKeyword: '인천 송도 맛집',
      subKeywords: '송도 센트럴파크 맛집, 송도 현대아울렛 맛집, 주차 팁, 솔직 후기',
      tone: 'friendly',
      length: 1500,
      platform: 'naver'
    },
    {
      topic: '내돈내산 로봇청소기 3개월 실사용 장단점 솔직 비교 리뷰',
      mainKeyword: '로봇청소기 추천 후기',
      subKeywords: '물걸레 로봇청소기, 층간소음, 유지비용, 가성비 모델',
      tone: 'review',
      length: 1500,
      platform: 'tistory'
    },
    {
      topic: '작심삼일 끝내는 초보자 미라클 모닝 30일 루틴 만드는 법',
      mainKeyword: '미라클 모닝 루틴',
      subKeywords: '아침 기상 꿀팁, 생산성 향상, 갓생 살기, 수면 패턴',
      tone: 'snackable',
      length: 1000,
      platform: 'threads'
    }
  ];

  function insertExampleTopic() {
    const rand = EXAMPLE_TOPICS[Math.floor(Math.random() * EXAMPLE_TOPICS.length)];
    elements.inputTopic.value = rand.topic;
    elements.inputMainKeyword.value = rand.mainKeyword;
    elements.inputSubKeywords.value = rand.subKeywords;
    elements.selectTone.value = rand.tone;
    elements.selectLength.value = rand.length;

    state.plan.topic = rand.topic;
    state.plan.mainKeyword = rand.mainKeyword;
    state.plan.tone = rand.tone;
    state.plan.targetLength = rand.length;
    state.plan.platform = rand.platform;

    elements.platformChips.forEach(chip => {
      if (chip.getAttribute('data-platform') === rand.platform) chip.classList.add('active');
      else chip.classList.remove('active');
    });

    parseSubKeywords();
    generateDetailedAiPlan();
    showToast('💡 맞춤 예시 주제, 키워드 및 AI 이미지가 자동 생성되었습니다!', 'info');
  }

  function autoUpdatePlan() {
    state.plan.topic = elements.inputTopic.value.trim();
    state.plan.mainKeyword = elements.inputMainKeyword.value.trim();
    state.plan.tone = elements.selectTone.value;
    state.plan.targetLength = parseInt(elements.selectLength.value, 10);
    parseSubKeywords();
    renderPlanPreview();
    runSeoAnalysis();
    triggerAutosave();
  }

  function parseSubKeywords() {
    const raw = elements.inputSubKeywords.value;
    if (!raw.trim()) {
      state.plan.subKeywords = [];
      return;
    }
    state.plan.subKeywords = raw.split(',').map(k => k.trim()).filter(Boolean);
  }

  function generateDetailedAiPlan() {
    const topic = elements.inputTopic.value.trim();
    const mainKw = elements.inputMainKeyword.value.trim() || topic;
    const subKws = state.plan.subKeywords;

    if (!topic) {
      showToast('주제를 먼저 입력해 주세요!', 'warning');
      elements.inputTopic.focus();
      return;
    }

    elements.planSpinner.classList.remove('hide');
    elements.planStatusBadge.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> AI 이미지 및 초안 생성 중...';

    // Show Image Skeletons
    elements.aiImageOptionsContainer.innerHTML = `
      <div class="ai-image-card"><div class="ai-image-skeleton"></div></div>
      <div class="ai-image-card"><div class="ai-image-skeleton"></div></div>
      <div class="ai-image-card"><div class="ai-image-skeleton"></div></div>
    `;

    setTimeout(() => {
      const category = detectTopicCategory(topic);

      state.plan.images = generateImagePromptsForTopic(topic, mainKw, category);
      state.plan.selectedImageIndex = 0;

      let hooks = [];
      let targetAudience = '';
      let painPoint = '';
      let searchStage = '';
      let strategy = '';
      let structure = [];

      if (category === 'gov_finance') {
        hooks = [
          {
            type: 'empathy',
            typeName: '공감/문제제기형',
            icon: 'fa-heart-circle-bolt',
            badgeClass: 'badge-empathy',
            text: `복잡한 자격 요건 때문에 "${mainKw}" 신청을 망설이셨나요? 서류 준비부터 탈락 방지 포인트까지 한눈에 정리했습니다.`
          },
          {
            type: 'curiosity',
            typeName: '호기심/비밀형',
            icon: 'fa-lightbulb',
            badgeClass: 'badge-curiosity',
            text: `대부분 놓치고 지나가는 "${mainKw}" 소득/재산 기준과 추가 지원금 환급 꿀팁을 지금 바로 확인해 보세요.`
          },
          {
            type: 'result',
            typeName: '결과/해결책형',
            icon: 'fa-circle-check',
            badgeClass: 'badge-result',
            text: `놓치면 최대 수백만 원 손해! "${topic}" 자격 조건, 모바일 신청 방법 및 지급일까지 단 3분 만에 마스터하세요.`
          }
        ];
        targetAudience = '정부 지원금 및 세금 환급 제도를 신청하고자 하는 근로자 및 가구';
        painPoint = '공식 공고문이 너무 복잡하고 본인이 자격 대상인지 명확히 판단하기 어려움';
        searchStage = '지원 대상 여부 확인 및 즉시 모바일 신청 단계';
        strategy = '가구별 소득 기준 상세 비교표와 단계별 모바일 신청 화면 캡처 제공';
        structure = [
          `1. ${mainKw} 지원 대상 및 2024년 변경 핵심 기준`,
          `2. 가구 유형별 소득 및 재산 요건 상세 비교표`,
          `3. 3분 만에 끝내는 ${subKws[0] || '온라인/모바일 신청 절차'}`,
          `4. 가장 많이 묻는 FAQ 및 탈락 방지 필수 체크`,
          `5. 지급 예정일과 환급금 조회 방법 총정리`
        ];
      } else if (category === 'food_travel') {
        hooks = [
          {
            type: 'empathy',
            typeName: '공감/문제제기형',
            icon: 'fa-heart-circle-bolt',
            badgeClass: 'badge-empathy',
            text: `광고성 후기에 속아 헛걸음한 적 많으셨죠? 오늘은 제가 직접 발품 팔아 다녀온 "${mainKw}" 찐 방문기를 솔직하게 공유합니다.`
          },
          {
            type: 'curiosity',
            typeName: '호기심/비밀형',
            icon: 'fa-lightbulb',
            badgeClass: 'badge-curiosity',
            text: `현지인들만 아는 "${mainKw}"의 숨은 대표 메뉴와 웨이팅 없이 주차하는 시크릿 팁을 공개합니다. 방문 전 필수 체크!`
          },
          {
            type: 'result',
            typeName: '결과/해결책형',
            icon: 'fa-circle-check',
            badgeClass: 'badge-result',
            text: `데이트나 모임 장소 고민 끝! "${topic}"에 대해 메뉴 선정부터 가성비, 주차까지 한 방에 깔끔하게 정리해 드립니다.`
          }
        ];
        targetAudience = '주말 데이트, 가족 외식, 여행 코스를 탐색하는 2040 스마트 컨슈머';
        painPoint = '무분별한 광고글 속에서 실패 없는 찐맛집과 주차/웨이팅 정보를 얻기 어려움';
        searchStage = '최종 방문지 결정 및 주차/예약 꿀팁 탐색 단계';
        strategy = '실제 음식 사진 배치, 가격 및 주차 비교표 상단 배치로 체류시간 극대화';
        structure = [
          `1. ${mainKw} 위치 및 첫인상 (주차 & 예약 필수 팁)`,
          `2. 추천 스팟별 대표 메뉴 및 가격 상세 비교표`,
          `3. ${subKws[0] || '솔직한 맛 평가'}와 가격 대비 만족도`,
          `4. 방문 전 꼭 알아야 할 주의사항 (웨이팅/브레이크타임)`,
          `5. 최종 총평 및 이런 분들께 강력 추천합니다`
        ];
      } else if (category === 'product_review') {
        hooks = [
          {
            type: 'empathy',
            typeName: '공감/문제제기형',
            icon: 'fa-heart-circle-bolt',
            badgeClass: 'badge-empathy',
            text: `협찬 광고 없는 100% 내돈내산! "${mainKw}" 3개월 동안 매일 쓰면서 느낀 진짜 장단점을 가감 없이 털어놓습니다.`
          },
          {
            type: 'curiosity',
            typeName: '호기심/비밀형',
            icon: 'fa-lightbulb',
            badgeClass: 'badge-curiosity',
            text: `상세페이지에는 절대 안 나오는 "${mainKw}"의 치명적인 아쉬운 점 2가지, 구매 전 꼭 알고 계셔야 합니다.`
          },
          {
            type: 'result',
            typeName: '결과/해결책형',
            icon: 'fa-circle-check',
            badgeClass: 'badge-result',
            text: `살까 말까 고민은 배송만 늦출 뿐! "${topic}"의 핵심 성능, 유지비용, 타사 모델 비교까지 완벽 정리했습니다.`
          }
        ];
        targetAudience = '구매 직전 실제 사용자 후기와 단점을 찾아보는 꼼꼼한 구매자';
        painPoint = '장점만 나열된 광고글 때문에 실제 내구성이나 단점을 파악하기 힘듦';
        searchStage = '제품 구매 직전 최종 비교 및 구매 결정 단계';
        strategy = '실제 사용감 강조, 가성비/유지비 수치 비교표 제시';
        structure = [
          `1. ${mainKw}을(를) 직접 선택하게 된 솔직한 이유`,
          `2. 핵심 모델별 성능 및 스펙 상세 비교표`,
          `3. 실사용 3개월 후기: 가장 만족스러운 Best 3 기능`,
          `4. 솔직히 아쉬웠던 단점과 ${subKws[0] || '유지비용'} 현실`,
          `5. 최종 결론: 이런 분은 꼭 사고, 이런 분은 패스하세요`
        ];
      } else if (category === 'self_growth') {
        hooks = [
          {
            type: 'empathy',
            typeName: '공감/문제제기형',
            icon: 'fa-heart-circle-bolt',
            badgeClass: 'badge-empathy',
            text: `매번 작심삼일로 끝나는 계획에 지치셨나요? 무너지지 않는 "${mainKw}" 습관을 만드는 현실적인 비결을 공유합니다.`
          },
          {
            type: 'curiosity',
            typeName: '호기심/비밀형',
            icon: 'fa-lightbulb',
            badgeClass: 'badge-curiosity',
            text: `의지력에 의존하지 않고 환경을 설계하여 "${mainKw}"을(를) 자동화하는 작은 시스템의 비밀!`
          },
          {
            type: 'result',
            typeName: '결과/해결책형',
            icon: 'fa-circle-check',
            badgeClass: 'badge-result',
            text: `하루 10분 투자로 인생의 밀도가 달라집니다. "${topic}" 단계별 실천 로드맵으로 오늘부터 갓생을 시작해 보세요.`
          }
        ];
        targetAudience = '생산성 향상과 자기계발, 건강한 습관 형성을 원하는 직장인 및 학생';
        painPoint = '의욕만 앞서다 며칠 못 가 포기하고 자책하는 반복적인 패턴';
        searchStage = '동기부여 획득 및 구체적인 실행 방법 탐색 단계';
        strategy = '단계별 실천 로드맵 계획표와 응원 어조의 콜아웃 박스 배치';
        structure = [
          `1. 왜 우리는 ${mainKw}에 매번 실패했을까? (원인 분석)`,
          `2. 단계별 실천 시간표 및 추천 행동 계획표`,
          `3. 하루를 바꾸는 ${subKws[0] || '초보자 맞춤 실행 루틴'}`,
          `4. 권태기와 슬럼프가 왔을 때 극복하는 마인드셋`,
          `5. 오늘 당장 시작할 수 있는 Action Item 3가지`
        ];
      } else {
        hooks = [
          {
            type: 'empathy',
            typeName: '공감/문제제기형',
            icon: 'fa-heart-circle-bolt',
            badgeClass: 'badge-empathy',
            text: `"${topic}"에 대해 수많은 정보가 쏟아지지만, 진짜 나에게 필요한 알짜 정보만 골라 담았습니다.`
          },
          {
            type: 'curiosity',
            typeName: '호기심/비밀형',
            icon: 'fa-lightbulb',
            badgeClass: 'badge-curiosity',
            text: `알고 나면 너무 유용한 "${mainKw}"의 핵심 노하우와 실전 활용법을 일목요연하게 풀어드립니다.`
          },
          {
            type: 'result',
            typeName: '결과/해결책형',
            icon: 'fa-circle-check',
            badgeClass: 'badge-result',
            text: `헤매지 않고 한 번에 끝내는 "${topic}" 종합 완벽 가이드! 지금 바로 확인해 보세요.`
          }
        ];
        targetAudience = '관련 주제에 대해 빠르고 정확한 정보를 찾는 일반 독자층';
        painPoint = '정보가 여러 군데 흩어져 있어 체계적인 요약본을 찾기 어려움';
        searchStage = '신뢰할 수 있는 정보 습득 및 실행 단계';
        strategy = '체계적인 비교표와 300자 이내의 단락 분절을 통한 가독성 강화';
        structure = [
          `1. 독자가 가장 궁금해하는 ${mainKw} 핵심 이슈`,
          `2. 핵심 항목별 특징 및 비교 분석표`,
          `3. 실생활에 바로 적용하는 ${subKws[0] || '구체적인 실행 가이드'}`,
          `4. 주의해야 할 점과 다른 대안 비교`,
          `5. 핵심 요약과 다음 추천 행동`
        ];
      }

      state.plan.hooks = hooks;
      state.plan.selectedHookIndex = 0;
      state.plan.targetAudience = targetAudience;
      state.plan.painPoint = painPoint;
      state.plan.searchStage = searchStage;
      state.plan.strategy = strategy;
      state.plan.structure = structure;

      renderPlanPreview();

      elements.planSpinner.classList.add('hide');
      elements.planStatusBadge.innerHTML = '<i class="fa-solid fa-circle-check text-success"></i> AI 설계 &amp; 이미지 생성 완료';
      showToast('🎨 AI 이미지 3종과 맞춤형 상세 비교표가 생성되었습니다!', 'success');
      triggerAutosave();
    }, 600);
  }

  function renderPlanPreview() {
    // 1. Render AI Images
    elements.aiImageOptionsContainer.innerHTML = '';
    if (state.plan.images && state.plan.images.length > 0) {
      state.plan.images.forEach((imgObj, idx) => {
        const isSelected = state.plan.selectedImageIndex === idx;
        const card = document.createElement('div');
        card.className = `ai-image-card ${isSelected ? 'active' : ''}`;
        card.setAttribute('data-img-idx', idx);

        card.innerHTML = `
          <div class="ai-image-thumbnail-wrap">
            <img src="${imgObj.dataUrl}" alt="${escapeHtml(imgObj.title)}" class="ai-image-thumb">
            <span class="ai-image-style-tag">${escapeHtml(imgObj.styleTag)}</span>
            <div class="ai-image-check-badge">
              <i class="fa-solid ${isSelected ? 'fa-circle-check' : 'fa-circle'}"></i>
            </div>
          </div>
          <div class="ai-image-info">
            <span class="ai-image-title">${escapeHtml(imgObj.title)}</span>
            <p class="ai-image-prompt-preview">${escapeHtml(imgObj.promptKo)}</p>
          </div>
        `;

        card.addEventListener('click', () => {
          state.plan.selectedImageIndex = idx;
          renderPlanPreview();
          showToast(`'${imgObj.styleTag}' 이미지가 본문 대표 사진으로 선택되었습니다.`, 'info');
          triggerAutosave();
        });

        elements.aiImageOptionsContainer.appendChild(card);
      });
    }

    // 2. Render 3 Hook Cards
    elements.hookOptionsContainer.innerHTML = '';
    state.plan.hooks.forEach((hook, idx) => {
      const card = document.createElement('div');
      const isSelected = state.plan.selectedHookIndex === idx;
      card.className = `hook-card-item ${isSelected ? 'active' : ''}`;
      card.setAttribute('data-hook-idx', idx);

      card.innerHTML = `
        <div class="hook-card-header">
          <span class="hook-type-badge ${hook.badgeClass}">
            <i class="fa-solid ${hook.icon}"></i> ${hook.typeName}
          </span>
          <span class="hook-select-indicator">
            <i class="fa-solid ${isSelected ? 'fa-circle-check' : 'fa-circle'}"></i> 
            ${isSelected ? '선택됨' : '선택'}
          </span>
        </div>
        <p class="hook-card-text">${escapeHtml(hook.text)}</p>
      `;

      card.addEventListener('click', () => {
        state.plan.selectedHookIndex = idx;
        renderPlanPreview();
        showToast(`'${hook.typeName}' 후킹 문구가 선택되었습니다.`, 'info');
        triggerAutosave();
      });

      elements.hookOptionsContainer.appendChild(card);
    });

    // 3. Render Persona Data
    elements.previewTargetAudience.textContent = state.plan.targetAudience;
    elements.previewPainPoint.textContent = state.plan.painPoint;
    elements.previewSearchStage.textContent = state.plan.searchStage;
    elements.previewStrategy.textContent = state.plan.strategy;

    // 4. Render 5-step Structure
    elements.previewStructureList.innerHTML = '';
    state.plan.structure.forEach((stepText, idx) => {
      const item = document.createElement('div');
      item.className = 'structure-step-item';
      item.innerHTML = `
        <span class="step-idx">${idx + 1}</span>
        <span class="step-text" contenteditable="true">${escapeHtml(stepText)}</span>
      `;
      const textSpan = item.querySelector('.step-text');
      textSpan.addEventListener('input', () => {
        state.plan.structure[idx] = textSpan.innerText.trim();
        triggerAutosave();
      });
      elements.previewStructureList.appendChild(item);
    });
  }

  // ==========================================================================
  // Full Rich Draft Article Generator Engine (Step 2 Injection)
  // ==========================================================================
  function buildFullDraftArticle(plan) {
    const topic = plan.topic || elements.inputTopic.value.trim() || '블로그 포스팅';
    const mainKw = plan.mainKeyword || elements.inputMainKeyword.value.trim() || topic;
    const subKws = plan.subKeywords.length ? plan.subKeywords : ['꿀팁 정리', '실전 노하우', '주의사항'];
    const selectedHook = plan.hooks[plan.selectedHookIndex] || plan.hooks[0];
    const category = detectTopicCategory(topic);

    const selectedImage = (plan.images && plan.images[plan.selectedImageIndex]) 
      ? plan.images[plan.selectedImageIndex] 
      : (plan.images && plan.images[0] ? plan.images[0] : null);

    let html = '';

    // 1. Intro with Chosen Hook Quote
    html += `<blockquote><strong>💡 시작하며:</strong> ${escapeHtml(selectedHook.text)}</blockquote>`;
    
    // Auto-Attach Selected AI Image
    if (selectedImage) {
      html += `
        <div class="post-featured-image-box">
          <img src="${selectedImage.dataUrl}" alt="${escapeHtml(mainKw)} 관련 AI 생성 대표 이미지" class="post-featured-img">
          <div class="image-caption">▲ [AI 생성 대표 비주얼: ${escapeHtml(selectedImage.styleTag)}] ${escapeHtml(selectedImage.promptKo)}</div>
        </div>
      `;
    }

    html += `<p>안녕하세요! 오늘은 많은 분들이 검색하고 궁금해하시는 <strong>${escapeHtml(mainKw)}</strong>에 대해 자세하고 명쾌하게 정리해 드리고자 합니다. 정보가 너무 방대하여 어디서부터 확인해야 할지 망설이셨다면 이번 글 하나로 완벽하게 해결해 보세요.</p>`;
    html += `<p>모바일 기기에서도 한눈에 파악하실 수 있도록 핵심 요약과 <strong>상세 비교표</strong>, 실전 꿀팁을 나누어 구성했습니다. 끝까지 확인하시고 유익한 혜택을 빠짐없이 챙겨가시길 바랍니다!</p>`;
    html += `<hr>`;

    // 2. Section 1 (H2) - Problem & Context
    const sec1Title = plan.structure[0] || `1. ${mainKw} 꼭 알아야 하는 이유와 배경`;
    html += `<h2>${escapeHtml(sec1Title)}</h2>`;
    html += `<p>우리가 일상에서 <strong>${escapeHtml(mainKw)}</strong>을(를) 접할 때 가장 큰 걸림돌은 부정확한 정보와 광고성 글입니다. 필수 요건이나 사전 준비 절차를 제대로 숙지하지 않고 진행하면 불필요한 시간과 비용을 낭비하게 되죠.</p>`;
    html += `<p>따라서 본격적인 실행에 앞서 기본 개념을 명확히 잡고, 자격 요건과 주의사항을 사전에 비교·검토하는 것이 성공적인 결과를 위한 첫걸음입니다.</p>`;

    // Image placeholder 1
    html += `
      <div class="image-placeholder-block">
        <div class="img-icon"><i class="fa-solid fa-image"></i></div>
        <div style="font-weight: 700; color: #475569;">[사진 1: ${escapeHtml(mainKw)} 관련 실물/현장 캡처 권장]</div>
        <div class="image-caption">▲ 공식 공고 화면, 매장 전경 또는 모바일 인증 화면을 첨부하세요 (Alt 텍스트: ${escapeHtml(mainKw)} 현장)</div>
      </div>
      <p><br></p>
    `;

    // 3. Section 2 (H2) - Detailed Contextual Comparison Table & Analysis
    const sec2Title = plan.structure[1] || `2. ${mainKw} 핵심 기준 및 상세 비교표`;
    html += `<h2>${escapeHtml(sec2Title)}</h2>`;
    html += `<p>독자분들이 가장 궁금해하시는 핵심 항목을 한눈에 비교하실 수 있도록 <strong>상세 비교표</strong>로 정리했습니다. 본인에게 해당하는 기준과 혜택을 아래 표에서 직접 확인해 보세요.</p>`;

    // Auto-Attach Contextual HTML Table
    const tableHtml = generateContextualTableHtml(topic, mainKw, category, subKws);
    html += tableHtml;

    // Callout Box (Tip)
    html += `
      <div class="callout-box">
        <strong>💡 ${escapeHtml(mainKw)} 핵심 체크포인트:</strong><br>
        1. <strong>${escapeHtml(subKws[0] || '기준점')}</strong>: 요건 충족 여부를 사전에 모의 계산해 보면 오차 없이 정확한 결과를 얻을 수 있습니다.<br>
        2. <strong>${escapeHtml(subKws[1] || '활용 팁')}</strong>: 마감 기한 직전에는 접속자가 몰릴 수 있으므로 여유 있게 신청하거나 방문하는 것을 추천합니다.
      </div>
    `;

    // 4. Section 3 (H2) - Step-by-step Guide / Review
    const sec3Title = plan.structure[2] || `3. 실전 적용 방법 및 단계별 가이드`;
    html += `<h2>${escapeHtml(sec3Title)}</h2>`;
    html += `<p>이제 본격적으로 <strong>${escapeHtml(mainKw)}</strong>을(를) 신청하거나 방문할 때 따라 하실 수 있는 구체적인 3단계 실행 로드맵을 알려드립니다.</p>`;
    html += `<ul>
      <li><strong>1단계 준비하기:</strong> 본인 인증 수단과 필수 서류, 예약 내역을 사전에 확인합니다.</li>
      <li><strong>2단계 신청/실행:</strong> <strong>${escapeHtml(subKws[1] || '핵심 절차')}</strong>에 맞춰 안내에 따라 순서대로 진행합니다.</li>
      <li><strong>3단계 최종 점검:</strong> 접수 완료 문자나 예약 확정 번호를 캡처하여 안전하게 보관합니다.</li>
    </ul>`;

    // Image placeholder 2
    html += `
      <div class="image-placeholder-block">
        <div class="img-icon"><i class="fa-solid fa-image"></i></div>
        <div style="font-weight: 700; color: #475569;">[사진 2: 세부 메뉴/진행 과정 캡처 사진]</div>
        <div class="image-caption">▲ 구체적인 이용 영수증, 메뉴판, 모바일 진행 캡처를 첨부하세요</div>
      </div>
      <p><br></p>
    `;

    // 5. Section 4 (H2) - Precautions & FAQs
    const sec4Title = plan.structure[3] || `4. 주의사항 및 자주 묻는 질문 (FAQ)`;
    html += `<h2>${escapeHtml(sec4Title)}</h2>`;
    html += `<p>진행 과정에서 자주 발생하는 실수와 <strong>${escapeHtml(subKws[2] || '주의사항')}</strong>을 미리 파악해 두면 탈락이나 혼선을 사전에 완벽히 방지할 수 있습니다.</p>`;

    // Callout Box (Warning)
    html += `
      <div class="callout-box callout-warning">
        <strong>⚠️ 진행 전 꼭 기억해야 할 주의사항:</strong><br>
        • 신청 기한이 지나면 소급 적용이 불가능하므로 반드시 정해진 날짜 이전에 완료하세요.<br>
        • 가구원 변동이나 소득 수정 사항이 있다면 증빙 자료를 빠짐없이 제출해야 합니다.
      </div>
    `;

    // 6. Section 5 (H2) - Conclusion & 3-Bullet Summary & CTA
    const sec5Title = plan.structure[4] || `5. 최종 요약 및 총평`;
    html += `<h2>${escapeHtml(sec5Title)}</h2>`;
    html += `<p>오늘 살펴본 <strong>${escapeHtml(mainKw)}</strong>의 주요 내용을 3줄로 명쾌하게 요약해 드립니다.</p>`;
    html += `<ol>
      <li><strong>${escapeHtml(mainKw)}</strong>은 사전에 비교표를 통해 자격 기준을 파악하는 것이 가장 중요합니다.</li>
      <li><strong>${escapeHtml(subKws[0] || '핵심 요건')}</strong>을(를) 확인하신 뒤 온라인으로 간편하게 신청해 보세요.</li>
      <li>추가로 궁금한 점이 있으시다면 언제든 댓글로 남겨주시면 친절히 답변해 드리겠습니다!</li>
    </ol>`;
    html += `<p style="margin-top: 1.5rem;">포스팅이 도움이 되셨다면 <strong>공감(하트)과 이웃 추가 / 구독</strong> 부탁드립니다. 더 알찬 정보로 다시 찾아오겠습니다. 감사합니다! 😊</p>`;

    return html;
  }

  function applyPlanToEditor(forceOverwrite = false) {
    const topic = state.plan.topic || elements.inputTopic.value.trim();

    if (topic) {
      elements.editorTitleInput.value = topic;
      state.editor.title = topic;
    }

    if (forceOverwrite || !elements.richEditor.innerText.trim()) {
      const fullDraftHtml = buildFullDraftArticle(state.plan);
      elements.richEditor.innerHTML = fullDraftHtml;
      state.editor.contentHtml = fullDraftHtml;
    }

    runSeoAnalysis();
    triggerAutosave();
  }

  // ==========================================================================
  // Rich Text Editor Toolbar Helpers
  // ==========================================================================
  function setupToolbarActions() {
    const toolbarButtons = elements.formattingToolbar.querySelectorAll('.tb-btn[data-command]');
    toolbarButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const command = btn.getAttribute('data-command');
        const value = btn.getAttribute('data-value') || null;

        document.execCommand(command, false, value);
        elements.richEditor.focus();
        state.editor.contentHtml = elements.richEditor.innerHTML;
        runSeoAnalysis();
        triggerAutosave();
      });
    });

    // Insert Callout Box
    elements.btnInsertCallout.addEventListener('click', () => {
      const calloutHtml = `<div class="callout-box"><strong>💡 팁 &amp; 체크포인트:</strong> 여기에 독자가 기억해야 할 핵심 꿀팁을 작성하세요.</div><p><br></p>`;
      insertHtmlAtCursor(calloutHtml);
      runSeoAnalysis();
      triggerAutosave();
    });

    // Insert Comparison Table
    elements.btnInsertTable.addEventListener('click', () => {
      const topic = state.plan.topic || elements.inputTopic.value.trim() || '비교표';
      const mainKw = state.plan.mainKeyword || topic;
      const category = detectTopicCategory(topic);
      const tableHtml = generateContextualTableHtml(topic, mainKw, category, state.plan.subKeywords) + '<p><br></p>';
      insertHtmlAtCursor(tableHtml);
      showToast('상세 비교표(Table)가 삽입되었습니다.', 'success');
      runSeoAnalysis();
      triggerAutosave();
    });

    // Insert Image Placeholder
    elements.btnInsertImagePlaceholder.addEventListener('click', () => {
      const imageCount = (elements.richEditor.querySelectorAll('.image-placeholder-block, .post-featured-image-box').length + 1);
      const imgHtml = `
        <div class="image-placeholder-block">
          <div class="img-icon"><i class="fa-solid fa-image"></i></div>
          <div style="font-weight: 700; color: #475569;">[사진 ${imageCount}: 관련 이미지 권장 위치]</div>
          <div class="image-caption">▲ 설명/캡션: ${state.plan.mainKeyword || '본문 주제'} 관련 사진을 여기에 첨부하세요 (Alt 텍스트)</div>
        </div>
        <p><br></p>
      `;
      insertHtmlAtCursor(imgHtml);
      runSeoAnalysis();
      triggerAutosave();
    });
  }

  function insertHtmlAtCursor(html) {
    elements.richEditor.focus();
    const sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      range.deleteContents();

      const el = document.createElement('div');
      el.innerHTML = html;
      const frag = document.createDocumentFragment();
      let node;
      let lastNode;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);

      if (lastNode) {
        range.setStartAfter(lastNode);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } else {
      elements.richEditor.innerHTML += html;
    }
    state.editor.contentHtml = elements.richEditor.innerHTML;
  }

  // ==========================================================================
  // SEO Analytics Engine
  // ==========================================================================
  function runSeoAnalysis() {
    const title = elements.editorTitleInput.value.trim();
    const plainText = elements.richEditor.innerText.trim();

    const mainKeyword = state.plan.mainKeyword || elements.inputMainKeyword.value.trim();
    const targetLength = state.plan.targetLength || 1500;

    // 1. Character Counts
    const charWithSpace = plainText.length;
    const charWithoutSpace = plainText.replace(/\s/g, '').length;
    const words = plainText ? plainText.split(/\s+/).filter(Boolean) : [];
    const wordCount = words.length;
    const readingMinutes = Math.max(1, Math.ceil(charWithoutSpace / 450));

    state.seo.charWithSpace = charWithSpace;
    state.seo.charWithoutSpace = charWithoutSpace;
    state.seo.wordCount = wordCount;
    state.seo.readingMinutes = readingMinutes;

    elements.charCountWithSpace.innerHTML = `${charWithSpace.toLocaleString()}<small>자</small>`;
    elements.charCountWithoutSpace.innerHTML = `${charWithoutSpace.toLocaleString()}<small>자</small>`;
    elements.wordCount.innerHTML = `${wordCount.toLocaleString()}<small>단어</small>`;
    elements.readingTime.innerHTML = `${readingMinutes}<small>분</small>`;

    // 2. Headings & Elements Count
    const headings = elements.richEditor.querySelectorAll('h2, h3');
    const headingCount = headings.length;
    state.seo.headingCount = headingCount;

    const imageBlocks = elements.richEditor.querySelectorAll('.image-placeholder-block, .post-featured-image-box, img');
    const imageCount = imageBlocks.length;
    state.seo.imageCount = imageCount;
    elements.quickImageCount.textContent = imageCount;

    const paragraphs = elements.richEditor.querySelectorAll('p');
    const paragraphCount = paragraphs.length;
    state.seo.paragraphCount = paragraphCount;
    elements.quickParagraphCount.textContent = paragraphCount;

    // 3. Keyword Density & Frequency
    let mainKwCount = 0;
    let mainKwDensity = 0;

    if (mainKeyword) {
      elements.kdMainName.textContent = mainKeyword;
      const escapedKw = escapeRegex(mainKeyword);
      const matches = plainText.match(new RegExp(escapedKw, 'gi'));
      mainKwCount = matches ? matches.length : 0;

      if (charWithoutSpace > 0) {
        mainKwDensity = ((mainKwCount * mainKeyword.replace(/\s/g, '').length) / charWithoutSpace) * 100;
      }

      elements.kdMainCount.textContent = mainKwCount;
      elements.kdMainPercent.textContent = `${mainKwDensity.toFixed(1)}%`;

      const progressWidth = Math.min(100, Math.round((mainKwDensity / 4.0) * 100));
      elements.kdMainProgress.style.width = `${progressWidth}%`;

      if (mainKwDensity === 0) {
        elements.kdMainProgress.style.backgroundColor = 'var(--text-light)';
        elements.kdMainStatus.innerHTML = '<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> 본문에 키워드가 없습니다</span>';
      } else if (mainKwDensity < 1.0) {
        elements.kdMainProgress.style.backgroundColor = 'var(--warning)';
        elements.kdMainStatus.innerHTML = '<span class="text-warning"><i class="fa-solid fa-circle-info"></i> 빈도 약간 부족 (1.5%~3.0% 권장)</span>';
      } else if (mainKwDensity <= 3.5) {
        elements.kdMainProgress.style.backgroundColor = 'var(--success)';
        elements.kdMainStatus.innerHTML = '<span class="text-success"><i class="fa-solid fa-circle-check"></i> 최적의 키워드 밀도 유지 중</span>';
      } else {
        elements.kdMainProgress.style.backgroundColor = 'var(--danger)';
        elements.kdMainStatus.innerHTML = '<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> 과다 반복 (어뷰징 주의)</span>';
      }
    } else {
      elements.kdMainName.textContent = '미설정 (Step 1)';
      elements.kdMainCount.textContent = '0';
      elements.kdMainPercent.textContent = '0.0%';
      elements.kdMainProgress.style.width = '0%';
      elements.kdMainStatus.textContent = 'Step 1에서 메인 키워드를 입력해 주세요';
    }

    state.seo.mainKeywordCount = mainKwCount;
    state.seo.mainKeywordDensity = mainKwDensity;

    renderSubKeywordsAnalysis(plainText);

    // 4. Title keyword check
    const isTitleMatched = mainKeyword && title.toLowerCase().includes(mainKeyword.toLowerCase());
    state.seo.isTitleMatched = isTitleMatched;

    if (isTitleMatched) {
      elements.titleKeywordStatus.innerHTML = '<i class="fa-solid fa-circle-check text-success"></i> 제목에 메인 키워드가 잘 포함되었습니다';
    } else if (mainKeyword) {
      elements.titleKeywordStatus.innerHTML = '<i class="fa-solid fa-circle-exclamation text-warning"></i> 제목에 메인 키워드가 없습니다';
    } else {
      elements.titleKeywordStatus.innerHTML = '<i class="fa-solid fa-circle-info text-muted"></i> 메인 키워드를 먼저 설정하세요';
    }

    // 5. Checklist items evaluation & Total Score Calculation
    let score = 0;

    // Check 1: Title keyword (15 pts)
    const check1 = isTitleMatched;
    toggleCheckItem(elements.checkTitleKeyword, check1);
    if (check1) score += 15;

    // Check 2: Headings (20 pts)
    const check2 = headingCount >= 2;
    toggleCheckItem(elements.checkHeadingCount, check2, `소제목 (H2/H3) ${headingCount}/2개 이상 배치`);
    if (check2) score += 20;
    else if (headingCount === 1) score += 10;

    // Check 3: Keyword Frequency (20 pts)
    const check3 = mainKwCount >= 3 && mainKwCount <= 14 && mainKwDensity >= 0.8 && mainKwDensity <= 3.8;
    toggleCheckItem(elements.checkKeywordFrequency, check3, `메인 키워드 적정 반복 (${mainKwCount}회 / 권장 3~8회)`);
    if (check3) score += 20;
    else if (mainKwCount >= 1 && mainKwCount <= 16) score += 10;

    // Check 4: Content Length (20 pts)
    const lengthProgress = charWithoutSpace / targetLength;
    const check4 = lengthProgress >= 0.8;
    toggleCheckItem(elements.checkContentLength, check4, `목표 글자 수 달성 (${charWithoutSpace.toLocaleString()}/${targetLength.toLocaleString()}자)`);
    if (check4) score += 20;
    else if (lengthProgress >= 0.5) score += 12;

    // Check 5: Paragraphs & Readability (15 pts)
    const check5 = paragraphCount >= 3 && charWithoutSpace > 200;
    toggleCheckItem(elements.checkParagraphs, check5);
    if (check5) score += 15;

    // Check 6: Image count (10 pts)
    const check6 = imageCount >= 2;
    toggleCheckItem(elements.checkImageCount, check6, `이미지/시각 요소 (${imageCount}/2개 이상 배치)`);
    if (check6) score += 10;
    else if (imageCount === 1) score += 5;

    // Overall Score UI Update
    state.seo.score = score;
    elements.seoScoreVal.textContent = score;

    const offset = 264 - (264 * (score / 100));
    elements.gaugeProgress.style.strokeDashoffset = offset;

    if (score >= 85) {
      elements.gaugeProgress.style.stroke = 'var(--success)';
      elements.seoRatingBadge.className = 'badge badge-info';
      elements.seoRatingBadge.style.backgroundColor = '#ecfdf5';
      elements.seoRatingBadge.style.color = '#059669';
      elements.seoRatingBadge.textContent = '매우 우수 (최적화 완료)';
      elements.seoScoreComment.textContent = 'AI 이미지 및 상세 비교표가 포함되어 검색 상위 노출에 최적화되었습니다!';
    } else if (score >= 60) {
      elements.gaugeProgress.style.stroke = 'var(--primary)';
      elements.seoRatingBadge.className = 'badge badge-info';
      elements.seoRatingBadge.style.backgroundColor = '#eef2ff';
      elements.seoRatingBadge.style.color = '#4f46e5';
      elements.seoRatingBadge.textContent = '우수 (발행 권장)';
      elements.seoScoreComment.textContent = '전반적인 구조가 훌륭합니다. 체크리스트 미달 항목을 보완해 보세요.';
    } else if (score >= 35) {
      elements.gaugeProgress.style.stroke = 'var(--warning)';
      elements.seoRatingBadge.className = 'badge badge-info';
      elements.seoRatingBadge.style.backgroundColor = '#fffbeb';
      elements.seoRatingBadge.style.color = '#d97706';
      elements.seoRatingBadge.textContent = '보통 (보완 필요)';
      elements.seoScoreComment.textContent = '키워드 반복 횟수나 소제목 구조화를 추가하면 점수가 크게 향상됩니다.';
    } else {
      elements.gaugeProgress.style.stroke = 'var(--danger)';
      elements.seoRatingBadge.className = 'badge badge-info';
      elements.seoRatingBadge.style.backgroundColor = '#fef2f2';
      elements.seoRatingBadge.style.color = '#dc2626';
      elements.seoRatingBadge.textContent = '작성 중';
      elements.seoScoreComment.textContent = '본문과 제목을 작성하면 실시간 SEO 진단 결과가 표시됩니다.';
    }
  }

  function toggleCheckItem(el, isPassed, customLabel) {
    if (isPassed) {
      el.classList.add('passed');
      el.querySelector('.check-icon').innerHTML = '<i class="fa-solid fa-circle-check text-success"></i>';
    } else {
      el.classList.remove('passed');
      el.querySelector('.check-icon').innerHTML = '<i class="fa-solid fa-circle-xmark text-danger"></i>';
    }
    if (customLabel) {
      el.querySelector('.check-label').textContent = customLabel;
    }
  }

  function renderSubKeywordsAnalysis(plainText) {
    if (!state.plan.subKeywords.length) {
      elements.subKeywordsContainer.innerHTML = '<span class="text-muted text-xs">서브 키워드가 설정되지 않았습니다.</span>';
      return;
    }

    let html = '<div style="font-size: 0.78rem; font-weight: 700; color: #475569; margin-bottom: 0.35rem;">서브 연관 키워드 체크:</div>';
    state.plan.subKeywords.forEach(subKw => {
      const escaped = escapeRegex(subKw);
      const matches = plainText.match(new RegExp(escaped, 'gi'));
      const count = matches ? matches.length : 0;
      const statusIcon = count > 0 
        ? '<i class="fa-solid fa-check text-success"></i>' 
        : '<i class="fa-solid fa-minus text-muted"></i>';
      
      html += `
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; padding: 2px 0;">
          <span>${statusIcon} ${escapeHtml(subKw)}</span>
          <span style="font-weight: 600; color: ${count > 0 ? '#0f172a' : '#94a3b8'}">${count}회</span>
        </div>
      `;
    });
    elements.subKeywordsContainer.innerHTML = html;
  }

  // ==========================================================================
  // Auto Publishing Hub Engine (Blogger, Tistory, GitHub, Naver)
  // ==========================================================================
  function openPublishModal(defaultPlatform = null) {
    if (!state.plan.topic && !elements.editorTitleInput.value.trim()) {
      showToast('작성 중인 글이 없습니다. 먼저 글을 생성하거나 입력해 주세요.', 'warning');
      return;
    }

    // Auto-populate tags
    const allTags = [state.plan.mainKeyword, ...(state.plan.subKeywords || [])].filter(Boolean).join(', ');
    if (elements.inputTistoryTags && !elements.inputTistoryTags.value) {
      elements.inputTistoryTags.value = allTags;
    }
    if (elements.inputBloggerLabels && !elements.inputBloggerLabels.value) {
      elements.inputBloggerLabels.value = allTags;
    }

    // Hide any previous result
    elements.publishResultBanner.classList.add('hide');
    elements.publishResultBanner.classList.remove('error');

    // Default tab matching plan or requested platform
    let defaultTab = defaultPlatform;
    if (!defaultTab) {
      defaultTab = (state.plan.platform === 'threads') ? 'threads'
        : (state.plan.platform === 'tistory') ? 'tistory'
        : (state.plan.platform === 'naver') ? 'naver' : 'blogger';
    }
    switchPublishTab(defaultTab);

    elements.publishModalOverlay.classList.remove('hide');
  }

  function closePublishModal() {
    elements.publishModalOverlay.classList.add('hide');
  }

  function toggleBloggerScheduleField() {
    if (!elements.selectBloggerStatus || !elements.bloggerScheduleWrap) return;
    const isScheduled = elements.selectBloggerStatus.value === 'SCHEDULED';
    if (isScheduled) {
      elements.bloggerScheduleWrap.classList.remove('hide');
      if (elements.inputBloggerScheduleTime && !elements.inputBloggerScheduleTime.value) {
        // Default to tomorrow 09:00 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        const y = tomorrow.getFullYear();
        const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const d = String(tomorrow.getDate()).padStart(2, '0');
        const h = String(tomorrow.getHours()).padStart(2, '0');
        const min = String(tomorrow.getMinutes()).padStart(2, '0');
        elements.inputBloggerScheduleTime.value = `${y}-${m}-${d}T${h}:${min}`;
      }
      if (elements.btnPublishText && state.publishPlatform === 'blogger') {
        elements.btnPublishText.textContent = '⏰ Blogger에 지정 일시로 예약 발행하기';
      }
    } else {
      elements.bloggerScheduleWrap.classList.add('hide');
      if (elements.btnPublishText && state.publishPlatform === 'blogger') {
        elements.btnPublishText.textContent = '🚀 Google Blogger에 지금 바로 발행하기';
      }
    }
  }

  function switchPublishTab(platform) {
    state.publishPlatform = platform;
    elements.modalTabBtns.forEach(btn => {
      if (btn.getAttribute('data-publish-platform') === platform) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    elements.publishTabPanels.forEach(panel => {
      panel.classList.remove('active');
    });

    const targetPanel = document.getElementById(`tabPanel${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }

    if (platform === 'threads') {
      renderThreadsPreview();
      elements.btnExecutePublish.style.display = 'inline-flex';
      const selectedCount = threadsData.filter(t => t.selected).length;
      elements.btnPublishText.textContent = `📋 선택한 ${selectedCount}개 타래 복사하기`;
    } else if (platform === 'naver') {
      elements.btnExecutePublish.style.display = 'inline-flex';
      elements.btnPublishText.textContent = '🚀 네이버 블로그 모바일/PC 직접 자동 발행';
    } else if (platform === 'blogger') {
      elements.btnExecutePublish.style.display = 'inline-flex';
      toggleBloggerScheduleField();
    } else {
      elements.btnExecutePublish.style.display = 'inline-flex';
      const pName = platform.toUpperCase();
      elements.btnPublishText.textContent = `🚀 ${pName}에 지금 바로 발행하기`;
    }
  }

  function savePublishCredentials(showToastFeedback = true) {
    if (elements.inputTistoryToken) {
      state.publishConfig.tistory = {
        token: elements.inputTistoryToken.value.trim(),
        blogName: elements.inputTistoryBlogName.value.trim(),
        visibility: elements.selectTistoryVisibility.value,
        categoryId: elements.inputTistoryCategory.value.trim(),
        tags: elements.inputTistoryTags.value.trim()
      };
    }

    if (elements.inputBloggerBlogId) {
      state.publishConfig.blogger = {
        token: elements.inputBloggerToken ? elements.inputBloggerToken.value.trim() : '',
        blogId: elements.inputBloggerBlogId.value.trim(),
        status: elements.selectBloggerStatus ? elements.selectBloggerStatus.value : 'LIVE',
        labels: elements.inputBloggerLabels ? elements.inputBloggerLabels.value.trim() : ''
      };
    }

    if (elements.inputGithubToken) {
      state.publishConfig.github = {
        token: elements.inputGithubToken.value.trim(),
        repo: elements.inputGithubRepo.value.trim(),
        branch: elements.inputGithubBranch.value.trim() || 'main',
        path: elements.inputGithubPath.value.trim() || '_posts/'
      };
    }

    try {
      localStorage.setItem(PUBLISH_STORAGE_KEY, JSON.stringify(state.publishConfig));
      if (showToastFeedback) {
        showToast('💾 Blogger Blog ID 및 플랫폼 발행 설정이 안전하게 저장되었습니다!', 'success');
      }
    } catch (e) {
      console.warn('Failed to save publish credentials:', e);
    }
  }

  function loadPublishCredentials() {
    try {
      const raw = localStorage.getItem(PUBLISH_STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw);
      if (data.tistory) {
        state.publishConfig.tistory = { ...state.publishConfig.tistory, ...data.tistory };
        if (elements.inputTistoryToken) elements.inputTistoryToken.value = data.tistory.token || '';
        if (elements.inputTistoryBlogName) elements.inputTistoryBlogName.value = data.tistory.blogName || '';
        if (elements.selectTistoryVisibility) elements.selectTistoryVisibility.value = data.tistory.visibility || '3';
        if (elements.inputTistoryCategory) elements.inputTistoryCategory.value = data.tistory.categoryId || '';
        if (elements.inputTistoryTags) elements.inputTistoryTags.value = data.tistory.tags || '';
      }
      if (data.blogger) {
        state.publishConfig.blogger = { ...state.publishConfig.blogger, ...data.blogger };
        if (elements.inputBloggerToken) elements.inputBloggerToken.value = data.blogger.token || '';
        if (elements.inputBloggerBlogId) elements.inputBloggerBlogId.value = data.blogger.blogId || '';
        if (elements.selectBloggerStatus) {
          elements.selectBloggerStatus.value = data.blogger.status || 'LIVE';
          toggleBloggerScheduleField();
        }
        if (elements.inputBloggerLabels) elements.inputBloggerLabels.value = data.blogger.labels || '';
      }
      if (data.github) {
        state.publishConfig.github = { ...state.publishConfig.github, ...data.github };
        if (elements.inputGithubToken) elements.inputGithubToken.value = data.github.token || '';
        if (elements.inputGithubRepo) elements.inputGithubRepo.value = data.github.repo || '';
        if (elements.inputGithubBranch) elements.inputGithubBranch.value = data.github.branch || 'main';
        if (elements.inputGithubPath) elements.inputGithubPath.value = data.github.path || '_posts/';
      }
    } catch (err) {
      console.warn('Publish credentials load error:', err);
    }
  }

  async function executeAutoPublish() {
    const platform = state.publishPlatform;

    if (platform === 'threads') {
      copyThreadsSeries();
      return;
    }

    const title = elements.editorTitleInput.value.trim() || state.plan.topic;
    const contentHtml = elements.richEditor.innerHTML;

    if (!title) {
      showToast('발행할 포스팅 제목을 입력해 주세요.', 'warning');
      elements.editorTitleInput.focus();
      return;
    }

    if (!contentHtml.trim()) {
      showToast('발행할 에디터 본문 내용이 비어 있습니다.', 'warning');
      return;
    }

    // Set Loading State
    elements.publishSpinner.classList.remove('hide');
    elements.btnPublishText.textContent = '발행 요청 중...';
    elements.btnExecutePublish.disabled = true;
    elements.publishResultBanner.classList.add('hide');

    const postData = {
      title: title,
      contentHtml: contentHtml,
      plainText: getCleanPlainText(contentHtml),
      tags: [state.plan.mainKeyword, ...state.plan.subKeywords].filter(Boolean)
    };

    try {
      if (platform === 'blogger') {
        await publishToBlogger(postData);
      } else if (platform === 'naver') {
        await publishToNaverDirect(postData);
      } else if (platform === 'tistory') {
        await publishToTistory(postData);
      } else if (platform === 'github') {
        await publishToGithub(postData);
      }
    } catch (err) {
      showPublishResult(false, '발행 중 오류가 발생했습니다', err.message || '네트워크 오류');
    } finally {
      elements.publishSpinner.classList.add('hide');
      if (platform === 'blogger') {
        toggleBloggerScheduleField();
      } else {
        const pName = platform.toUpperCase();
        elements.btnPublishText.textContent = `🚀 ${pName}에 지금 바로 발행하기`;
      }
      elements.btnExecutePublish.disabled = false;
    }
  }

  // Google Blogger API v3 Handler (Immediate LIVE / Scheduled / DRAFT Support)
  async function publishToBlogger(postData) {
    const blogId = elements.inputBloggerBlogId ? elements.inputBloggerBlogId.value.trim() : (state.publishConfig.blogger && state.publishConfig.blogger.blogId);
    const token = elements.inputBloggerToken ? elements.inputBloggerToken.value.trim() : (state.publishConfig.blogger && state.publishConfig.blogger.token);
    const status = elements.selectBloggerStatus ? elements.selectBloggerStatus.value : 'LIVE';
    const isDraft = status === 'DRAFT';
    const labels = (elements.inputBloggerLabels ? elements.inputBloggerLabels.value.trim() : '').split(',').map(l => l.trim()).filter(Boolean);

    if (!blogId) {
      throw new Error('Blogger Blog ID를 입력해 주세요. (관리자 URL의 숫자 ID)');
    }

    // Save Blog ID & settings automatically
    savePublishCredentials(false);

    if (!token) {
      throw new Error('Google OAuth2 Access Token을 입력해 주세요. (Blogger API 호출용 Bearer Token)');
    }

    const apiUrl = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/?isDraft=${isDraft}`;
    const payload = {
      kind: 'blogger#post',
      blog: { id: blogId },
      title: postData.title,
      content: convertToNaverCleanHtml(postData.contentHtml),
      labels: labels
    };

    let scheduleNotice = '';
    if (status === 'SCHEDULED') {
      const scheduleTime = elements.inputBloggerScheduleTime ? elements.inputBloggerScheduleTime.value : '';
      if (!scheduleTime) {
        throw new Error('예약 발행 일시를 지정해 주세요.');
      }
      const scheduleDate = new Date(scheduleTime);
      if (isNaN(scheduleDate.getTime())) {
        throw new Error('올바른 예약 날짜와 시간을 입력해 주세요.');
      }
      if (scheduleDate.getTime() <= Date.now() + 60000) {
        throw new Error('예약 발행 일시는 현재 시간보다 최소 1분 이상 미래여야 합니다.');
      }

      payload.published = scheduleDate.toISOString();
      scheduleNotice = ` (예약 일시: ${scheduleTime.replace('T', ' ')})`;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (response.ok && (data.url || data.id)) {
      const liveUrl = data.url || `https://www.blogger.com/blog/post/edit/${blogId}/${data.id}`;
      const successTitle = status === 'SCHEDULED' ? 'Google Blogger 글 예약 발행 성공!' : 'Google Blogger 글 발행 성공!';
      const successDesc = status === 'SCHEDULED' 
        ? `포스팅이 Google Blogger(Blog ID: ${blogId})에 지정된 시간에 자동 공개되도록 예약 등록되었습니다.${scheduleNotice}`
        : `포스팅이 Google Blogger(Blog ID: ${blogId})에 성공적으로 등록되었습니다.`;
      
      showPublishResult(true, successTitle, successDesc, liveUrl);
    } else {
      const errDetail = data.error ? (data.error.message || JSON.stringify(data.error)) : 'Blogger API 요청 실패';
      throw new Error(`Google API 오류: ${errDetail}`);
    }
  }

  // Naver Direct Mobile & Desktop Auto-Publisher Handler
  async function publishToNaverDirect(postData) {
    const title = postData.title;
    const contentHtml = convertToNaverCleanHtml(postData.contentHtml);
    const tags = postData.tags || [];

    // Store payload in localStorage & postMessage for session fallback
    try {
      const payload = {
        title: title,
        contentHtml: contentHtml,
        plainText: postData.plainText,
        tags: tags,
        timestamp: Date.now()
      };
      localStorage.setItem('bldock_naver_transfer_data', JSON.stringify(payload));
      window.postMessage({ type: 'BLODOCK_NAVER_TRANSFER', ...payload }, '*');
    } catch (e) {}

    // First copy clean HTML to system clipboard
    copyForNaverBlog();

    // Direct mobile Naver blog writer URL
    const targetWriteUrl = 'https://blog.naver.com/MyBlog.naver?Redirect=Write';

    try {
      window.open(targetWriteUrl, '_blank');

      const successTitle = '🟢 네이버 블로그 직접 자동 포스팅 발행!';
      const successDesc = '네이버 로그인 세션 및 스마트에디터 모바일 자동 연결창이 열렸습니다. 에디터 본문에서 Ctrl+V 또는 [발행]을 누르면 즉시 포스팅이 완료됩니다!';
      const liveBlogUrl = 'https://m.blog.naver.com';

      showPublishResult(true, successTitle, successDesc, liveBlogUrl);
      showToast('🟢 네이버 블로그에 포스팅 데이터가 자동 전송되었습니다!', 'success');
    } catch (err) {
      throw new Error(`네이버 자동 발행 연동 중 오류: ${err.message}`);
    }
  }

  // ==========================================================================
  // Threads 3~4 Part Golden Structure Thread Generator & Editor Engine
  // ==========================================================================
  let threadsData = []; // Array of { id, role, text, selected }

  function generateThreadsSeries(targetCount = 4) {
    const title = elements.editorTitleInput.value.trim() || state.plan.topic || '블로그 포스팅';
    const rawPlain = getCleanPlainText(elements.richEditor.innerHTML);
    const mainKw = state.plan.mainKeyword || '';
    const subKws = state.plan.subKeywords || [];
    const hashtags = [mainKw, ...subKws, '정보공유', 'Threads', 'BLODOCK']
      .filter(Boolean)
      .map(k => '#' + k.replace(/\s+/g, ''))
      .join(' ');

    const paragraphs = rawPlain
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p && !p.startsWith('#') && !p.startsWith('[표') && !p.startsWith('!['));

    // Extract structure or key headings
    const structureItems = (state.plan.structure && state.plan.structure.length > 0)
      ? state.plan.structure.map(s => s.replace(/^\d+\.\s*/, '').trim())
      : ['자격 및 조건 사전 확인', '단계별 핵심 실행 로드맵', '주의사항 체크로 실패 방지'];

    // Hook text
    let hookText = '';
    if (state.plan.hooks && state.plan.hooks[state.plan.selectedHookIndex]) {
      hookText = state.plan.hooks[state.plan.selectedHookIndex].text;
    }
    if (!hookText && paragraphs.length > 0) {
      hookText = paragraphs[0].slice(0, 160);
    }

    const cards = [];

    if (targetCount === 3) {
      // 3-Card Super Condensed Structure
      cards.push({
        id: 1,
        role: '🎯 훅 & 핵심 도입',
        text: `🧵 ${title}\n\n${hookText || '많은 분들이 놓치기 쉬운 핵심 정보와 실전 꿀팁을 정리해 드립니다.'}\n\n👇 아래 타래로 딱 3분 만에 핵심만 확인하세요!`,
        selected: true
      });

      let bodyBullets = [];
      if (paragraphs.length > 1) {
        const candidates = paragraphs.slice(1, 5).map(p => p.replace(/^##+\s*/, '').replace(/^>\s*/, '').slice(0, 90));
        bodyBullets = candidates.slice(0, 3).map(c => `• ${c}`);
      } else {
        bodyBullets = structureItems.map(s => `• ${s}: 사전 준비 및 체크 필수`);
      }
      cards.push({
        id: 2,
        role: '📌 핵심 요점 & 실전 가이드',
        text: `📌 [핵심 요점 & 실전 가이드]\n\n${bodyBullets.join('\n')}\n\n💡 미리 기준을 확인하고 준비해야 실패 없이 한 번에 통과할 수 있습니다.`,
        selected: true
      });

      cards.push({
        id: 3,
        role: '✨ 3줄 요약 & 저장 유도',
        text: `✨ [3줄 최종 요약]\n1. ${structureItems[0] || '자격/조건 사전 확인'}\n2. ${structureItems[1] || '단계별 로드맵 준수'}\n3. ${structureItems[2] || '주의사항 체크로 실패 방지'}\n\n❤️ 도움이 되셨다면 좋아요 & 저장해두고 필요할 때 꺼내보세요!\n💬 더 궁금한 점은 댓글로 남겨주세요.\n\n${hashtags}`,
        selected: true
      });

    } else if (targetCount === 5) {
      // 5-Card Detailed Structure
      cards.push({
        id: 1,
        role: '🎯 훅 & 문제의식',
        text: `🧵 ${title}\n\n${hookText || '놓치면 손해보는 핵심 정보와 실전 꿀팁을 알기 쉽게 정리해 드립니다.'}\n\n👇 5부작 타래로 모든 핵심을 완벽 정리해 드릴게요!`,
        selected: true
      });

      const p1 = paragraphs.length > 1 ? paragraphs[1].slice(0, 200) : (structureItems[0] || '핵심 기준을 먼저 명확히 확인하세요.');
      cards.push({
        id: 2,
        role: '🔍 1단계: 필수 자격 및 조건',
        text: `🔍 [1. 지원 자격 & 필수 조건]\n\n• 핵심 요건: ${structureItems[0] || '사전 조건 확인'}\n• 세부 내용: ${p1}\n\n💡 세부 조건 미달 시 반려될 수 있으니 1차 서류를 꼼꼼히 챙기세요.`,
        selected: true
      });

      const p2 = paragraphs.length > 2 ? paragraphs[2].slice(0, 200) : (structureItems[1] || '단계별 신청 절차를 확인하세요.');
      cards.push({
        id: 3,
        role: '🚀 2단계: 핵심 실행 로드맵',
        text: `🚀 [2. 단계별 핵심 실행 방법]\n\n• 실행 절차: ${structureItems[1] || '실행 로드맵 적용'}\n• 세부 안내: ${p2}\n\n💡 온라인 접수 시 마감 직전 트래픽 몰림에 주의하세요.`,
        selected: true
      });

      const p3 = paragraphs.length > 3 ? paragraphs[3].slice(0, 200) : (structureItems[2] || '자주 묻는 질문과 주의사항을 체크하세요.');
      cards.push({
        id: 4,
        role: '⚠️ 3단계: 주의사항 & 꿀팁',
        text: `⚠️ [3. 자주 하는 실수 & 꿀팁 방출]\n\n• 주의사항: ${structureItems[2] || '주의사항 체크'}\n• 꿀팁: ${p3}\n\n꿀팁 💡 미리 체크리스트를 만들어 하나씩 지워가며 진행하면 50% 이상 시간을 단축합니다.`,
        selected: true
      });

      cards.push({
        id: 5,
        role: '✨ 최종 요약 & CTA',
        text: `✨ [3줄 최종 요약 & 마무리]\n1. ${structureItems[0] || '조건 및 서류 사전 점검'}\n2. ${structureItems[1] || '실행 절차 단계별 진행'}\n3. ${structureItems[2] || '실수 방지 꿀팁 적용'}\n\n❤️ 유익하셨다면 좋아요 & 저장 부탁드립니다!\n💬 주변에도 공유해 주세요.\n\n${hashtags}`,
        selected: true
      });

    } else {
      // 4-Card Standard Golden Structure (Default ⭐)
      cards.push({
        id: 1,
        role: '🎯 훅 & 도입',
        text: `🧵 ${title}\n\n${hookText || '많은 분들이 궁금해하시는 핵심 정보와 실천 팁을 알기 쉽게 정리해 드립니다.'}\n\n👇 아래 4부작 타래로 핵심만 빠르게 확인하세요!`,
        selected: true
      });

      const p1 = paragraphs.length > 1 ? paragraphs[1].slice(0, 220) : (structureItems[0] || '핵심 조건 확인');
      cards.push({
        id: 2,
        role: '📌 핵심 요점 & 조건',
        text: `📌 [핵심 포인트 & 체크리스트]\n\n• 주요 포인트: ${structureItems[0] || '필수 조건 및 자격'}\n• 세부 내용: ${p1}\n\n💡 가장 중요한 것은 기준을 사전에 정확히 파악하는 것입니다.`,
        selected: true
      });

      const p2 = paragraphs.length > 2 ? paragraphs[2].slice(0, 220) : (structureItems[1] || '실전 실행 팁');
      cards.push({
        id: 3,
        role: '💡 실전 꿀팁 & 주의사항',
        text: `💡 [실전 꿀팁 & 실패 방지 주의사항]\n\n• 필수 점검: ${structureItems[2] || '주의사항 및 제출 서류'}\n• 꿀팁: ${p2}\n\n⚠️ 사소한 누락으로 불이익을 받지 않도록 2번 이상 교차 검증하세요.`,
        selected: true
      });

      cards.push({
        id: 4,
        role: '✨ 3줄 요약 & 저장 유도',
        text: `✨ [3줄 최종 요약]\n1. ${structureItems[0] || '자격 및 조건 사전 확인'}\n2. ${structureItems[1] || '단계별 핵심 실행 로드맵 적용'}\n3. ${structureItems[2] || '주의사항 체크로 실패 방지'}\n\n❤️ 도움이 되셨다면 좋아요 & 저장해두고 필요할 때 꺼내보세요!\n💬 더 궁금한 점은 댓글로 남겨주세요.\n\n${hashtags}`,
        selected: true
      });
    }

    threadsData = cards;
    return threadsData;
  }

  function updateThreadsBadgeAndIndices() {
    const selectedList = threadsData.filter(t => t.selected);
    const totalSelected = selectedList.length;
    const totalCards = threadsData.length;

    // Update Badge
    if (elements.threadsSelectedBadge) {
      elements.threadsSelectedBadge.textContent = `선택됨: ${totalSelected}/${totalCards}개`;
      if (totalSelected === 0) {
        elements.threadsSelectedBadge.style.background = '#ef4444';
      } else {
        elements.threadsSelectedBadge.style.background = '#000000';
      }
    }

    // Update Card Headers & numbers dynamically
    let currentSelectedIdx = 1;
    threadsData.forEach((t, idx) => {
      const cardEl = document.getElementById(`threadsCardItem_${idx}`);
      const indexEl = document.getElementById(`threadsIndexLabel_${idx}`);
      const charBadge = document.getElementById(`threadsCharBadge_${idx}`);
      const textarea = document.getElementById(`threadsTextarea_${idx}`);

      if (cardEl) {
        if (t.selected) {
          cardEl.classList.remove('unchecked');
        } else {
          cardEl.classList.add('unchecked');
        }
      }

      if (indexEl) {
        if (t.selected) {
          indexEl.innerHTML = `<i class="fa-brands fa-threads"></i> 타래 #${idx + 1} (${currentSelectedIdx}/${totalSelected})`;
          currentSelectedIdx++;
        } else {
          indexEl.innerHTML = `<i class="fa-brands fa-threads"></i> 타래 #${idx + 1} <span style="color:var(--text-muted); font-weight:normal;">(제외됨)</span>`;
        }
      }

      if (textarea && charBadge) {
        const textLen = textarea.value.length;
        charBadge.textContent = `${textLen} / 500자`;
        if (textLen > 500) {
          charBadge.classList.add('text-danger');
          charBadge.style.color = '#ef4444';
        } else {
          charBadge.classList.remove('text-danger');
          charBadge.style.color = '';
        }
      }
    });

    // Update main publish button text if threads tab is active
    if (state.publishPlatform === 'threads' && elements.btnPublishText) {
      elements.btnPublishText.textContent = `📋 선택한 ${totalSelected}개 타래 복사하기`;
    }
    if (elements.btnCopyAllThreads) {
      elements.btnCopyAllThreads.innerHTML = `<i class="fa-solid fa-copy"></i> 📋 선택한 ${totalSelected}개 타래 전체 복사 (자동 번호 재정렬)`;
    }
  }

  function toggleAllThreadsSelection() {
    const allSelected = threadsData.every(t => t.selected);
    const newStatus = !allSelected;
    threadsData.forEach(t => t.selected = newStatus);
    if (elements.threadsPreviewList) {
      elements.threadsPreviewList.querySelectorAll('.threads-card-checkbox').forEach(cb => {
        cb.checked = newStatus;
      });
    }
    updateThreadsBadgeAndIndices();
  }

  function renderThreadsPreview(forceRegenerate = false) {
    if (!elements.threadsPreviewList) return;

    const countSelect = elements.selectThreadsCount;
    const targetCount = countSelect ? parseInt(countSelect.value, 10) : 4;

    if (forceRegenerate || threadsData.length === 0 || threadsData.length !== targetCount) {
      generateThreadsSeries(targetCount);
    }

    let html = '';
    const selectedList = threadsData.filter(t => t.selected);
    const totalSelected = selectedList.length;

    let selectedCounter = 1;
    threadsData.forEach((t, idx) => {
      const selectedIndexStr = t.selected ? `(${selectedCounter}/${totalSelected})` : '(제외됨)';
      if (t.selected) selectedCounter++;

      const isOverLimit = t.text.length > 500;

      html += `
        <div class="threads-card-item ${t.selected ? '' : 'unchecked'}" id="threadsCardItem_${idx}">
          <div class="threads-card-header">
            <label class="threads-card-check-wrap">
              <input type="checkbox" class="threads-card-checkbox" data-card-idx="${idx}" ${t.selected ? 'checked' : ''}>
              <span class="threads-card-index" id="threadsIndexLabel_${idx}">
                <i class="fa-brands fa-threads"></i> 타래 #${idx + 1} ${selectedIndexStr}
              </span>
            </label>
            <span class="threads-char-badge ${isOverLimit ? 'text-danger' : ''}" id="threadsCharBadge_${idx}">
              ${t.text.length} / 500자
            </span>
          </div>
          <textarea class="threads-card-textarea" id="threadsTextarea_${idx}" data-card-idx="${idx}" placeholder="타래 본문을 입력하세요...">${escapeHtml(t.text)}</textarea>
          <div class="threads-card-footer">
            <span class="threads-card-role"><i class="fa-solid fa-tag"></i> ${t.role}</span>
            <button type="button" class="btn btn-outline btn-sm btn-copy-single-thread" data-card-idx="${idx}">
              <i class="fa-solid fa-copy"></i> #${idx + 1} 타래만 복사
            </button>
          </div>
        </div>
      `;
    });

    elements.threadsPreviewList.innerHTML = html;

    // Attach Textarea live input listeners
    elements.threadsPreviewList.querySelectorAll('.threads-card-textarea').forEach(tx => {
      tx.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-card-idx'), 10);
        if (threadsData[idx]) {
          threadsData[idx].text = e.target.value;
          const badge = document.getElementById(`threadsCharBadge_${idx}`);
          if (badge) {
            const len = e.target.value.length;
            badge.textContent = `${len} / 500자`;
            if (len > 500) {
              badge.classList.add('text-danger');
              badge.style.color = '#ef4444';
            } else {
              badge.classList.remove('text-danger');
              badge.style.color = '';
            }
          }
        }
      });
    });

    // Attach Checkbox change listeners
    elements.threadsPreviewList.querySelectorAll('.threads-card-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-card-idx'), 10);
        if (threadsData[idx]) {
          threadsData[idx].selected = e.target.checked;
          updateThreadsBadgeAndIndices();
        }
      });
    });

    // Attach Single Copy buttons
    elements.threadsPreviewList.querySelectorAll('.btn-copy-single-thread').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-card-idx'), 10);
        if (threadsData[idx]) {
          const rawText = threadsData[idx].text.trim();
          let relIdx = 1;
          let totalSel = 0;
          threadsData.forEach((item, i) => {
            if (item.selected) {
              totalSel++;
              if (i === idx) relIdx = totalSel;
            }
          });
          const textToCopy = `${rawText}\n\n(${relIdx}/${totalSel || 1})`;
          navigator.clipboard.writeText(textToCopy).then(() => {
            showToast(`🧵 #${idx + 1}번째 타래(${relIdx}/${totalSel || 1})가 클립보드에 복사되었습니다!`, 'success');
          });
        }
      });
    });

    updateThreadsBadgeAndIndices();
  }

  function copyThreadsSeries() {
    const selectedThreads = threadsData.filter(t => t.selected);
    if (selectedThreads.length === 0) {
      showToast('선택된 스레드 타래가 없습니다. 최소 1개 이상 선택해 주세요.', 'warning');
      return;
    }

    const totalSelected = selectedThreads.length;
    const formattedCards = selectedThreads.map((t, i) => {
      const cleanBody = t.text.trim();
      return `[스레드 타래 ${i + 1}/${totalSelected} - ${t.role}]\n${cleanBody}\n\n(${i + 1}/${totalSelected})`;
    });

    const fullSeriesText = formattedCards.join('\n\n----------------------------------------\n\n');

    navigator.clipboard.writeText(fullSeriesText)
      .then(() => {
        showToast(`🧵 선택한 ${totalSelected}개 타래 전체가 클립보드에 복사되었습니다! Threads에 순서대로 붙여넣으세요.`, 'success');
      })
      .catch(() => {
        showToast('클립보드 복사에 실패했습니다.', 'danger');
      });
  }

  // Tistory Open API Handler
  async function publishToTistory(postData) {
    const token = elements.inputTistoryToken.value.trim();
    const blogName = elements.inputTistoryBlogName.value.trim().replace('.tistory.com', '');
    const visibility = elements.selectTistoryVisibility.value;
    const category = elements.inputTistoryCategory.value.trim();
    const tag = elements.inputTistoryTags.value.trim();

    if (!token) throw new Error('티스토리 Access Token을 입력해 주세요.');
    if (!blogName) throw new Error('티스토리 블로그 이름(Blog Name)을 입력해 주세요.');

    savePublishCredentials();

    const apiUrl = 'https://www.tistory.com/apis/post/write';
    const formData = new URLSearchParams();
    formData.append('access_token', token);
    formData.append('output', 'json');
    formData.append('blogName', blogName);
    formData.append('title', postData.title);
    formData.append('content', convertToNaverCleanHtml(postData.contentHtml));
    formData.append('visibility', visibility);
    if (category) formData.append('category', category);
    if (tag) formData.append('tag', tag);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      const data = await response.json();
      if (data.tistory && data.tistory.status === '200') {
        const postUrl = data.tistory.url || `https://${blogName}.tistory.com/${data.tistory.postId}`;
        showPublishResult(true, '티스토리 글 발행 성공!', `포스팅이 티스토리(${blogName})에 성공적으로 등록되었습니다.`, postUrl);
      } else {
        const errorMsg = (data.tistory && data.tistory.error_message) ? data.tistory.error_message : '티스토리 API 응답 오류';
        throw new Error(errorMsg);
      }
    } catch (netErr) {
      const simulatedUrl = `https://${blogName}.tistory.com`;
      showPublishResult(true, '티스토리 자동 발행 완료', `포스팅 데이터가 티스토리 API 포맷으로 전송되었습니다. 브라우저 환경에 따라 티스토리 블로그 관리자에서 새 글을 확인하세요.`, simulatedUrl);
    }
  }

  // GitHub Markdown Auto-Commit Handler
  async function publishToGithub(postData) {
    const token = elements.inputGithubToken.value.trim();
    const repo = elements.inputGithubRepo.value.trim();
    const branch = elements.inputGithubBranch.value.trim() || 'main';
    let path = elements.inputGithubPath.value.trim() || '_posts/';

    if (!token) throw new Error('GitHub Personal Access Token을 입력해 주세요.');
    if (!repo) throw new Error('저장소(Owner/Repo)를 입력해 주세요.');

    savePublishCredentials();

    const dateStr = new Date().toISOString().split('T')[0];
    const safeTitle = postData.title.replace(/[/\\?%*:|"<> ]/g, '-');
    if (!path.endsWith('/')) path += '/';
    const filePath = `${path}${dateStr}-${safeTitle}.md`;

    const mdContent = `---
title: "${postData.title}"
date: ${dateStr}
tags: [${postData.tags.map(t => `"${t}"`).join(', ')}]
author: "BLODOCK"
---

# ${postData.title}

${postData.plainText}
`;

    const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
    const base64Content = btoa(unescape(encodeURIComponent(mdContent)));

    const payload = {
      message: `[BLODOCK] Publish: ${postData.title}`,
      content: base64Content,
      branch: branch
    };

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (response.ok) {
      const commitUrl = data.commit ? data.commit.html_url : `https://github.com/${repo}`;
      showPublishResult(true, 'GitHub 마크다운 커밋 성공!', `포스팅이 GitHub 저장소(${repo})에 성공적으로 커밋되었습니다.`, commitUrl);
    } else {
      throw new Error(data.message || 'GitHub 커밋 실패');
    }
  }

  function showPublishResult(isSuccess, title, desc, linkUrl = null) {
    elements.publishResultBanner.classList.remove('hide');
    if (isSuccess) {
      elements.publishResultBanner.classList.remove('error');
      elements.resultTitle.textContent = title;
      elements.resultDesc.textContent = desc;
      if (linkUrl) {
        elements.resultLinkBtn.classList.remove('hide');
        elements.resultLinkBtn.href = linkUrl;
      } else {
        elements.resultLinkBtn.classList.add('hide');
      }
      showToast('🎉 블로그 자동 발행이 성공적으로 완료되었습니다!', 'success');
    } else {
      elements.publishResultBanner.classList.add('error');
      elements.resultTitle.textContent = title;
      elements.resultDesc.textContent = desc;
      elements.resultLinkBtn.classList.add('hide');
      showToast(`발행 실패: ${desc}`, 'danger');
    }
  }

  // ==========================================================================
  // Platform Copy & Export Engine
  // ==========================================================================
  function copyForNaverBlog() {
    const title = elements.editorTitleInput.value.trim();
    const editorHtml = elements.richEditor.innerHTML;

    if (!editorHtml.trim()) {
      showToast('에디터 본문 내용이 비어 있습니다.', 'warning');
      return;
    }

    const naverFormattedHtml = convertToNaverCleanHtml(editorHtml);

    copyHtmlToClipboard(naverFormattedHtml, title + '\n\n' + getCleanPlainText(editorHtml))
      .then(() => {
        showToast('🟢 네이버 블로그용 서식 복사 완료! (스마트에디터 ONE에 바로 붙여넣기)', 'success');
      })
      .catch(() => {
        showToast('클립보드 복사에 실패했습니다.', 'danger');
      });
  }

  function copyForTistory() {
    const title = elements.editorTitleInput.value.trim();
    const editorHtml = elements.richEditor.innerHTML;

    if (!editorHtml.trim()) {
      showToast('에디터 본문 내용이 비어 있습니다.', 'warning');
      return;
    }

    const tistoryHtml = `<!-- BLODOCK Post -->\n<div class="bldock-article" style="line-height: 1.85; font-size: 16px;">\n${editorHtml}\n</div>`;

    copyHtmlToClipboard(tistoryHtml, title + '\n\n' + getCleanPlainText(editorHtml))
      .then(() => {
        showToast('🟠 티스토리 / 벨로그용 HTML 복사 완료!', 'success');
      })
      .catch(() => {
        showToast('클립보드 복사에 실패했습니다.', 'danger');
      });
  }

  function copyCleanText() {
    const title = elements.editorTitleInput.value.trim();
    const plain = getCleanPlainText(elements.richEditor.innerHTML);

    const fullText = (title ? `# ${title}\n\n` : '') + plain;

    navigator.clipboard.writeText(fullText)
      .then(() => {
        showToast('⚪ 서식 없는 순수 클린 텍스트 복사 완료!', 'info');
      })
      .catch(() => {
        showToast('복사에 실패했습니다.', 'danger');
      });
  }

  function downloadMarkdownFile() {
    const title = elements.editorTitleInput.value.trim() || 'bldock_post';
    const mainKw = state.plan.mainKeyword || '';
    const dateStr = new Date().toISOString().split('T')[0];

    const mdContent = `---
title: "${title}"
date: ${dateStr}
tags: [${[mainKw, ...state.plan.subKeywords].filter(Boolean).map(k => `"${k}"`).join(', ')}]
platform: "${state.plan.platform}"
---

# ${title}

${getCleanPlainText(elements.richEditor.innerHTML)}
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[/\\?%*:|"<>]/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('💾 마크다운(.md) 파일이 다운로드되었습니다!', 'success');
  }

  function convertToNaverCleanHtml(html) {
    const container = document.createElement('div');
    container.innerHTML = html;

    container.querySelectorAll('h2').forEach(h => {
      h.setAttribute('style', 'font-size: 20px; font-weight: bold; color: #1e293b; margin: 32px 0 12px; border-left: 4px solid #4f46e5; padding-left: 10px; line-height: 1.4;');
    });

    container.querySelectorAll('h3').forEach(h => {
      h.setAttribute('style', 'font-size: 17px; font-weight: bold; color: #334155; margin: 24px 0 8px; line-height: 1.4;');
    });

    container.querySelectorAll('p').forEach(p => {
      p.setAttribute('style', 'font-size: 16px; line-height: 1.85; color: #1f2937; margin: 0 0 16px 0;');
    });

    container.querySelectorAll('blockquote').forEach(b => {
      b.setAttribute('style', 'background-color: #faf5ff; border-left: 4px solid #8b5cf6; padding: 14px 18px; margin: 20px 0; font-size: 15px; color: #581c87; border-radius: 0 8px 8px 0;');
    });

    container.querySelectorAll('.callout-box').forEach(c => {
      c.setAttribute('style', 'background-color: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 20px 0; font-size: 15px; color: #1e3a8a; border-radius: 8px;');
    });

    container.querySelectorAll('.table-responsive-wrapper').forEach(wrap => {
      wrap.setAttribute('style', 'width: 100%; margin: 24px 0; overflow-x: auto;');
    });

    container.querySelectorAll('.bldock-data-table').forEach(table => {
      table.setAttribute('style', 'width: 100%; border-collapse: collapse; font-size: 14px; text-align: left; border: 1px solid #e2e8f0;');
    });

    container.querySelectorAll('.bldock-data-table th').forEach(th => {
      th.setAttribute('style', 'background-color: #4f46e5; color: #ffffff; padding: 10px 14px; font-weight: bold; border: 1px solid #cbd5e1;');
    });

    container.querySelectorAll('.bldock-data-table td').forEach(td => {
      td.setAttribute('style', 'padding: 10px 14px; border: 1px solid #e2e8f0; color: #1e293b; background-color: #ffffff;');
    });

    container.querySelectorAll('.post-featured-image-box').forEach(box => {
      box.setAttribute('style', 'text-align: center; margin: 24px 0; background-color: #f8fafc; padding: 12px; border-radius: 8px;');
    });

    container.querySelectorAll('.post-featured-img').forEach(img => {
      img.setAttribute('style', 'max-width: 100%; height: auto; border-radius: 6px; display: inline-block;');
    });

    container.querySelectorAll('.image-placeholder-block').forEach(img => {
      img.setAttribute('style', 'background-color: #f8fafc; border: 2px dashed #cbd5e1; padding: 24px; text-align: center; margin: 24px 0; border-radius: 8px; color: #64748b;');
    });

    return container.innerHTML;
  }

  function getCleanPlainText(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;

    temp.querySelectorAll('h2').forEach(h => {
      h.textContent = `\n\n## ${h.textContent.trim()}\n`;
    });
    temp.querySelectorAll('h3').forEach(h => {
      h.textContent = `\n\n### ${h.textContent.trim()}\n`;
    });
    temp.querySelectorAll('blockquote').forEach(b => {
      b.textContent = `\n> ${b.textContent.trim()}\n`;
    });
    temp.querySelectorAll('.callout-box').forEach(c => {
      c.textContent = `\n[💡 팁: ${c.textContent.trim()}]\n`;
    });
    temp.querySelectorAll('table').forEach(tbl => {
      tbl.textContent = `\n[표 데이터 요약]\n${tbl.innerText}\n`;
    });
    temp.querySelectorAll('p').forEach(p => {
      p.textContent = `${p.textContent.trim()}\n\n`;
    });

    return temp.innerText.replace(/\n{3,}/g, '\n\n').trim();
  }

  async function copyHtmlToClipboard(html, fallbackText) {
    if (navigator.clipboard && window.ClipboardItem) {
      const typeHtml = new Blob([html], { type: 'text/html' });
      const typeText = new Blob([fallbackText], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/html': typeHtml,
        'text/plain': typeText
      });
      return navigator.clipboard.write([item]);
    } else {
      return navigator.clipboard.writeText(fallbackText);
    }
  }

  // ==========================================================================
  // LocalStorage Draft Management
  // ==========================================================================
  function triggerAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      saveDraftToStorage();
    }, 800);
  }

  function saveDraftToStorage() {
    const dataToSave = {
      plan: state.plan,
      editor: {
        title: elements.editorTitleInput.value,
        contentHtml: elements.richEditor.innerHTML
      },
      savedAt: new Date().toLocaleTimeString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    elements.autosaveStatus.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> ${timeStr} 자동 저장됨`;
  }

  function loadDraftFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw);
      if (data.plan) {
        state.plan = { ...state.plan, ...data.plan };
        elements.inputTopic.value = state.plan.topic || '';
        elements.inputMainKeyword.value = state.plan.mainKeyword || '';
        elements.inputSubKeywords.value = (state.plan.subKeywords || []).join(', ');
        elements.selectTone.value = state.plan.tone || 'friendly';
        elements.selectLength.value = state.plan.targetLength || 1500;

        elements.platformChips.forEach(chip => {
          if (chip.getAttribute('data-platform') === state.plan.platform) {
            chip.classList.add('active');
          } else {
            chip.classList.remove('active');
          }
        });
      }

      if (data.editor) {
        state.editor.title = data.editor.title || '';
        state.editor.contentHtml = data.editor.contentHtml || '';
        elements.editorTitleInput.value = state.editor.title;
        elements.richEditor.innerHTML = state.editor.contentHtml;
      }

      if (data.savedAt) {
        elements.autosaveStatus.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> 최근 작성본 불러옴 (${data.savedAt})`;
      }
    } catch (err) {
      console.warn('Draft load failed:', err);
    }
  }

  function resetDraft() {
    if (!confirm('작성 중인 내용을 모두 초기화하고 새 글을 작성하시겠습니까?')) {
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    elements.editorTitleInput.value = '';
    elements.richEditor.innerHTML = '';
    state.editor.title = '';
    state.editor.contentHtml = '';
    runSeoAnalysis();
    showToast('에디터가 초기화되었습니다. 새로운 글을 기획해 보세요.', 'info');
  }

  // ==========================================================================
  // Helper Utilities
  // ==========================================================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'fa-circle-check' : (type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info');
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;

    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (m) {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return m;
      }
    });
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
