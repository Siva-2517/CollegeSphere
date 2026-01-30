const mongoose= require('mongoose')

const EventSchema= new mongoose.Schema({
    title:{
        type:String,
        required:true,
        trim:true
    },
    description:{
        type:String,
        required:true
    },
    date:{
        type:Date,
        required:true
    },
    venue:{
        type:String,
        required:true  
    },
    collegeId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'College',
        required:true   
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    deadline: {
        type: Date,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    poster: {
        type: String,
        default: null
    },
    isApproved:{
        type:Boolean,
        default:false
    }
},{timestamps:true});

module.exports= mongoose.model('Event',EventSchema);
