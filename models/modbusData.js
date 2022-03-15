var mongoose= require('mongoose');
var User= require('./user.model');
var DataSchema= new mongoose.Schema({
    ip_address:{type: String, required: true},
    datas:[{type: mongoose.Schema.Types.Mixed}],
    slaveId: {type: Number},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    room: {type: String}
});
DataSchema.virtual('info')
.get(function(){
    return "room: "+ this.room+', ip_address: '+this.ip_address+', slaveId: '+ this.slaveId;
});


module.exports= mongoose.model('ModbusData', DataSchema);






