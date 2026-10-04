const express = require('express');
const path = require('path');
const { LocalFileFreezerStore } = require('./server/freezer-store');
const { OllamaClient } = require('./server/ollama-client');
const { FreezerService } = require('./server/freezer-service');

const app = express();
const port = 3000;
const store = new LocalFileFreezerStore(path.join(__dirname, 'data/freezer.md'));
const ollama = new OllamaClient({
  url: process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
  model: process.env.OLLAMA_MODEL || 'qwen3.5:2b-q4_K_M'
});
const freezer = new FreezerService({ store, ollama });

app.use(express.json({ limit: '16kb' }));

app.get('/freezer', (req, res) => {
  res.sendFile(`${__dirname}/public/freezer.html`);
});

app.get('/freezer/state', (req, res) => {
  res.sendFile(`${__dirname}/public/freezer-state.html`);
});

app.get('/api/freezer/state', async (req, res) => {
  try {
    const state = await store.readWithMetadata();
    res.json(state);
  } catch (error) {
    console.error('Failed to read freezer state:', error.message);
    res.status(500).json({ error: '상태 파일을 읽을 수 없습니다.' });
  }
});

app.post('/api/freezer/chat', async (req, res) => {
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';

  if (!message) {
    res.status(400).json({ error: '메시지를 입력해주세요.' });
    return;
  }

  try {
    const answer = await freezer.chat(message);
    res.json({ answer });
  } catch (error) {
    console.error('Freezer chat failed:', error.message);

    if (error.code === 'OLLAMA_UNAVAILABLE') {
      res.status(503).json({ error: '로컬 AI에 연결할 수 없습니다.' });
      return;
    }

    res.status(500).json({ error: '처리하지 못했어요. 다시 말해주세요.' });
  }
});

app.use(express.static('public'));

store.ensureExists()
  .then(() => {
    app.listen(port, () => {
      console.log(`fridgeWatcher is running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize freezer state:', error.message);
    process.exit(1);
  });
