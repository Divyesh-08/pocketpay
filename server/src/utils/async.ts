import type { Request, Response, NextFunction } from 'express';
export const wrap=(fn:(req:Request,res:Response,next:NextFunction)=>unknown)=>(req:Request,res:Response,next:NextFunction)=>Promise.resolve(fn(req,res,next)).catch(next);
