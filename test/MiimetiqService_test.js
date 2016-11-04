const assert = require('assert');

const MiimetiqService = require('../index.js');
const MiimetiqRPCServer = require('../lib/MiimetiqRPCServer.js');
const MiimetiqRPCClient = require('../lib/MiimetiqRPCClient.js');


describe('MiimetiqService' , function(){
  describe('constructor', function(){
    it('should initialize with defaults', function(){
      let device = new MiimetiqService();
      assert.equal(device.params.host, 'localhost');
    });
  });
  
  describe('connect', function(){
    it('should fail when host doesnt run rabbitmq', function(done){
      let device = new MiimetiqService({
        host: "0.0.0.0",
        model: "6-diesel_generator_schema",
        instanceName: "test_dg"
      });
      
      device.connect(function(err, connection){
        assert.notEqual(err, null);
        assert.equal(device.connection, null);
        done();
      });
    });

    it('should return no error when host runs rabbitmq', function(done){
      let device = new MiimetiqService({
        host: "localhost",
        model: "6-diesel_generator_schema",
        instanceName: "test_dg",
        username: "",
        password: ""
      });

      device.connect(function(err, connection){
        assert.equal(err, null);
        assert.notEqual(device.connection, null);
        done(err);
      });
    });
    
  });
  
  describe('disconnect', function(){
    it('should close and nullify the rabbitmq connection', function(done){
      let device = new MiimetiqService({
        host: "localhost",
        username: "guest",
        password: "guest"
      });

      assert.equal(device.connection, null);
      device.connect(function(err, connection){
        assert.notEqual(device.connection, null);
        device.disconnect();
        assert.equal(device.connection, null);
        done();
      });
    });
  });
  
  describe('isReady', function(){
    it('should return true, only when connected to the rabbitmq server', function(done){
      let device = new MiimetiqService({
        host: "localhost",
        username: "guest",
        password: "guest"
      });

      assert.equal(device.isReady(), false);
      device.connect(function(err, connection){
        assert.equal(device.isReady(), true);
        device.disconnect();
        assert.equal(device.isReady(), false);
        done()
      });
    });
  });

  describe('getFeed', function(){
    it('should return the feed, only when connected to the rabbitmq server', function(done){
      let device = new MiimetiqService({
        host: "localhost",
        username: "guest",
        password: "guest"
      });

      device.connect(function(err, connection){
        assert.equal(err, null);
        device.getFeed({type: 'string'}, function(err, feed){
          assert.equal(err, null);
          done()
        });
      });
    });
  });


  describe('getRPCEndPoint', function(){
    it('should return an instance of MiimetiqRPCServer bound to the deviceID:instrument', function(done){
      let device = new MiimetiqService({
        host: "localhost",
        username: "guest",
        password: "guest",
        model: "diesel_generator"
      });

      device.connect(function(err, connection){
        assert.equal(err, null);
        device.getRPCEndPoint('server', {deviceId: '555', instrument: 'power_switch'}, function(err, endPoint){
          assert.equal(err, null);
          assert.ok(endPoint instanceof MiimetiqRPCServer);
          done()
        });
      });
    });

    it('should return an instance of MiimetiqRPCServer bound to the deviceID:instrument', function(done){
      let device = new MiimetiqService({
        host: "localhost",
        username: "guest",
        password: "guest",
        model: "diesel_generator"
      });

      device.connect(function(err, connection){
        assert.equal(err, null);
        device.getRPCEndPoint('client', {deviceId: '555', instrument: 'power_switch'}, function(err, endPoint){
          assert.equal(err, null);
          assert.ok(endPoint instanceof MiimetiqRPCClient);
          done()
        });
      });
    });

  });

});
