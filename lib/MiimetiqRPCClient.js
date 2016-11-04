const uuid = require('node-uuid');
const _ = require('underscore');

const MiimetiqSerializer = require('./MiimetiqSerializer');

class MiimetiqRPCClient {
  constructor(channel, params, queueKey){
    this.channel = channel;
    this.params = params;
    this.queueKey = queueKey;
    this.fromAddress = null;
    this.remoteProcedures = null;
    this.pendingRequests = {}
  }
  
  invoke(methodName, methodParams, callback){
    if(!this.isReady())
      return callback(new Error('Client is not ready to make requests yet. Did you call connect yet?'));
    
    var corr = uuid.v4();
    let request = {'jsonrpc': 2.0, 'id': corr, 'method': methodName, 'params': methodParams};
    let requestMsg;

    try{
      requestMsg = MiimetiqSerializer.pack(request, 'json');
    }
    catch(e){
      return callback(e);
    }

    this.channel.sendToQueue(this.queueKey, requestMsg, {correlationId: corr, replyTo: this.fromAddress});
    
    this.pendingRequests[corr] = callback;

    let self = this;

    //Timeout for response
    setTimeout(function(){
      if(corr in self.pendingRequests)
      {
        let c = self.pendingRequests[corr];
        delete self.pendingRequests[corr];
        c(new Error("Timed out waiting for the server to reply"));
      }
    },

    self.params.timeout);
  }

  //Connect to the RPC Server and retrieve the list of available methods
  connect(callback){
    let ch = this.channel;
    let self = this;

    ch.assertQueue('', {exclusive: true}, function(err, q){
      self.fromAddress = q.queue;

      ch.consume(q.queue, function(msg){
        if(msg.properties.correlationId in self.pendingRequests){
          let response;

          try {
            response = MiimetiqSerializer.unpack(msg.content, 'json');
          }
          catch(e){
            return cbk(new Error('Unable to parse the response'));
          }

          let cbk = self.pendingRequests[msg.properties.correlationId];
          delete self.pendingRequests[msg.properties.correlationId];

          if(response['error'] != null) return cbk(new Error(response['error']['message']));
          else return cbk(null, response['result']);
        }
      });

      //request for available remote Methods
      self.invoke('rpcGetMethods', [], function(e, res){
        if(e !== null)
          return callback(e);

        self.remoteProcedures = res.reduce(function(o, methodName){
          o[methodName] = function(args, cbk){
            self.invoke(methodName, args, cbk);  }
          return o;
        }, {});

        callback(null, self.remoteProcedures);
      });
    });

  }

  isReady(){
    return this.fromAddress != null;
  }

  disconnect(){
    //TODO: implement me.
  }
}

module.exports = exports = MiimetiqRPCClient;
