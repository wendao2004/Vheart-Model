import type { UserEntity, CreateUserDTO } from '../entity/user.entity';

/**
 * 用户数据访问层
 * 职责：只做数据库 CRUD，不写业务逻辑
 * 依赖：uniCloud 全局对象（云函数运行时注入）
 */
const db = uniCloud.database();
const usersCol = db.collection('vheart-model-users');

export class UserDao {
  /** 根据手机号查用户 */
  static async findByAccount(account: string): Promise<UserEntity | null> {
    const res = await usersCol.where({ account }).get();
    return res.data && res.data.length > 0 ? (res.data[0] as UserEntity) : null;
  }

  /** 根据 ID 查用户 */
  static async findById(id: string): Promise<UserEntity | null> {
    const res = await usersCol.doc(id).get();
    return res.data && res.data.length > 0 ? (res.data[0] as UserEntity) : null;
  }

  /** 创建用户，返回新用户 _id */
  static async create(user: CreateUserDTO): Promise<string> {
    const res = await usersCol.add(user);
    return res.id;
  }

  /** 更新用户信息 */
  static async update(id: string, data: Partial<UserEntity>): Promise<void> {
    await usersCol.doc(id).update(data);
  }
}

