const { USER_ROLES } = require('./Constants');

class TypeChecker {
  /**
   * Check if value is of type boolean
   * @param {boolean} value
   * @return {boolean}
   */
  static checkBoolean(value) {
    return typeof value === 'boolean';
  }

  /**
   * Check if value if of type string
   * @param {string} value
   * @return {boolean}
   */
  static checkString(value) {
    return typeof value === 'string';
  }

  /**
   * Check if value is of type integer
   * @param {number} value
   * @return {boolean}
   */
  static checkInteger(value) {
    // use isSafeInteger to ensure Precision safe.
    return Number.isSafeInteger(value);
  }

  /**
   * Check if value is an uint4 number
   * @param {number} value
   * @return {boolean}
   */
  static checkUint4(value) {
    let res = Number.isSafeInteger(value);
    if (!res) {
      return res;
    }
    if (value < 0 || value >= 16) {
      res = false;
    }
    return res;
  }

  static checkUint32(value) {

  }

  static checkUint64(value) {

  }

  static checkArray(arr) {
    return Array.isArray(arr);
  }

  static checkUserRole(role) {
    return this.checkString(role) && USER_ROLES.includes(role);
  }
}

module.exports = TypeChecker;
