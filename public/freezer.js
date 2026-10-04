const form = document.querySelector('#chat-form');
const input = document.querySelector('#message-input');
const conversation = document.querySelector('#conversation');
const emptyState = document.querySelector('#empty-state');
const sendButton = document.querySelector('#send-button');

async function requestFreezerResponse(message) {
  const response = await fetch('/api/freezer/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || '처리하지 못했어요. 다시 말해주세요.');
  }

  return result.answer;
}

function addMessage(text, sender) {
  const message = document.createElement('div');
  message.className = `message message-${sender}`;
  message.textContent = text;
  conversation.appendChild(message);
  conversation.scrollTop = conversation.scrollHeight;
}

async function submitMessage(text) {
  if (emptyState) {
    emptyState.remove();
  }

  addMessage(text, 'user');
  input.disabled = true;
  sendButton.disabled = true;

  try {
    const response = await requestFreezerResponse(text);
    addMessage(response, 'freezer');
  } catch (error) {
    addMessage(error.message, 'freezer');
  } finally {
    input.disabled = false;
    sendButton.disabled = false;
    input.focus();
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const message = input.value.trim();

  if (!message) {
    return;
  }

  input.value = '';
  submitMessage(message);
});

input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    form.requestSubmit();
  }
});
