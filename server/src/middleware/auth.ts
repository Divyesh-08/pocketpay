import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
export interface AuthRequest extends Request { userId?: string; role?: string }
export function auth(req:AuthRequest,res:Response,next:NextFunction){ const token=req.headers.authorization?.replace(/^Bearer\s+/i,''); if(!token)return res.status(401).json({error:'Sign in to continue'}); try{const p=jwt.verify(token,process.env.JWT_SECRET||'dev-secret-change-me') as {id:string;role:string};req.userId=p.id;req.role=p.role;next()}catch{return res.status(401).json({error:'Session expired. Please sign in again.'})} }
export function adminOnly(req:AuthRequest,res:Response,next:NextFunction){if(req.role!=='admin'&&req.role!=='guardian')return res.status(403).json({error:'Admin access required'});next()}
