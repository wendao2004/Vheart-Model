import { requestInterceptors, responseInterceptors } from '../net/http';
import { TokenApi } from '../net/token-api';
import type { StoredToken } from '../bean';

/** token 本地存储 key */
const TOKEN_KEY = 'model_token';
/** 快过期阈值：剩余时间小于 5 分钟时触发静默刷新 */
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Token 数据访问层
 * 职责：token 存取、过期判断、静默刷新、注册拦截器
 * 不做响应式状态（那是 Model 层的事）
 *
 * 符合开闭原则：通过 http.ts 的拦截器数组注入，不修改 http.ts 核心代码
 */
export class TokenData {
	/** 防并发刷新标志 */
	private static refreshing = false;

	// ========== 存取 ==========

	static getToken(): string | null {
		const raw = uni.getStorageSync(TOKEN_KEY);
		if (raw == '' || raw == null) return null;
		try {
			const stored = JSON.parse(raw as string) as UTSJSONObject;
			return stored['token'] as string;
		} catch {
			return null;
		}
	}

	static getExpireAt(): number {
		const raw = uni.getStorageSync(TOKEN_KEY);
		if (raw == '' || raw == null) return 0;
		try {
			const stored = JSON.parse(raw as string) as UTSJSONObject;
			return stored['expireAt'] as number;
		} catch {
			return 0;
		}
	}

	static setToken(token: string, expireAt: number): void {
		const stored: StoredToken = { token: token, expireAt: expireAt };
		uni.setStorageSync(TOKEN_KEY, JSON.stringify(stored) as string);
		console.log('[TokenData] token 已保存, expireAt=', expireAt);
	}

	static clearToken(): void {
		uni.removeStorageSync(TOKEN_KEY);
		console.log('[TokenData] token 已清除');
	}

	// ========== 过期判断 ==========

	/** token 是否已过期 */
	static isExpired(): boolean {
		const token = TokenData.getToken();
		const expireAt = TokenData.getExpireAt();
		console.log('[TokenData.isExpired] token=', token, 'expireAt=', expireAt, 'now=', Date.now());
		if (token == null) {
			console.log('[TokenData.isExpired] token is null, expired=true');
			return true;
		}
		const expired = Date.now() > expireAt;
		console.log('[TokenData.isExpired] expired=', expired);
		return expired;
	}

	/** token 是否快过期（剩余 < 5 分钟） */
	static isExpiring(): boolean {
		const remain = TokenData.getExpireAt() - Date.now();
		return remain > 0 && remain < REFRESH_THRESHOLD_MS;
	}

	// ========== 静默刷新 ==========

	/**
	 * 如果 token 快过期，静默刷新
	 * @returns true 表示不需要刷新或刷新成功，false 表示刷新失败
	 */
	static async refreshIfNeeded(): Promise<boolean> {
		if (!TokenData.isExpiring()) return true;
		if (TokenData.refreshing) {
			console.log('[TokenData] 正在刷新中，跳过');
			return false;
		}
		TokenData.refreshing = true;
		try {
			const oldToken = TokenData.getToken();
			if (oldToken == null) return false;
			console.log('[TokenData] token 快过期，开始刷新');
			const res = await TokenApi.refresh(oldToken);
			const dataObj = res.data as UTSJSONObject;
			const newToken = dataObj['token'] as string;
			const newExpireAt = dataObj['expireAt'] as number;
			TokenData.setToken(newToken, newExpireAt);
			console.log('[TokenData] token 刷新成功');
			return true;
		} catch (error) {
			console.error('[TokenData] token 刷新失败:', error);
			return false;
		} finally {
			TokenData.refreshing = false;
		}
	}
}

// ========== 拦截器注册（开闭原则：不修改 http.ts） ==========

/** 请求拦截器：自动携带 token */
requestInterceptors.push((requestData: UTSJSONObject) => {
	const token = TokenData.getToken();
	if (token != null && token != '') {
		requestData['token'] = token;
	}
});

/** 响应拦截器：401 未授权 → 清除 token + 跳登录页 */
responseInterceptors.push((code: number, msg: string, action: string) => {
	if (code === 401) {
		console.log('[TokenData] 401 未授权，清除 token 并跳登录');
		TokenData.clearToken();
		uni.reLaunch({ url: '/pages/login/login' });
		return false; // 中止后续处理
	}
	return true;
});

console.log('[TokenData] 拦截器已注册');


