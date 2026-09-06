// /utils/common.js

// 页面跳转公共方法
export function gotoPage(url) {
	uni.navigateTo({
		url: url,
		success: (res) => {
			console.log("跳转成功", res);
			console.log("跳转至", url);
		},
		fail: (err) => {
			console.log(err);
		}
	})
}

export function redirectTo(url) {
	uni.redirectTo({
		url: url,
		success: (res) => {
			console.log("跳转成功", res);
			console.log("跳转至", url);
		},
		fail: (err) => {
			console.log(err);
		}
	})
}

export function switchTab(url) {
	uni.switchTab({
		url: url,
		success: (res) => {
			console.log("跳转成功", res);
			console.log("跳转至", url);
		},
		fail: (err) => {
			console.log(err);
		}
	})
}