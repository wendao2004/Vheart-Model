import { ref, computed } from 'vue';
import type { ComputedRef } from 'vue';
import { UserData } from '../data/user-data';
import { TokenData } from '../data/token-data'; // 副作用导入：注册 token 拦截器
import type { User, LoginRequestDTO, RegisterRequestDTO, UserInfiDTO } from '../bean';

class UserModel {
	private static instance : UserModel | null = null;

	private _currentUser = ref<User | null>(UserData.getLocalUser());

	// UTS watch 必须监听 ref/computed，不能监听 getter 函数
	readonly isLogin : ComputedRef<boolean>;

	private constructor() {
		this.isLogin = computed(() => {
			const user = this._currentUser.value;
			const hasUser = user != null && user.userId != '';
			const tokenValid = TokenData.isExpired() === false;
			return hasUser && tokenValid;
		});
	}

	static getInstance() : UserModel {
		if (UserModel.instance === null) {
			UserModel.instance = new UserModel();
		}
		return UserModel.instance;
	}

	get currentUser() : User | null {
		return this._currentUser.value;
	}

	async login(params : LoginRequestDTO) : Promise<User> {
		const user = await UserData.login(params);
		this._currentUser.value = user;
		return user;
	}

	async register(params : RegisterRequestDTO) : Promise<UserInfiDTO> {
		return UserData.register(params);
	}

	logout() : void {
		UserData.clearLocalUser();
		TokenData.clearToken();
		this._currentUser.value = null;
	}

	requireLogin() : User {
		if (this._currentUser.value === null) {
			throw new Error('用户未登录');
		}
		return this._currentUser.value;
	}
}

export const globalUser = UserModel.getInstance();





