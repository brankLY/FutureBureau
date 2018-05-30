

function response(success, data) {
  return JSON.stringify({ success, data });
}

module.exports = {
  response,
};
