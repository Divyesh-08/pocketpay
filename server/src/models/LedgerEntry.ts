import mongoose, { Schema } from 'mongoose';
const LedgerEntrySchema = new Schema({ transactionId:{type:Schema.Types.ObjectId,ref:'Transaction',required:true,index:true}, userId:{type:Schema.Types.ObjectId,ref:'User',required:true,index:true}, direction:{type:String,enum:['credit','debit'],required:true}, amount:{type:Number,required:true,min:1}, balanceAfter:{type:Number,required:true,min:0}, createdAt:{type:Date,default:Date.now} });
export const LedgerEntry = mongoose.model('LedgerEntry',LedgerEntrySchema);
