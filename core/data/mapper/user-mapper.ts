import type { User } from "../../bean";

/**
  * @Description: 后端DTO转换为前端Entity
  * @author liuzhiheng
  * @createTime 2026-09-13 10:29:52
  * 
  * 注意：从云函数返回的嵌套对象运行时是 UTSJSONObject，必须用 ['key'] 访问，不能用点号
  */
export class UserMapper {
	static fromUserInfoDTO(dto : UTSJSONObject, token : string) : User {
		const account = dto['account'] as string;
		const id = dto['_id'] as string;
		const nickname = dto['nickname'] as string;
		const avatarUrl = dto['avatarUrl'] as string;
		const createTime = dto['createTime'] as number;

		const finalUserId = id != null && id != '' ? id : (account != null ? account : '');
		const finalNickname = nickname != null && nickname != '' ? nickname : (account != null ? `用户${account}` : '用户');
		const finalAvatar = avatarUrl != null ? avatarUrl : '';
		const finalCreateTime = createTime != null ? createTime : Date.now();

		return {
			userId: finalUserId,
			nickname: finalNickname,
			avatarUrl: finalAvatar,
			phoneNumber: account,
			createTime: finalCreateTime,
			token: token
		};
	}
}
