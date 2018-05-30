const fs = require('fs');
const os = require('os');

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
    this.basepath = os.homedir() + '/.mock-stub/';
    if (!fs.existsSync(this.basepath)) {
      fs.mkdirSync(this.basepath);
    }
  }

  async clean() {
    fs.rmdirSync(this.basepath);
    fs.mkdirSync(this.basepath);
  }

  /**
   * mock stub for ChaincodeStub.getState()
   *
   * @param {string} key
   * @return {Promise<bytes[]>}
   */
  async getState(key) {
    try {
      let content = fs.readFileSync(this.basepath + key);
      content = Buffer.from(content);
      return content;
    } catch (e) {
      if (e.code === 'ENOENT') {
        return null;
      }
    }
  }

  /**
   * mock stub for ChaincodeStub.putState()
   * @param {string} key
   * @param {bytes[]} value
   * @return {Promise<void>}
   */
  async putState(key, value) {
    let v = value.toString('utf8');
    const filepath = this.basepath + key;
    fs.writeFileSync(filepath, v, 'utf8');
  }
}

module.exports = Stub;
