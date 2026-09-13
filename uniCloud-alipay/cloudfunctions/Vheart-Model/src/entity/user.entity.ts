/**
 * users 表实体 —— 对应 uniCloud 数据库 users 集合
 * 
 * 建表字段：
 * - _id: 自动生成
 * - account: 手机号（唯一索引）
 * - password: sha256 加密后的密码
 * - nickname: 昵称
 * - avatarUrl: 头像
 * - createTime: 注册时间戳
 */
export interface UserEntity {
  _id: string;
  account: string;
  password: string;
  nickname: string;
  avatarUrl: string;
  createTime: number;
}

/** 创建用户时不需要 _id */
export type CreateUserDTO = Omit<UserEntity, '_id'>;
