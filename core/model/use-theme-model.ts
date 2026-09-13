import { ref, computed } from 'vue';
import { ThemeType } from '../bean/theme';
import { ThemeData } from '../data/theme-data';

/**
 * 主题 Model：全局响应式主题状态
 * 符合开闭原则：新增主题只需扩展 ThemeType 和样式，不改核心逻辑
 */
class ThemeModel {
	private _currentTheme = ref<ThemeType>(ThemeData.getTheme());

	/** 当前主题 */
	readonly currentTheme = computed((): ThemeType => {
		return this._currentTheme.value;
	});

	/** 是否深色模式 */
	readonly isDark = computed((): boolean => {
		return this._currentTheme.value == 'dark';
	});

	/** 是否浅色模式 */
	readonly isLight = computed((): boolean => {
		return this._currentTheme.value == 'light';
	});

	/** 切换主题 */
	toggleTheme(): void {
		if (this._currentTheme.value == 'dark') {
			this.setTheme('light');
		} else {
			this.setTheme('dark');
		}
	}

	/** 设置指定主题 */
	setTheme(theme: ThemeType): void {
		this._currentTheme.value = theme;
		ThemeData.saveTheme(theme);
		console.log('[ThemeModel] 主题已切换为:', theme);
	}
}

/** 全局单例 */
export const globalTheme = new ThemeModel();
