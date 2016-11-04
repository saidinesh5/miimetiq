const _ = require('underscore');
const amqp = require('amqplib/callback_api');
const amqpuri = require('amqpuri');

const MiimetiqFeed = require('./MiimetiqFeed');
const MiimetiqSerializer = require('./MiimetiqSerializer');
const MiimetiqRPCClient = require('./MiimetiqRPCClient');
const MiimetiqRPCServer = require('./MiimetiqRPCServer');

/**
 * Class representing a connection to the MiimetiqService
 */
class MiimetiqService {

  /**
   * Create an MiimetiqService object
   * @param {object} connectionParams.
   *                 Defaults:{
   *                            host: 'localhost',
   *                            model: 'defaultModel',
   *                            instance: 'defaultInstance'
   *                          }
   */
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

    //actual RabbitMQ connection object
    this.connection = null;
  }

  /**
   * Connect to the Miimetiq Server
   * @param {function} callback(error)
   */
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

  /**
   * Is the connection to the Miimetiq Server ready
   * @return {boolean} true when the connection is ready
   */
  isReady(){
    return this.connection != null;
  }

  /**
   * Given a signal we wish to interact with, get the MiimetiqFeed object corresponding to it
   * @param {object} signalParams.
   *                 Defaults: {
   *                              deviceId: 'defaultDeviceId',
   *                              instrument: 'defaultInstrument',
   *                              writer: 'defaultWriter',
   *                              type: 'boolean'
   *                          }
   * @param {function} callback(error, connection)
   */
  getFeed(signalParams, callback){
    if(!this.isReady())
      return callback(new Error('MiimetiqService is not yet ready to take requests. Did you call connect?'));
    
    if(signalParams == null)
      signalParams = {};
    
    if(!MiimetiqSerializer.supportsDatatype(signalParams['type']))
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

  /**
   * Get an RPC end point of the type MiimetiqRPCServer or MiimetiqRPCClient for the given params
   * @param {string} mode: "server"/"client".
   * @param {object} rpcParams.
   *                 Defaults: {
   *                              deviceId: 'defaultDeviceId',
   *                              instrument: 'defaultInstrument',
   *                              timeout: 30000,
   *                           }
   * @param {function} callback(error, rpcEndPoint)
   */
  getRPCEndPoint(mode, rpcParams, callback){
    if(!this.isReady())
      return callback(new Error('MiimetiqService is not yet ready to take requests. Did you call connect?'));

    if(mode !== 'server' && mode !== 'client')
      return callback(new Error('mode MUST be either "server" or "client"'));

    if(rpcParams == null)
      rpcParams = {};


    let p = _.defaults(rpcParams,{
      deviceId: 'defaultDeviceId',
      instrument: 'defaultInstrument',
      model: this.params.model,
      timeout: 30000
    });

    let queueKey = `miimetiq.rpc.channel.${p.model}.${p.deviceId}.${p.instrument}`;

    this.connection.createChannel(function(err, channel){
      if(err != null)
        return callback(error);

      if(mode === "server")
        callback(null, new MiimetiqRPCServer(channel, p, queueKey));
      else
        callback(null, new MiimetiqRPCClient(channel, p, queueKey));
    });
  }

  /**
   * Terminates the connection with the Miimetiq Server, and destroys the connection object.
   */
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
