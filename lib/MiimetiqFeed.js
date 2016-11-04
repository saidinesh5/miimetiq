const MiimetiqSerializer = require('./MiimetiqSerializer');

/**
 * Class representing an MiimetiqFeed.
 * MiimetiqFeed provides a read/write access to a Miimetiq Signal
 * Eg. DieselGenerator.fuel is a signal of datatype number
 *
 * Usage:
 *   publisherFeed.publish(5)
 *   subscriberFeed.subscribe(console.log) //prints data, once the publisher feed publishes 5
 */
class MiimetiqFeed {
  //not for outside world. All the MiimetiqFeed objects are constructedby MiimetiqService.getFeed();
  constructor(channel, params, exchange, bindingKey){
    this.channel = channel;
    this.params = params;
    this.bindingKey = bindingKey;
    this.exchange = exchange;
  }

  /**
   * publish the data to the feed.
   * @param data - data must be of the type specified to MiimetiqService.getFeed(), or you will get error
   * @param {function} callback(error) - for checking status of the data posted
   */
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

  /**
   * Subscribe for incoming data on this feed
   * @param {function} callback(error, rawMessage, data).
   *                   rawMessage is actual RabbitMQ message object.
   *                   data is the content of the message converted to the feed's datatype.
   */
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
