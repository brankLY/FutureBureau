/* eslint-disable class-methods-use-this,prefer-destructuring,prefer-template,no-unused-vars */
const fs = require('fs');
const os = require('os');
const utf8 = require('utf8');
const rimraf = require('rimraf');

function validateCompositeKeyAttribute(attr) {
  if (!attr || typeof attr !== 'string' || attr.length === 0) {
    throw new Error('object type or attribute not a non-zero length string');
  }
  utf8.decode(attr);
}

const MIN_UNICODE_RUNE_VALUE = '\u0000';
const MAX_UNICODE_RUNE_VALUE = '\u{10ffff}';
const COMPOSITEKEY_NS = '\x00';
const EMPTY_KEY_SUBSTITUTE = '\x01';

class User {
  constructor(id, name, issuer, pem) {
    this.id = id;
    this.name = name;
    this.issuer = issuer;
    this.pem = pem;
  }
}

class Stub {
  constructor() {
    this.basepath = `${os.homedir()}/.mock-stub/`;
    if (!fs.existsSync(this.basepath)) {
      fs.mkdirSync(this.basepath);
    }
  }

  async reset() {
    return new Promise((resolve, reject) => {
      rimraf(this.basepath, (e) => {
        if (e) {
          reject(e);
        } else {
          fs.mkdirSync(this.basepath);
          resolve();
        }
      });
    });
  }

  /**
   * mock stub for ChaincodeStub.getState()
   *
   * @param {string} key
   * @return {Promise<bytes[]>}
   */
  async getState(key) {
    try {
      const res = this.splitCompositeKey(key);
      let filepath = res.objectType + '.' + res.attributes.join('.');
      filepath = this.basepath + filepath;
      let content = fs.readFileSync(filepath, 'utf8');
      content = Buffer.from(content);
      return content;
    } catch (e) {
      if (e.code === 'ENOENT') {
        return null;
      }
      throw e;
    }
  }

  /**
   * mock stub for ChaincodeStub.putState()
   * @param {string} key
   * @param {bytes[]} value
   * @return {Promise<void>}
   */
  async putState(key, value) {
    const v = value.toString('utf8');
    const res = this.splitCompositeKey(key);
    let filepath = res.objectType + '.' + res.attributes.join('.');
    filepath = this.basepath + filepath;

    fs.writeFileSync(filepath, v, 'utf8');
  }

  createCompositeKey(objectType, attributes) {
    validateCompositeKeyAttribute(objectType);
    if (!Array.isArray(attributes)) {
      throw new Error('attributes must be an array');
    }

    let compositeKey = COMPOSITEKEY_NS + objectType + MIN_UNICODE_RUNE_VALUE;
    attributes.forEach((attribute) => {
      validateCompositeKeyAttribute(attribute);
      compositeKey = compositeKey + attribute + MIN_UNICODE_RUNE_VALUE;
    });
    return compositeKey;
  }

  splitCompositeKey(compositeKey) {
    const result = { objectType: null, attributes: [] };
    if (compositeKey && compositeKey.length > 1 && compositeKey.charAt(0) === COMPOSITEKEY_NS) {
      const splitKey = compositeKey.substring(1).split(MIN_UNICODE_RUNE_VALUE);
      if (splitKey[0]) {
        result.objectType = splitKey[0];
        splitKey.pop();
        if (splitKey.length > 1) {
          splitKey.shift();
          result.attributes = splitKey;
        }
      }
    }
    return result;
  }
}

module.exports = Stub;
