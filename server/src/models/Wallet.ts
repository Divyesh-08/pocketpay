import mongoose, { Schema } from 'mongoose';
const WalletSchema = new Schema({ userId:{type:Schema.Types.ObjectId,ref:'User',required:true,unique:true,index:true}, balance:{type:Number,default:0,min:0}, updatedAt:{type:Date,default:Date.now} });
export const Wallet = mongoose.model('Wallet',WalletSchema);
