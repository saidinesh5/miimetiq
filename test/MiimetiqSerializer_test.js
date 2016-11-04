const MiimetiqSerializer = require('../lib/MiimetiqSerializer.js');
const assert = require('assert');

describe('MiimetiqSerializer' , function(){

  let pack = MiimetiqSerializer.pack;
  let unpack = MiimetiqSerializer.unpack;

  describe('pack(boolean)', function(){
    it('pack(boolean)', function(){
      assert.deepEqual(pack(true, "boolean"), new Buffer('true'));
      assert.deepEqual(pack(false, "boolean"), new Buffer('false'));
    });
  });

  describe('unpack(pack(boolean))', function(){
    it('unpack(pack(true, "boolean"), "boolean") = true', function(){
      assert.equal(unpack(pack(true, "boolean"), "boolean"), true);
    });
    it('unpack(pack(false, "boolean"), "boolean") = false', function(){
      assert.equal(unpack(pack(false, "boolean"), "boolean"), false);
    });
  });

  describe('unpack(pack(number))', function(){
    it('unpack(pack(5, "number"), "number") = 5', function(){
      assert.equal(unpack(pack(5, "number"), "number"), 5);
    });
    it('unpack(pack(5.5, "number"), "number") = 5', function(){
      assert.equal(unpack(pack(5.5, "number"), "number"), 5.5);
    });
  });

  describe('unpack(pack(string))', function(){
    it('unpack(pack("hello", "string"), "string") = "hello"', function(){
      assert.equal(unpack(pack("hello", "string"), "string"), "hello");
    });
  });

  describe('unpack(pack(json))', function(){
    it('unpack(pack({"hello":"world"}, "json"), "json")["hello"] = "world"', function(){
      assert.equal(unpack(pack({"hello":"world"}, "json"), "json")["hello"], "world");
    });
  });
});
