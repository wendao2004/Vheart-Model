import { AuthApi } from '../net';
import { TokenData } from './token-data';
import { UserMapper } from './mapper/user-mapper';
import { CacheKeys } from './cache-keys';
import type { User, LoginRequestDTO, RegisterRequestDTO, UserInfiDTO } from '../bean';

/** 登录有效期：7天 */
const LOGIN_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000;

/** 本地存储的用户结构（带登录时间）—— UTS 必须用 type，不能用 interface */
type StoredUser = {
	userId : string;
	nickname : string;
	avatarUrl : string;
	phoneNumber ?: string;
	token : string;
	createTime : number;
	loginTime : number;
}

/**
 * 用户数据访问层
 * 职责：调用 Net 拿数据 → Mapper 转换 → 读写本地缓存
 * 不做响应式状态，不做页面跳转，不弹 Toast
 */
export class UserData {
	// ========== 本地存储 ==========

	/** 保存用户到本地 */
	static saveLocalUser(user : User) : void {
		try {
			const stored : StoredUser = {
				userId: user.userId,
				nickname: user.nickname,
				avatarUrl: user.avatarUrl,
				phoneNumber: user.phoneNumber,
				token: user.token,
				createTime: user.createTime,
				loginTime: Date.now()
			};
			uni.setStorageSync(CacheKeys.CURRENT_USER, JSON.stringify(stored) as string);
		} catch (error) {
			console.error('[UserData] 保存用户失败:', error);
		}
	}

	/** 读取本地用户（含有效期校验） */
	static getLocalUser() : User | null {
		try {
			const raw = uni.getStorageSync(CacheKeys.CURRENT_USER);
			if (raw == '' || raw == null) {
				return null;
			}

			const stored = JSON.parse(raw as string) as UTSJSONObject;

			// 有效期校验
			if (Date.now() - (stored['loginTime'] as number) > LOGIN_VALIDITY_MS) {
				console.log('[UserData] 登录已过期');
				UserData.clearLocalUser();
				return null;
			}

			// 手动剥离 loginTime，返回纯 User（UTS 不支持 ...rest 解构）
			const user : User = {
				userId: (stored['userId'] as string),
				nickname: (stored['nickname'] as string),
				avatarUrl: (stored['avatarUrl'] as string),
				phoneNumber: (stored['phoneNumber'] as string),
				token: (stored['token'] as string),
				createTime: (stored['createTime'] as number)
			};
			return user;
		} catch (error) {
			console.error('[UserData] 读取用户失败:', error);
			return null;
		}
	}

	/** 清除本地用户 */
	static clearLocalUser() : void {
		try {
			uni.removeStorageSync(CacheKeys.CURRENT_USER);
		} catch (error) {
			console.error('[UserData] 清除用户失败:', error);
		}
	}

	// ========== 网络请求 ==========

	/**
	 * 登录
	 * 流程：调 Net → 拿 DTO → Mapper 转 Entity → 存本地 → 返回 Entity
	 */
	static async login(params : LoginRequestDTO) : Promise<User> {
		console.log('[UserData.login] 请求参数=', JSON.stringify(params));
		const res = await AuthApi.login(params);
		console.log('[UserData.login] 后端返回=', JSON.stringify(res));
		// UTSJSONObject 必须用 ['key'] 访问嵌套属性，不能用点号
const dataObj = res.data as UTSJSONObject;
const userInfo = dataObj['userInfo'] as UTSJSONObject;
const token = dataObj['token'] as string;
		const expireAt = dataObj['expireAt'] as number;
console.log('[UserData.login] userInfo=', JSON.stringify(userInfo), 'token=', token);
const user = UserMapper.fromUserInfoDTO(userInfo, token);
		console.log('[UserData.login] Mapper转换后=', JSON.stringify(user));
		UserData.saveLocalUser(user);
		console.log('[UserData.login] 已存本地, userId=', user.userId);
		TokenData.setToken(token, expireAt);
		return user;
	}

	/** 注册 */
	static async register(params : RegisterRequestDTO) : Promise<UserInfiDTO> {
		const res = await AuthApi.register(params);
		return res.data;
	}
}










