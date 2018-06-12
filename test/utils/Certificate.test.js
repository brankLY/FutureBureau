/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const Certificate = require('../../lib/utils/Certificate');

describe('Test utils/Certificate', () => {
  const ADMIN_CERT = '-----BEGIN CERTIFICATE-----\n' +
    'MIIB/jCCAaWgAwIBAgIUJ0FIBtQPv8eS1d2BSuEZG+1b81EwCgYIKoZIzj0EAwIw\n' +
    'cDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh\n' +
    'biBGcmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xGTAXBgNVBAMT\n' +
    'EG9yZzEuZXhhbXBsZS5jb20wHhcNMTgwNjEyMDUyOTAwWhcNMTkwNjEyMDUzNDAw\n' +
    'WjAhMQ8wDQYDVQQLEwZjbGllbnQxDjAMBgNVBAMTBWFkbWluMFkwEwYHKoZIzj0C\n' +
    'AQYIKoZIzj0DAQcDQgAEG5B7R56co181Q2ZB/JrIzFOkMwBHt9AGP5vEjo0Ygyif\n' +
    'VLxtwfMF18hyhw9nwC4uhkRYyQ8zjylAAWVffCDm+aNsMGowDgYDVR0PAQH/BAQD\n' +
    'AgeAMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFOA4uxRPp4eWgl87E/ASeTLSGSBB\n' +
    'MCsGA1UdIwQkMCKAIKItrzVrKqtXkupT419m/M7x1/GqKzorktv7+WpEjqJqMAoG\n' +
    'CCqGSM49BAMCA0cAMEQCIBbYdKWW/vSsJAmxyGleTQQvcczl7tP48hRsGlzNErUT\n' +
    'AiB2sMOGoAV52IY1oZXdwLG+HzVXk0G4oUYgq2/DRZi66g==\n' +
    '-----END CERTIFICATE-----\n';

  it('Certificate Test', () => {
    const certificate = new Certificate(ADMIN_CERT);
    expect(certificate).exist;
    expect(certificate.name).exist;
    expect(certificate.name).to.equal('admin');
    const name = certificate.getName();
    expect(name).to.equal('admin');
    const pem = certificate.getCertificate();
    expect(pem).to.equal(ADMIN_CERT);
    const publicKey = certificate.getPublicKey();
    expect(publicKey).exist;
    const issuer = certificate.getIssuer();
    expect(issuer).exist;
    const identifier = certificate.getIdentifier();
    expect(identifier).exist;
  });
});
