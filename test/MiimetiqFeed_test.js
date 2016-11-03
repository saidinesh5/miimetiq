const MiimetiqService = require('../index.js');
const assert = require('assert');
const async = require('async');

function generatePublisherSubscriberFeeds(dataType, callback){
  let device = new MiimetiqService({
    host: "localhost",
    username: "guest",
    password: "guest"
  });
  device.connect(function(err, connection){
    if(err)
      return cbk(err);

    async.map([null,null],
              function(data, cbk){ device.getFeed({type: dataType}, cbk);},
              callback);
  });
}

describe('MiimetiqFeed' , function(){
  //FIXME: Move the generation of the feeds to setup/before phase, to ditch the race conditions  

  describe('publish-subscribe(boolean)', function(){
    it('publish a boolean(false) to a feed, an a consumer should receive the false', function(done){
      generatePublisherSubscriberFeeds('boolean', function(err, feeds){
        let publisherFeed = feeds[0];
        let subscriberFeed = feeds[1];
        
        subscriberFeed.subscribe(function(err, msg, data){
          assert.equal(err, null);
          assert.equal(data, false);
          assert.equal(typeof(data), 'boolean');
          done();
        });

        //We need a little delay because of the time it takes for the subscriber to register
        setTimeout(function(){publisherFeed.publish(false)}, 10);
      });
    });
  });


  describe('publish-subscribe(number)', function(){
    it('publish a number to a feed, an a consumer should receive the number', function(done){
      generatePublisherSubscriberFeeds('number', function(err, feeds){
        let publisherFeed = feeds[0];
        let subscriberFeed = feeds[1];
        
        subscriberFeed.subscribe(function(err, msg, data){
          assert.equal(err, null);
          assert.equal(data, 555);
          assert.equal(typeof(data), 'number');
          done();
        });

        //We need a little delay because of the time it takes for the subscriber to register
        setTimeout(function(){publisherFeed.publish(555)}, 20);
      });
    });
  });
  
  
  describe('publish-subscribe(string)', function(){
    it('publish a string to the feed, and a consumer should receive the string', function(done){
      generatePublisherSubscriberFeeds('string', function(err, feeds){
        let publisherFeed = feeds[0];
        let subscriberFeed = feeds[1];
        
        subscriberFeed.subscribe(function(err, msg, data){
          assert.equal(err, null);
          assert.equal(data, 'hello');
          assert.equal(typeof(data), 'string');
          done();
        });

        //We need a little delay because of the time it takes for the subscriber to register
        setTimeout(function(){publisherFeed.publish('hello')}, 20);
      });
    });
  });

});
