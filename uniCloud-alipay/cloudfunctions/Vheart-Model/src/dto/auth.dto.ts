/**
 * 认证相关 DTO —— 字段对齐前端 core/bean/user.ts
 */

/** 登录请求 */
export interface LoginRequestDTO {
  phoneNumber: string;
  password: string;
}

/** 注册请求 */
export interface RegisterRequestDTO {
  phoneNumber: string;
  password: string;
  nickname?: string;
}

/** 用户信息（返回给前端，注意拼写 UserInfi 与前端一致） */
export interface UserInfoDTO {
  _id?: string;
  account?: string;
  nickname?: string;
  avatarUrl?: string;
  createTime?: string | number;
}

/** 登录响应 */
export interface LoginResponseDTO {
  token: string;
  expireAt: number;
  userInfo: UserInfoDTO;
}

/** 刷新 token 请求 */
export interface RefreshTokenRequest {
  token: string;
}

/** 刷新 token 响应 */
export interface RefreshTokenResponse {
  token: string;
  expireAt: number;
}

