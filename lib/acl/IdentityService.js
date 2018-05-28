const jsr = require('jsrsasign');
const crypto = require('crypto');

const extractCN = /(\/CN=)(.*?)(\/|,|$)/;

class IdentityService {
  /**
   * Constructor.
   */
  constructor(stub) {
    this.stub = stub;
  }

  // Load and process a certificate.
  loadCertificate() {
    const creator = this.stub.getCurrentUser();
    this.pem = creator.pem.toString('utf8');
    if (this.pem && this.pem.startsWith('-----BEGIN CERTIFICATE-----')) {
      this.certificate = new jsr.X509();
      this.certificate.readCertPEM(this.pem);

      // TODO: Issuer is not always used, so could lazy load that for a performance improvement
      const sha256Issuer = crypto.createHash('sha256');
      sha256Issuer.update(this.certificate.getIssuerString(), 'utf8');
      this.issuer = sha256Issuer.digest('hex');

      const sha256Identifier = crypto.createHash('sha256');
      sha256Identifier.update(Buffer.from(this.certificate.hex, 'hex'));
      this.identifier = sha256Identifier.digest('hex');

      // need to do this because getSubjectString is not in a valid DN format
      // eslint-disable-next-line prefer-destructuring
      this.name = extractCN.exec(this.certificate.getSubjectString())[2];
    } else {
      throw new Error('No creator certificate provided or not a valid x509 certificate');
    }
  }

  /**
   * Get a unique identifier for the identity used to submit the transaction.
   * @return {string} A unique identifier for the identity used to submit the transaction.
   */
  getIdentifier() {
    if (!this.identifier) {
      this.loadCertificate();
    }
    return this.identifier; // this.Certificate.raw, hashed using sha256 and sum result
  }

  /**
   * Get the name of the identity used to submit the transaction.
   * @return {string} The name of the identity used to submit the transaction.
   */
  getName() {
    if (!this.name) {
      this.loadCertificate();
    }
    return this.name;
  }

  /**
   * Get the issuer of the identity used to submit the transaction.
   * @return {string} The issuer of the identity used to submit the transaction.
   */
  getIssuer() {
    if (!this.issuer) {
      this.loadCertificate();
    }
    return this.issuer; // this.Certificate.Issuer.raw, hashed using sha256 and sum result
  }

  /**
   * Get the certificate for the identity used to submit the transaction.
   * @return {string} The certificate for the identity used to submit the transaction.
   */
  getCertificate() {
    if (!this.pem) {
      this.loadCertificate();
    }
    return this.pem;
  }
}

module.exports = IdentityService;
