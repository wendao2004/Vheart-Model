/**
	* @Description:
	* 
	* @author liuzhiheng
	* @createTime: 2026-09-13 10:12:44
	* @Copyright by wendao
	* 云函数返回结构
	*/
export type CloudResult<T> = {
	code : number;
	msg : string;
	data : T;
}

/**
	* @Description:
	* 
	* @author liuzhiheng
	* 
	* @property 成果常量
	* @event 
	* 
	* @createTime: 2026-09-13 10:14:07
	*/
export const SUCCESS_CODE = 200;