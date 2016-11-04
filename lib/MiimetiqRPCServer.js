const _ = require('underscore');

const MiimetiqSerializer = require('./MiimetiqSerializer');

class MiimetiqRPCServer {
  constructor(channel, params, queueKey){
    this.channel = channel;
    this.rpcParams = params;
    this.queueKey = queueKey;
    this.procedures = null;
  }

  start(procedures){
    //TODO: check that procedures cannot contain methods whose names start with rpc
    let ch = this.channel;
    this.procedures = procedures;

    ch.assertQueue(this.queueKey, {durable: false});
    ch.prefetch(1);
    
    function reply(msg, error, result){
      let responseMsg;
      let response = {'jsonrpc': 2.0, 'id': msg.properties.correlationId};
      if(error != null){
        response['error'] = error;
      }
      else response['result'] = result;

      try{
        responseMsg = MiimetiqSerializer.pack(response, 'json');
      }
      catch(e){
        responseMsg = MiimetiqSerializer.pack({
          'jsonrpc': 2.0,
          'error': { 'code': -32000, 'message': 'Unable to parse the response'}
        }, 'json');
      }

      ch.sendToQueue(msg.properties.replyTo, responseMsg,{correlationId: msg.properties.correlationId});
      ch.ack(msg);
    }

    ch.consume(this.queueKey, function(msg){
      let request;
      try {
        request = MiimetiqSerializer.unpack(msg.content, 'json');
      }
      catch(e){
        //parse error(-32700)
        return reply(msg, {'code': -32700, 'message': 'Unable to parse the request'});
      }

      //invalid request(-32600)
      let methodName = request['method'];

      if(methodName === undefined || methodName === null)
        return reply(msg, {'code': -32600, 'message': 'Invalid request'});

      //TODO: even get the parameters accepted by each procedure
      if(methodName === 'rpcGetMethods')
        return reply(msg, null, _.keys(procedures));

      //method not found(-32601)
      if(procedures[methodName] === undefined || procedures[methodName] === null)
        return reply(msg, {'code': -32601, 'message': 'Method not found'});

      //invalid params(-32602) -- not implemented
      //internal error(-32603)
      try{
        //All OK
        let result = procedures[methodName].apply(null, request['params']);
        return reply(msg, null, result);
      }
      catch(e){
        return reply(msg, {'code': -32603, 'message': e.message});
      };
    });
  }

  stop(){
    //TODO: implement me.
  }
}

module.exports = exports = MiimetiqRPCServer;
