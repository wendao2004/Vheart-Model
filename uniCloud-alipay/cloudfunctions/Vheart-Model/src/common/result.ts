/**
 * 统一响应结构 —— 对齐前端 core/bean/common.ts 的 CloudResult<T>
 */
export interface CloudResult<T = any> {
  code: number;
  msg: string;
  data: T;
}

export const SUCCESS_CODE = 200;
export const ERROR_CODE = 500;

export function success<T>(data: T, msg = 'success'): CloudResult<T> {
  return { code: SUCCESS_CODE, msg, data };
}

export function fail(msg: string, code = ERROR_CODE): CloudResult<null> {
  return { code, msg, data: null };
}
