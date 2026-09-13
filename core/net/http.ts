import type { CloudResult } from "../bean";
import { SUCCESS_CODE } from "../bean";

const APP_ID = 'vheart-model';

/** 请求拦截器：修改请求体（如自动携带 token） */
export type RequestInterceptor = (requestData: UTSJSONObject) => void;
/** 响应拦截器：返回 false 表示中止请求（如 401 已跳登录） */
export type ResponseInterceptor = (code: number, msg: string, action: string) => boolean;

/** 拦截器注册表 —— 符合开闭原则：新增拦截器只需 push，不改 http.ts */
export const requestInterceptors: RequestInterceptor[] = [];
export const responseInterceptors: ResponseInterceptor[] = [];

/**
 * 调用云函数
 * @param cloudFunctionName 云函数名
 * @param action 业务动作，如 'auth/login'
 * @param businessData 业务数据，会放在请求体的 data 字段中
 */
export async function callCloud<T>(
	cloudFunctionName : string,
	action : string,
	businessData ?: UTSJSONObject,
) : Promise<CloudResult<T>> {
	try {
		// 直接构造请求体，不用 Object.assign（UTS 中嵌套对象复制可能丢失）
		const requestData : UTSJSONObject = { action: action, appId: APP_ID };
		if (businessData !== null) {
			requestData['data'] = businessData;
		}

		// 执行请求拦截器（开闭原则：token、日志、埋点等都在这里注入）
for (let i = 0; i < requestInterceptors.length; i++) {
    requestInterceptors[i](requestData);
}
console.log('[callCloud] request:', JSON.stringify(requestData) as string);

		const res = await uniCloud.callFunction({
			name: cloudFunctionName,
			data: requestData
		});

		if (res.result === null) {
			throw new Error('云函数无返回');
		}

		// UTS 不支持 UTSJSONObject as CloudResult<T>，手动提取字段
		const raw = res.result as UTSJSONObject;
		const code = raw['code'] as number;
		const msg = raw['msg'] as string;
		// UTSJSONObject 直接 as T 后点号访问嵌套属性可能失效，用 JSON 序列化/反序列化转纯对象
const rawData = raw['data'];
const data = rawData != null ? (JSON.parse(JSON.stringify(rawData) as string) as T) : (null as T);
		const result : CloudResult<T> = { code: code, msg: msg, data: data };

		// 执行响应拦截器（如 401 处理）
for (let i = 0; i < responseInterceptors.length; i++) {
    if (responseInterceptors[i](code, msg, action) === false) {
        throw new Error(msg != null && msg != '' ? msg : '请求被拦截');
    }
}

if (code !== SUCCESS_CODE) {
			const errMsg = msg != null && msg != '' ? msg : '业务处理失败';
			throw new Error(errMsg);
		}

		return result;
	} catch (error) {
		console.error(`[callCloud][${cloudFunctionName}/${action}] 失败:`, error);
		throw error;
	}
}



