
/**
 * A collection of classes to pack / unpack data between Miimetiq <--> RabbitMQ
 * For internal use only
 */
class MiimetiqSerializer {
  static supportsDatatype(type){
    if(type === 'boolean' || type === 'json' || type === 'number' || type === 'string')
      return true;

    return false;
  }

  //Takes in a supported datatype and returns a Buffer object
  static pack(data, dataType){
    if(dataType == 'json'){
      //TODO: Make a check to see if the conversion failed
      let result = new Buffer(JSON.stringify(data));
      return result;
    }

    if(typeof(data) !== dataType)
      throw new Error('Invalid data type');

    return new Buffer(String(data));
  }

  //Takes in a buffer object and converts it to an object of the dataType
  static unpack(data, dataType){
    data = String(data);
    switch(dataType)
    {
      case 'string':
        return data;
      case 'number':
        if(isNaN(data))
          throw new Error('Invalid datatype: ' + data);
        return Number(data);
      case'json':
        return JSON.parse(data);
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
}

module.exports = exports = MiimetiqSerializer;
