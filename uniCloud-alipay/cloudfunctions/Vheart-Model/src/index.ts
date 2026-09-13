import { AuthController } from './controller/auth.controller';
import { fail } from './common/result';
import type { CloudResult } from './common/result';

/**
 * 云函数入口
 * 
 * 前端调用格式（对齐 core/net/http.ts）：
 * {
 *   action: 'auth/login' | 'auth/register',
 *   appId: 'vheart-model',
 *   data: { phoneNumber, password }
 * }
 * 
 * 返回格式：
 * { code: 200, msg: 'success', data: {...} }
 */
exports.main = async (event: any, context: any): Promise<CloudResult> => {
  const { action, data } = event;

  console.log('[Vheart-Model] event:', JSON.stringify(event));
  console.log('[Vheart-Model] action:', action, 'data:', JSON.stringify(data));

  try {
    switch (action) {
      case 'auth/login':
        return await AuthController.login(data);
      case 'auth/register':
        return await AuthController.register(data);
      case 'auth/refresh':
        return AuthController.refresh(data);
      default:
        return fail(`未知 action: ${action}`);
    }
  } catch (e: any) {
    console.error('[Vheart-Model] uncaught error:', e);
    return fail(e.message || '服务器内部错误');
  }
};


