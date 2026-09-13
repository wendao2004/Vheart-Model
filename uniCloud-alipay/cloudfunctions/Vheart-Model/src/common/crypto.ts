import * as crypto from 'crypto';

/** 密码盐值（生产环境应放环境变量） */
const PASSWORD_SALT = 'vheart-model_2026';

/** token 签名密钥 */
const TOKEN_SECRET = 'vheart_model_token_secret_2026';

/** token 有效期：2 小时 */
export const TOKEN_EXPIRE_MS = 2 * 60 * 60 * 1000;

/** sha256 加密密码 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(PASSWORD_SALT + password).digest('hex');
}

/** 校验密码 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/** token payload 结构 */
export interface TokenPayload {
  userId: string;
  time: number;
  expireAt: number;
}

/** 生成 token：base64(payload).hmac_signature，payload 含 expireAt */
export function generateToken(userId: string): string {
  const payload: TokenPayload = {
    userId,
    time: Date.now(),
    expireAt: Date.now() + TOKEN_EXPIRE_MS,
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadStr).digest('hex');
  return `${payloadStr}.${signature}`;
}

/** 只解析 token payload，不验证签名（用于前端/快速读取） */
export function parseToken(token: string): TokenPayload | null {
  try {
    const [payloadStr] = token.split('.');
    return JSON.parse(Buffer.from(payloadStr, 'base64').toString()) as TokenPayload;
  } catch {
    return null;
  }
}

/** 校验 token：验证签名 + 检查过期，返回 payload 或 null */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const [payloadStr, signature] = token.split('.');
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadStr).digest('hex');
    if (signature !== expected) return null;
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64').toString()) as TokenPayload;
    if (Date.now() > payload.expireAt) return null; // 已过期
    return payload;
  } catch {
    return null;
  }
}
