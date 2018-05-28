const fs = require('fs');
const os = require('os');

class Stub {
  constructor() {
    this.basepath = os.homedir() + '/.mock-stub/';
    if (!fs.existsSync(this.basepath)) {
      fs.mkdirSync(this.basepath);
    }
  }

  async clean() {
    fs.rmdirSync(this.basepath);
  }

  async getState(key) {
    let content = fs.readFileSync(this.basepath + key);
    content = Buffer.from(content);
    return content;
  }

  async putState(key, value) {
    let v = value.toString('utf8');
    console.log(v);
    const filepath = this.basepath + key;
    fs.writeFileSync(filepath, v, 'utf8');
  }
}

module.exports = Stub;
