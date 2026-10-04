const fs = require('fs');
const path = require('path');
const util = require('util');

const mkdir = util.promisify(fs.mkdir);
const readFile = util.promisify(fs.readFile);
const rename = util.promisify(fs.rename);
const stat = util.promisify(fs.stat);
const writeFile = util.promisify(fs.writeFile);

const INITIAL_STATE = '# Freezer Inventory\n\nEmpty.\n';

class LocalFileFreezerStore {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async ensureExists() {
    await mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      await stat(this.filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }

      await writeFile(this.filePath, INITIAL_STATE, { encoding: 'utf8', flag: 'wx' });
    }
  }

  async read() {
    await this.ensureExists();
    return readFile(this.filePath, 'utf8');
  }

  async readWithMetadata() {
    const content = await this.read();
    const details = await stat(this.filePath);

    return {
      content,
      lastModified: details.mtime.toISOString()
    };
  }

  async write(content) {
    const temporaryPath = `${this.filePath}.tmp`;
    await writeFile(temporaryPath, content, 'utf8');
    await rename(temporaryPath, this.filePath);
  }
}

module.exports = { LocalFileFreezerStore };
