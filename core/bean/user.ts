/**
	* @Description:
	* 
	* @author liuzhiheng
	* 
	* @property 用户类型定义
	* @event Entity前端实体
	* 
	* @createTime: 2026-09-13 10:06:09
	*/
export type User = {
	userId : string;
	nickname : string;
	avatarUrl : string;
	phoneNumber ?: string;
	token : string;
	createTime : number;
}

/**
	* @Description:
	* 
	* @author liuzhiheng
	* @createTime: 2026-09-13 10:07:18
	* @Copyright by wendao
	* 后端DTO
	*/
export type LoginRequestDTO = {
	phoneNumber : string;
	password : string;
}

/**
	* @Description:
	* 
	* @author liuzhiheng
	* @createTime: 2026-09-13 10:08:14
	* @Copyright by wendao
	* 注册请求参数
	*/
export type RegisterRequestDTO = {
	phoneNumber : string;
	password : string;
	nickname ?: string;
}

/**
	* @Description:
	* 
	* @author liuzhiheng
	* 
	* @property 后端返回用户信息
	* @event 
	* 
	* @createTime: 2026-09-13 10:09:33
	*/
export type UserInfiDTO = {
	_id ?: string;
	account ?: string;
	nickname ?: string;
	avatarUrl ?: string;
	createTime ?: string | number;
}

/**
	* @Description:
	* 
	* @author liuzhiheng
	* @createTime: 2026-09-13 10:11:13
	* @Copyright by wendao
	* 登陆接口原始返回
	*/

export type LoginResponseDTO = {
	token : string;
	userInfo : UserInfiDTO;
}
