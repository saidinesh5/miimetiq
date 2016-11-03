const _ = require('underscore');
const amqp = require('amqplib/callback_api');
const amqpuri = require('amqpuri');

const MiimetiqFeed = require('./MiimetiqFeed');

class MiimetiqService {
  constructor(connectionParams) {
    if(connectionParams == null)
      connectionParams = {};

    this.params = _.defaults(connectionParams, {
      host: 'localhost',  //If there is a host, why not a port?
      model: 'defaultModel',
      instanceName: 'defaultInstance',
      username: null,
      password: null,
    });

    if(this.params.username == null)
      this.params.username = `${this.params.model}/${this.params.instanceName}`;

    if(this.params.password  == null)
      this.params.password = 'anypass';

    //All the communication happening between this client and server happens via. this channel
    this.connection = null;
  }

  //Establish a connection to the miimetiq message passing server
  connect(callback){
    let p = this.params;
    let connectionUri = amqpuri.format({ host: p.host, username: p.username, password: p.password });
    let self = this;
    amqp.connect(connectionUri, function(error, connection){
      if(error != null)
        return callback(error);

      self.connection = connection;
      callback(null);
    });
  }

  //Is ready only once we have a conneciton to the server
  isReady(){
    return this.connection != null;
  }

  //Given a signal we wish to deal with, get a feed for it.(not idempotent)
  getFeed(signalParams, callback){
    if(!this.isReady())
      return callback(new Error('MiimetiqService is not yet ready to take requests. Did you call connect?'));
    
    if(signalParams == null)
      signalParams = {};
    
    if(!MiimetiqFeed.supportsDatatype(signalParams['type']))
      return callback(new Error('Unsupported data type: ' + signalParams['type'] ));

    let p = _.defaults(signalParams,{
      deviceId: 'defaultDeviceId',
      instrument: 'defaultInstrument',
      writer: 'defaultWriter',
      model: this.params.model
    });

    let exchange = 'miimetiq.signals';
    let feedKey = `miimetiq.ds.writer.${p.type}.${p.model}.${p.deviceId}.${p.instrument}.${p.writer}`;

    //Create a new channel for the feed and add it to our channel return it
    this.connection.createChannel(function(err, channel){
      if(err != null)
        return callback(error);

      callback(null, new MiimetiqFeed(channel, p, exchange, feedKey));
    });
  }

  //End the connection with the miimetiq server. This will invalidate all the requested feeds.
  disconnect(){
    if(this.connection != null)
    {
      try { this.connection.close(); }
      catch (e) { console.error(e); }
      this.connection = null;
    }
  }
}


module.exports = exports = MiimetiqService;
