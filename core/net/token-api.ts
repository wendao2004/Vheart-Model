import { callCloud } from "./http";
import type { CloudResult, RefreshTokenResponse } from '../bean';

/**
 * Token 网络层
 * 职责：只定义接口，不做存储/过期判断（那些在 Data 层）
 */
export class TokenApi {
	/** 刷新 token：用旧 token 换新 token */
	static refresh(oldToken: string): Promise<CloudResult<RefreshTokenResponse>> {
		const payload: UTSJSONObject = { token: oldToken };
		return callCloud<RefreshTokenResponse>('Vheart-Model', 'auth/refresh', payload);
	}
}
