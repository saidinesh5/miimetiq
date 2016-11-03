class MiimetiqSerializer {
  static supportsDatatype(type){
    //TODO: Add support for JSON type too...
    if(type === 'boolean' || type === 'number' || type === 'string')
      return true;

    return false;
  }

  //Takes in a supported datatype and returns a Buffer object
  static pack(data, dataType){
    if(typeof(data) !== dataType)
      throw new Error('Invalid data type');

    return new Buffer(String(data));
  }

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
