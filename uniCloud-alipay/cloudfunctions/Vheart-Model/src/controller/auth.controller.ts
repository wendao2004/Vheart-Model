import { AuthService } from '../service/auth.service';
import { success, fail } from '../common/result';
import type { CloudResult } from '../common/result';
import type {
  LoginRequestDTO,
  RegisterRequestDTO,
  LoginResponseDTO,
  UserInfoDTO,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '../dto/auth.dto';

/**
 * 认证控制器
 * 职责：接收云函数 event 中的 data，做参数校验，调用 Service，包装统一响应
 * 不写业务逻辑，不直接操作数据库
 */
export class AuthController {
  /** action: 'auth/login' */
  static async login(data: any): Promise<CloudResult<LoginResponseDTO>> {
    try {
      const params = data as LoginRequestDTO;
      if (!params.phoneNumber || !params.password) {
        return fail('手机号和密码不能为空');
      }
      if (!/^1[3-9]\d{9}$/.test(params.phoneNumber)) {
        return fail('手机号格式不正确');
      }
      const result = await AuthService.login(params);
      return success(result, '登录成功');
    } catch (e: any) {
      console.error('[auth/login] error:', e);
      return fail(e.message || '登录失败');
    }
  }

  /** action: 'auth/register' */
  static async register(data: any): Promise<CloudResult<UserInfoDTO>> {
    try {
      const params = data as RegisterRequestDTO;
      if (!params.phoneNumber || !params.password) {
        return fail('手机号和密码不能为空');
      }
      if (!/^1[3-9]\d{9}$/.test(params.phoneNumber)) {
        return fail('手机号格式不正确');
      }
      if (params.password.length < 6) {
        return fail('密码至少6位');
      }
      const result = await AuthService.register(params);
      return success(result, '注册成功');
    } catch (e: any) {
      console.error('[auth/register] error:', e);
      return fail(e.message || '注册失败');
    }
  }

  /** action: 'auth/refresh' 刷新 token */
  static refresh(data: any): any {
    try {
      const params = data as RefreshTokenRequest;
      if (!params.token) {
        return fail('token 不能为空');
      }
      const result = AuthService.refreshToken(params.token);
      return success(result, '刷新成功');
    } catch (e: any) {
      console.error('[auth/refresh] error:', e);
      return fail(e.message || '刷新失败');
    }
  }
}
