const assert = require('assert');
const async = require('async');
const _ = require('underscore');

const MiimetiqService = require('../index.js');
const MiimetiqRPCServer = require('../lib/MiimetiqRPCServer.js');
const MiimetiqRPCClient = require('../lib/MiimetiqRPCClient.js');

describe('MiimetiqRPC' , function(){
  let procedures = {
    'power_on': function(){ return 'POWERED_ON'; },
    'power_off': function(){ return 'POWERED_OFF'; },
    'add': function(a, b){ return a + b; },
    'max': function(){ return Math.max.apply(null, arguments); }
  }
  
  let serverDevice = new MiimetiqService({
    host: "localhost",
    username: "guest",
    password: "guest",
    model: "diesel_generator"
  });

  let clientDevice = new MiimetiqService({
    host: "localhost",
    username: "guest",
    password: "guest",
    model: "diesel_generator"
  });

  before(function(done){
    serverDevice.connect(function(err, connection){
      assert.equal(err, null);

      serverDevice.getRPCEndPoint('server',{deviceId: '555', instrument: 'power_switch'}, function(err, endPoint){
        assert.equal(err, null);
        assert.ok(endPoint instanceof MiimetiqRPCServer);
        endPoint.start(procedures);
        done()
      });
    })
  });

  it('tests rpc call', function(done){
    clientDevice.connect(function(err, connection){
      assert.equal(err, null);

      clientDevice.getRPCEndPoint('client', {deviceId: '555', instrument: 'power_switch'}, function(err, endPoint){
        assert.equal(err, null);
        endPoint.connect(function(error, remoteMethods){
          assert.equal(error, null);
          let s = _.keys(procedures);
          let c = _.keys(remoteMethods);
          assert.ok( s.length ==  c.length && _.difference(s, c).length == 0);
          remoteMethods.power_on([], function(err, result){
            assert.equal(err, null);
            assert.equal(result, 'POWERED_ON');
            done();
          })
        });
      });
    });
  });

  it('tests rpc call with parameters', function(done){
    clientDevice.connect(function(err, connection){
      assert.equal(err, null);

      clientDevice.getRPCEndPoint('client', {deviceId: '555', instrument: 'power_switch'}, function(err, endPoint){
        assert.equal(err, null);
        endPoint.connect(function(error, remoteMethods){
          assert.equal(error, null);

          remoteMethods.add([1,2], function(err, result){
            assert.equal(err, null);
            assert.equal(result, 3);
            done();
          })
        });
      });
    });
  });

  it('tests rpc call with variable number of parameters', function(done){
    clientDevice.connect(function(err, connection){
      assert.equal(err, null);

      clientDevice.getRPCEndPoint('client', {deviceId: '555', instrument: 'power_switch'}, function(err, endPoint){
        assert.equal(err, null);
        endPoint.connect(function(error, remoteMethods){
          assert.equal(error, null);

          remoteMethods.max([1,2,3,5,100,5, 3, 2, 1], function(err, result){
            assert.equal(err, null);
            assert.equal(result, 100);
            done();
          })
        });
      });
    });
  });
  
});
