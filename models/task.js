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

    },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }
}, { timestamps: true });
const task = mongoose.model('task',taskSchema);
module.exports= task;