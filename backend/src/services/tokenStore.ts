import crypto from 'node:crypto';
import Redis from 'ioredis';
import { config } from '../config.js';

// Хранилище refresh-токенов: Redis (в проде) с автоматическим переходом
// на in-memory хранилище (в dev, если Redis недоступен).

class MemoryTokenStore {
  private tokens = new Map<string, { userId: string; expiresAt: number }>();

  async set(token: string, userId: string, ttlSeconds: number): Promise<void> {
    this.tokens.set(token, { userId, expiresAt: Date.now() + ttlSeconds * 1000 });
    this.cleanup();
  }

  async get(token: string): Promise<string | null> {
    const entry = this.tokens.get(token);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.tokens.delete(token);
      return null;
    }
    return entry.userId;
  }

  async del(token: string): Promise<void> {
    this.tokens.delete(token);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.tokens) {
      if (entry.expiresAt < now) this.tokens.delete(key);
    }
  }
}

let redis: Redis | null = null;
let redisAvailable = false;
let memoryStore: MemoryTokenStore | null = null;

async function connectRedis(): Promise<void> {
  try {
    redis = new Redis(config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    await redis.connect();
    redisAvailable = true;
  } catch (err) {
    console.warn('[tokens] Redis недоступен, используется in-memory хранилище:', (err as Error).message);
    redisAvailable = false;
  }
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

function key(token: string): string {
  return `refresh:${token}`;
}

export async function saveRefreshToken(token: string, userId: string): Promise<void> {
  const ttl = config.refreshTokenTtlDays * 24 * 60 * 60;
  if (redisAvailable && redis) {
    await redis.set(key(token), userId, 'EX', ttl);
    return;
  }
  await memory().set(key(token), userId, ttl);
}

export async function resolveRefreshToken(token: string): Promise<string | null> {
  if (redisAvailable && redis) return redis.get(key(token));
  return memory().get(key(token));
}

export async function revokeRefreshToken(token: string): Promise<void> {
  if (redisAvailable && redis) {
    await redis.del(key(token));
    return;
  }
  await memory().del(key(token));
}

function memory(): MemoryTokenStore {
  if (!memoryStore) memoryStore = new MemoryTokenStore();
  return memoryStore;
}

export async function initTokenStore(): Promise<void> {
  await connectRedis();
}