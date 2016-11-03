const MiimetiqSerializer = require('./MiimetiqSerializer');

class MiimetiqFeed {
  constructor(channel, params, exchange, bindingKey){
    this.channel = channel;
    this.params = params;
    this.bindingKey = bindingKey;
    this.exchange = exchange;
  }
  
  publish(data, callback){
    if(callback == null)
      callback = function(err){};

    var msg;
    try {
      msg = MiimetiqSerializer.pack(data, this.params.type);
    }
    catch(e){
      return callback(e);
    }

    //TODO: handle channel events - especially when publish returns false
    let ch = this.channel;

    //Create the exchange if it doesn't exist
    ch.assertExchange(this.exchange, 'direct', {durable: false});
    ch.publish(this.exchange, this.bindingKey, msg);
    return callback(null);
  }

  //Takes  in a callback of type function(err, message, data)
  subscribe(callback){
    let ch = this.channel;
    let self = this;

    //Create the exchange if it doesn't exist
    ch.assertExchange(this.exchange, 'direct', {durable: false});

    //Request a new queue
    ch.assertQueue('', {exclusive: true}, function(err, q){

      //Bind it to our binding key
      ch.bindQueue(q.queue, self.exchange, self.bindingKey);

      //Listen for incoming messages
      ch.consume(q.queue, function(msg){
        try{
          let data = MiimetiqSerializer.unpack(msg.content, self.params.type);
          callback(null, msg, data);
        }
        catch(e){
          callback(e);
        }
      }, {noAck: true});
    });
  }
}

module.exports = exports = MiimetiqFeed;
