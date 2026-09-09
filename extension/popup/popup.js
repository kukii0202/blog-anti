document.addEventListener('DOMContentLoaded', () => {
  const txtPayloadTitle = document.getElementById('txtPayloadTitle');
  const btnOpenNaver = document.getElementById('btnOpenNaver');
  const btnOpenThreads = document.getElementById('btnOpenThreads');
  const btnOpenBlogger = document.getElementById('btnOpenBlogger');
  const btnOpenTistory = document.getElementById('btnOpenTistory');

  // Load payload status
  chrome.storage.local.get(['blodock_transfer_payload'], (result) => {
    const payload = result.blodock_transfer_payload;
    if (payload && payload.title) {
      txtPayloadTitle.textContent = `📝 ${payload.title}`;
      txtPayloadTitle.style.color = '#38bdf8';
    } else {
      txtPayloadTitle.textContent = 'BLODOCK 웹사이트에서 [발행하기]를 누르세요.';
    }
  });

  btnOpenNaver.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://blog.naver.com/MyBlog.naver?Redirect=Write' });
  });

  btnOpenThreads.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.threads.net/' });
  });

  btnOpenBlogger.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://draft.blogger.com/' });
  });

  btnOpenTistory.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.tistory.com/member/blog' });
  });
});
