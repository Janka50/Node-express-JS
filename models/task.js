const mongoose=require('mongoose');
const taskSchema= new mongoose.Schema({
    title :{
    type: String ,
    required : true,
    minlength: 1,
    trim:true
},
    completed :{
        type:Boolean,
        default: false 

    }

});
const task = mongoose.model('task',taskSchema);
module.exports= task;