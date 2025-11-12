const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true

    },
    Email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true

    },
    Password:{
        type:String,
        required:true,
        trim: true,
        minlength:6

    }
});

userSchema.pre( 'save', async function (next){
    if (this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next(); 
})

userSchema.methods.comparePassword = async function (candidatePassword, thisPassword){
    return bcrypt.compare(candidatePassword, thisPassword)
    
};
module.exports = mongoose.model('User', userSchema);