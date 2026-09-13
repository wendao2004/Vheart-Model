/** token payload（对齐后端 common/crypto.ts TokenPayload） */
export type TokenPayload = {
	userId: string;
	time: number;
	expireAt: number;
}

/** 刷新 token 请求 */
export type RefreshTokenRequest = {
	token: string;
}

/** 刷新 token 响应 */
export type RefreshTokenResponse = {
	token: string;
	expireAt: number;
}

/** 本地存储的 token 结构 */
export type StoredToken = {
	token: string;
	expireAt: number;
}
