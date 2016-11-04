# Miimetiq

A little library to talk to all your IoT devices.
It is currently composed of:
  * [MiimetiqService](https://github.com/saidinesh5/miimetiq/blob/master/lib/MiimetiqService.js) - an object representing the Miimetiq Service
  * [MiimetiqFeed](https://github.com/saidinesh5/miimetiq/blob/master/lib/MiimetiqFeed.js) - to publish/subscribe to data
  * [MiimetiqRPCServer](https://github.com/saidinesh5/miimetiq/blob/master/lib/MiimetiqRPCServer.js) and [MiimetiqRPCClient](https://github.com/saidinesh5/miimetiq/blob/master/lib/MiimetiqRPCClient.js) - a JSON RPC implementation

---

### Installation
```bash
$ npm install https://github.com/saidinesh5/miimetiq.git
```



### Usage
```javascript
const MiimetiqService = require('miimetiq')

var miimetiqService =  new MiimetiqService({
                                         host: 'localhost',
                                         model: 'dieselGenerator',
                                         instance: '007'
                                       })

miimetiqService.connect(function(err, connection){
  if(err != null)
    return

  //Publisher example
  miimetiqService.getFeed({
    deviceId: '101101110',
    instrument: 'generator',
    writer: 'fuelgauge',
    type: 'number'}, function(err, feed){

    if(err != null)
      return;

    feed.publish(10);
    feed.publish(20);
    feed.publish(30);
  });

  //Subscriber example
  miimetiqService.getFeed({
    deviceId: '101101110',
    instrument: 'generator',
    writer: 'fuelgauge',
    type: 'number'}, function(err, feed){

    if(err != null)
      return;

    feed.subscribe(console.log) //prints 10, 20, 30 (because of the publisher above)
  });

  //RPC server example
  miimetiqService.getRPCEndPoint('server',
    {deviceId: '101101110', instrument: 'powerManager'},
    function(error, server){
      if(err != null)
        return;

        server.start({
          'powerOff': function(){ console.log('Powering down..'); return 'Powered off'; }
        });
  });

  //RPC client example
  miimetiqService.getRPCEndPoint('client',
    {deviceId: '101101110', instrument: 'powerManager'},
    function(error, endPoint){
      if(err != null)
        return;

      endPoint.connect(function(err, remoteMethods){
        if(err != null)
          return;

        console.log(remoteMethods); //prints { 'powerOff' , function() }
        remoteMethods.powerOff([], console.log) //With any luck, prints "null 'Powered off'"
      });
  });

});
```

### License - MIT
---
```
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
