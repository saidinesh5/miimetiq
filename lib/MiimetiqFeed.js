class MiimetiqFeed {
  constructor(channel, params, exchange, bindingKey) {
    this._channel = channel;
    this._feedParams = params;
    this._bindingKey = bindingKey;
    this._exchange = exchange;
  }
  
  publish(data, callback){
    if(callback == null)
      callback = function(err){};

    var msg;
    try {
      msg = this.packData(data);
    }
    catch(e){
      return callback(e);
    }

    //TODO: handle channel events - especially when publish returns false
    let ch = this._channel;

    //Create the exchange if it doesn't exist
    ch.assertExchange(this._exchange, 'direct', {durable: false});
    ch.publish(this._exchange, this._bindingKey, msg);
    return callback(null);
  }

  //Takes  in a callback of type function(err, message, data)
  subscribe(callback){
    let ch = this._channel;
    let self = this;

    //Create the exchange if it doesn't exist
    ch.assertExchange(this._exchange, 'direct', {durable: false});

    //Request a new queue
    ch.assertQueue('', {exclusive: true}, function(err, q){

      //Bind it to our binding key
      ch.bindQueue(q.queue, self._exchange, self._bindingKey);

      //Listen for incoming messages
      ch.consume(q.queue, function(msg){
        try{
          let data = self.unpackData(msg.content)
          callback(null, msg, data);
        }
        catch(e){
          callback(e)
        }
      }, {noAck: true});
    });
  }
  
  packData(data)
  {
    if(typeof(data) !== this._feedParams.type)
      throw new Error('Invalid data type');

    return new Buffer(String(data));
  }

  unpackData(data)
  {
    data = String(data);
    switch(this._feedParams.type)
    {
      case 'string':
        return data;
      case 'number':
        if(isNaN(data))
          throw new Error('Invalid datatype: ' + data);
        return Number(data);
      case 'boolean':
        if(data == 'true')
          return true;
        else if(data === 'false')
          return false;
        else
          throw new Error('Invalid datatype: ' + data);
      default:
          throw new Error('Unsupported datatype: ' + data);
    }
  }
  
  static supportsDatatype(type){
    //TODO: Add support for JSON type too...
    if(type === 'boolean' || type === 'number' || type === 'string')
      return true;

    return false;
  }
}


module.exports = exports = MiimetiqFeed;
