import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({ name:{type:String,required:true,trim:true}, email:{type:String,required:true,unique:true,lowercase:true,index:true}, passwordHash:{type:String,required:true}, handle:{type:String,required:true,unique:true,index:true}, avatar:{type:String,default:''}, role:{type:String,enum:['user','admin','guardian'],default:'user'}, isFrozen:{type:Boolean,default:false}, spendingLimit:{type:Number,default:5000}, createdAt:{type:Date,default:Date.now} });
export const User = mongoose.model('User',UserSchema);
