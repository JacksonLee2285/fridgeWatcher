class FreezerService {
  constructor(options) {
    this.store = options.store;
    this.ollama = options.ollama;
    this.queue = Promise.resolve();
  }

  chat(message) {
    const operation = this.queue.then(() => this.process(message));
    this.queue = operation.catch(() => {});
    return operation;
  }

  async process(message) {
    const currentDocument = await this.store.read();
    const rawResponse = await this.ollama.chat(currentDocument, message);
    const result = this.validateResponse(rawResponse);

    if (result.action === 'modify') {
      await this.store.write(this.normalizeDocument(result.document));
    }

    return result.answer.trim();
  }

  validateResponse(rawResponse) {
    let result;

    try {
      result = JSON.parse(rawResponse);
    } catch (error) {
      throw new Error('Model response is not valid JSON');
    }

    if (!result || !['query', 'modify'].includes(result.action)) {
      throw new Error('Model response has an invalid action');
    }

    if (typeof result.answer !== 'string' || !result.answer.trim()) {
      throw new Error('Model response has no answer');
    }

    if (result.action === 'modify') {
      if (typeof result.document !== 'string' || !result.document.trim()) {
        throw new Error('Modify response has no document');
      }

      if (!result.document.trim().startsWith('# Freezer Inventory')) {
        throw new Error('Replacement document is incomplete');
      }
    }

    return result;
  }

  normalizeDocument(document) {
    return `${document.trim()}\n`;
  }
}

module.exports = { FreezerService };
