import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.js';
import { HttpError } from '../utils/http.js';
import { query } from '../db/pool.js';
import type { UserRow } from '../types.js';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user: AuthUser;
  }
}

interface JwtPayload {
  sub: string;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId } as JwtPayload, config.jwtSecret, {
    expiresIn: config.accessTokenTtl as unknown as number,
  });
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new HttpError(401, 'Требуется авторизация');

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch {
      throw new HttpError(401, 'Токен недействителен или истёк');
    }

    const { rows } = await query<UserRow>(
      'SELECT * FROM users WHERE id = $1',
      [payload.sub],
    );
    const user = rows[0];
    if (!user) throw new HttpError(401, 'Пользователь не найден');

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    };
    next();
  } catch (err) {
    next(err);
  }
}