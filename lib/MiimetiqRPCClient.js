const uuid = require('node-uuid');
const _ = require('underscore');

const MiimetiqSerializer = require('./MiimetiqSerializer');

/**
 * Class representing an RPC client. It lets you invoke a procedures exposed by the MiimetiqRPCServer
 * Internally, it implements the JSON-RPC protocol.
 * Once the connection to the remote server is established,
 * all the available remote methods are also made available via. the remoteProcedures property
 * Usage:
 *   rpcClient.connect(function(error, remoteProcedures){
 *     if(error != null){
 *       remoteProcedures.add([1,2], console.log) //if no error, prints "undefined 3"
 *       rpcClient.invoke('add', [1,2], console.log ) //if no error, prints "undefined 3"
 *     }
 *   });
 *
 *   rpcClient.isReady()
 *   rpcClient.disconnect()
 */
class MiimetiqRPCClient {
  constructor(channel, params, queueKey){
    this.channel = channel;
    this.params = params;
    this.queueKey = queueKey;
    this.fromAddress = null;
    this.remoteProcedures = null;
    this.pendingRequests = {}
  }

  /**
   * Invoke the call on the remote server
   * @param {object} procedures to expose. object is of the type {'procedureName' : function(){ }}
   *                 procedureNames CANNOT start with rpc. They are reserved for internal use.
   */
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

  /**
   * Check if the connection to the RPC Server is up and running
   * @return {boolean} - returns true when the connection is up.
   */
  isReady(){
    return this.fromAddress != null;
  }

  /**
   * Disconnect from the server
   */
  disconnect(){
    //TODO: implement me.
  }
}

module.exports = exports = MiimetiqRPCClient;
