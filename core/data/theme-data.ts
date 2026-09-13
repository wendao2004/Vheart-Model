import { THEME_CACHE_KEY, ThemeType } from '../bean/theme';

/**
 * 主题数据层：本地缓存读写
 */
export class ThemeData {
	/** 读取本地主题 */
	static getTheme(): ThemeType {
		try {
			const raw = uni.getStorageSync(THEME_CACHE_KEY);
			if (raw == 'light') {
				return 'light';
			}
			return 'dark';
		} catch (error) {
			return 'dark';
		}
	}

	/** 保存主题到本地 */
	static saveTheme(theme: ThemeType): void {
		try {
			uni.setStorageSync(THEME_CACHE_KEY, theme);
		} catch (error) {
			console.error('[ThemeData] 保存主题失败:', error);
		}
	}
}
