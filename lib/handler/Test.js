const Response = require('../utils/Response');
const logger = require('../utils/Logger').getLogger('handler');
const shim = require('fabric-shim');

const EARTH_CHAINCODE_ID = 'e24ea80d-d703-47a3-88af-1c69f21b025d';


function handleInvokeCCResp(txInString, response) {
  logger.debug(`handleResponse > ${txInString}, ${JSON.stringify(response)}`);
  if (!response) {
    throw new Error('Empty response from chaincode call');
  }
  if (response.status !== 200) {
    while (response.message) {
      { // the node case
        let m = response.message.match(/.*returned error response \[(.*)]\. Sending ERROR message back to peer.*/m);
        if (m && m.length === 2) {
          response.message = m[1];
          break;
        }
      }
      break;
    }
    try {
      response.message = JSON.parse(response.message);
    } catch (e) {
      // do nothing
    }
    logger.error(`Error when invoking cc with param ${txInString}, returned: ${response.message}`);

    if (response.message && response.message.message) {
      response.message = response.message.message;
    }
    throw new Error(response.message);
  }

  if (!response.payload) {
    return;
  }

  let result = response.payload.toString('utf8');
  if (result && result.startsWith('[') || result.startsWith('{')){
    try {
      result = JSON.parse(result);
    } catch (e) {
      // do nothing
    }
  }
  return result;
}

class Test {
	 async transferFromContractAccount(stub, params) {
    const method = 'transferFromContractAccount';
    logger.debug('%s - enter', method);

    try {
      const contractAccountId = (await stub.getState('futurebureau')).toString('utf8');
      const transferTokenRequest = {
        symbol: 'GZH',
        from: contractAccountId, // Notice: here we need to specify the 'from' property
        target: params[0],
        amount: 10,
        description: 'sample code to test transfer from contractAccount',
      }
      const args = ['wallet.transfer', JSON.stringify(transferTokenRequest)];
      const response = await stub.invokeChaincode(EARTH_CHAINCODE_ID, args);
      const tx = {
        method,
        params: transferTokenRequest,
      };
      const resp = handleInvokeCCResp(JSON.stringify(tx), response);
      logger.debug('%s - transfer token response: %j', method, resp);
      logger.debug('%s - exit', method);
      return shim.success(Buffer.from(JSON.stringify(resp)));
    } catch (e) {
      logger.error(e);
      return shim.error(Buffer.from(e.message));
    }
  }
}

module.exports = Test;
