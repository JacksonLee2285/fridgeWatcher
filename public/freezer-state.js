const lastModified = document.querySelector('#last-modified');
const stateDocument = document.querySelector('#state-document');

async function loadFreezerState() {
  try {
    const response = await fetch('/api/freezer/state');
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '상태 파일을 읽을 수 없습니다.');
    }

    const modifiedAt = new Date(result.lastModified);
    lastModified.textContent = `마지막 수정: ${modifiedAt.toLocaleString('ko-KR')}`;
    stateDocument.textContent = result.content;
  } catch (error) {
    lastModified.textContent = '';
    stateDocument.textContent = error.message;
    stateDocument.classList.add('state-error');
  }
}

loadFreezerState();
