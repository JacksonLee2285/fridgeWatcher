const http = require('http');
const https = require('https');

class OllamaClient {
  constructor(options) {
    this.url = new URL(options.url);
    this.model = options.model;
  }

  chat(state, message) {
    const instructions = [
      'You are 냉동고 문지기, a Korean-language freezer inventory assistant.',
      'The Markdown document below is the complete and only source of truth.',
      'Classify the request as query or modify.',
      'For query: answer from the document only and return document as an empty string.',
      'For modify: apply only the requested change and return the complete replacement Markdown document.',
      'Preserve all unrelated inventory exactly. Never invent quantities or items.',
      'Match Korean and English food names by meaning. In particular, 소고기 or 쇠고기 refers to beef, including Minced beef.',
      'If a general food name matches one existing item, use that item and its exact quantity.',
      'For purchases or additions, add the requested quantity to the current quantity.',
      'For eating or removal, subtract the requested quantity from the current quantity, but never below zero.',
      'The replacement document must start with "# Freezer Inventory" and be complete, never a fragment.',
      'The answer must always be a non-empty, natural Korean sentence.',
      'If the document says Empty, answer that the freezer is empty.',
      'Respond in Korean. Output only JSON matching the provided schema.',
      'Query example: {"action":"query","answer":"현재 냉동고는 비어 있어요.","document":""}',
      'Modify example: {"action":"modify","answer":"소고기 2팩 추가했어요.","document":"# Freezer Inventory\\n\\n## Meat\\n- Minced beef: 2 packs"}',
      'Quantity query example for a document containing Minced beef: 2 packs: {"action":"query","answer":"소고기 2팩이 있어요.","document":""}',
      'Consumption example when Minced beef is 2 packs and one pack was eaten: {"action":"modify","answer":"소고기 1팩 사용했어요.","document":"# Freezer Inventory\\n\\n## Meat\\n- Minced beef: 1 pack"}'
    ].join('\n');
    const request = [
      'CURRENT DOCUMENT:',
      state,
      '',
      'USER REQUEST:',
      message
    ].join('\n');

    return this.request('/api/chat', {
      model: this.model,
      stream: false,
      think: false,
      format: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['query', 'modify'] },
          answer: { type: 'string' },
          document: { type: 'string' }
        },
        required: ['action', 'answer', 'document']
      },
      messages: [
        { role: 'system', content: instructions },
        { role: 'user', content: request }
      ],
      options: {
        temperature: 0.1,
        num_predict: 1024
      }
    }).then((result) => {
      if (!result.message || typeof result.message.content !== 'string') {
        throw new Error('Ollama returned no message content');
      }

      return result.message.content;
    });
  }

  request(pathname, payload) {
    const body = JSON.stringify(payload);
    const transport = this.url.protocol === 'https:' ? https : http;

    return new Promise((resolve, reject) => {
      const request = transport.request({
        protocol: this.url.protocol,
        hostname: this.url.hostname,
        port: this.url.port,
        path: pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        },
        timeout: 120000
      }, (response) => {
        let responseBody = '';

        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          responseBody += chunk;
        });
        response.on('end', () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            const error = new Error(`Ollama returned ${response.statusCode}`);
            error.code = 'OLLAMA_UNAVAILABLE';
            reject(error);
            return;
          }

          try {
            resolve(JSON.parse(responseBody));
          } catch (error) {
            reject(error);
          }
        });
      });

      request.on('timeout', () => {
        request.destroy();
      });
      request.on('error', (error) => {
        error.code = 'OLLAMA_UNAVAILABLE';
        reject(error);
      });
      request.write(body);
      request.end();
    });
  }
}

module.exports = { OllamaClient };
