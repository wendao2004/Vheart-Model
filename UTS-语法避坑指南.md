# UTS (uni-app x) 语法避坑指南

> 基于 Vheart-Model 项目实战编译错误整理。每一条都是踩过的坑，附错误信息、原因、正确/错误写法对比。

---

## 一、CSS 限制（uvue 样式）

### 1. font-weight 只支持特定值
- **错误**：`font-weight: 800;`
- **报错**：`property value '800' is not supported for font-weight`
- **支持值**：`normal` | `bold` | `400` | `500` | `600` | `700`
- **正确**：`font-weight: 700;`

### 2. display 只支持 flex / none
- **错误**：`display: block;`
- **报错**：`property value 'block' is not supported for display`
- **支持值**：`flex` | `none`
- **正确**：删除 `display: block`（uvue 默认就是块级布局），或用 `display: flex`

### 3. 不支持 aspect-ratio
- **错误**：`aspect-ratio: 1;`

### 3.5 uvue 不支持标签选择器，只支持 class 选择器
- **错误**：App.uvue 里写 page { background-color: #0c121e; }
- **报错**：Selector 'page' is not supported. uvue only support classname selector
- **正确**：给每个页面根元素加统一 class（如 class="page"），App.uvue 里写 .page { background-color: #0c121e; }
- **应用场景**：设置全局页面背景色，防止切换页面时白屏闪烁
- **报错**：`WARNING: aspect-ratio is not a standard property name`
- **正确**：用固定 `height` 代替

---

## 二、类型系统

### 4. 一律用 type，不用 interface
- **错误**：`export interface User { name: string }` 然后 `const u: User = { name: 'x' }`
- **报错**：`Object literals only support object types defined by construction type, and do not support interfaces`
- **报错**：`Interface 'interface XXX' does not have constructors`（as 断言时）
- **原因**：UTS 的 interface 编译成 Kotlin interface，没有构造函数，不能实例化也不能 `as` 断言
- **正确**：所有业务类型统一用 `type`
  ```typescript
  export type User = {
      userId: string;
      nickname: string;
  }
  ```

### 5. 动态对象用 UTSJSONObject，不用 Record / any
- **错误**：`const obj: Record<string, unknown> = { a: 1 }`

- **补充：JSON.parse() 返回的也是 UTSJSONObject**
  - **错误**：const stored = JSON.parse(raw) as StoredUser; stored.userId
  - **报错**：ClassCastException: UTSJSONObject cannot be cast to StoredUser（运行时，应用重启读取本地缓存时）
  - **正确**：const stored = JSON.parse(raw) as UTSJSONObject; stored['userId'] as string
  - **影响**：登录态持久化失败——getLocalUser() 抛异常返回 null，isLogin=false，每次打开 App 都要重新登录
  - **排查线索**：控制台有 [UserData] 读取用户失败: ClassCastException，但 currentUser 显示 null

- **补充：UTSJSONObject 不能直接 as 成自定义 type**
  - **错误**：const result = res.result as CloudResult<T>
  - **报错**：ClassCastException: UTSJSONObject cannot be cast to CloudResult
  - **正确**：手动提取每个字段构造对象
    `	ypescript
    const raw = res.result as UTSJSONObject;
    const result: CloudResult<T> = {
        code: raw['code'] as number,
        msg: raw['msg'] as string,
        data: raw['data'] as T,
    };
    `
- **补充：嵌套属性必须用 ['key'] 访问，不能用点号**（详见 12.6）
- **报错**：`Cannot create an instance of an abstract class`
- **错误**：`Object.assign(requestData, data)` 其中 data 是 `any`
- **报错**：`参数类型不匹配：实际类型为 'Any'，预期类型为 'IUTSObject'`
- **正确**：
  ```typescript
  const requestData: UTSJSONObject = { action: action, appId: APP_ID };
  if (data !== null) {
      Object.assign(requestData, data);
  }
  ```

### 6. ref / reactive 必须加显式泛型
- **错误**：`const list = ref([{ id: 1, url: '/a.png' }])` 然后模板 `img.url`
- **报错**：`找不到名称"url"`（v-for 中元素属性推断失败）
- **原因**：UTS 对数组元素类型推断能力弱
- **正确**：
  ```typescript
  type ImageItem = { id: number; url: string }
  const imageList = ref<ImageItem[]>([
      { id: 1, url: '/static/logo.png' }
  ])
  ```

### 7. 对象字面量传参必须 as 断言
- **错误**：`await globalUser.login({ phoneNumber: '138...', password: '123' })`
- **报错**：`参数类型不匹配：实际类型为 'UTSJSONObject'，预期类型为 'LoginRequestDTO'`
- **原因**：对象字面量默认推断为 UTSJSONObject，不会自动匹配具体 type
- **正确**：
  ```typescript
  await globalUser.login({
      phoneNumber: form.phoneNumber,
      password: form.password,
  } as LoginRequestDTO)
  ```

### 8. 常量对象属性也要显式类型
- **错误**：`export const CacheKeys = { CURRENT_USER: 'model_current_user' }` 然后 `uni.getStorageSync(CacheKeys.CURRENT_USER)`
- **报错**：`参数类型不匹配：实际类型为 'Any?'，预期类型为 'String'`
- **正确**：
  ```typescript
  type CacheKeyType = { CURRENT_USER: string }
  export const CacheKeys: CacheKeyType = {
      CURRENT_USER: 'model_current_user'
  }
  ```

---

## 三、运算符与条件判断

### 9. 没有 undefined，只有 null
- **错误**：`if (data !== undefined)`、`obj === undefined`
- **报错**：`找不到名称"undefined"`
- **原因**：UTS 编译到 Kotlin，没有 undefined 概念，可选参数/字段默认值是 null
- **正确**：所有空值判断只用 `=== null` / `!== null`
  ```typescript
  if (data !== null) { ... }
  const name = dto.nickname !== null ? dto.nickname : ''
  ```

### 10. if 条件必须是严格 boolean
- **错误**：`if (!form.password)`、`if (user && user.name)`
- **报错**：`Conditional statements must use boolean types`
- **原因**：UTS 不做 truthy/falsy 隐式转换
- **正确**：
  ```typescript
  if (form.password === '' || form.password === null) { ... }
  if (user !== null && user.userId !== '') { ... }
  ```

### 11. || / && 操作数必须是 boolean
- **错误**：`const name = dto.nickname || '默认名'`
- **报错**：`Conditional statements must use boolean types`
- **正确**：
  ```typescript
  const name = dto.nickname !== null && dto.nickname !== '' ? dto.nickname : '默认名'
  ```

### 12. script 中没有 ! 逻辑非操作符
- **错误**：`if (!loggedIn) { ... }`
- **报错**：`找不到名称"not"`（UTS 把 ! 编译成 Kotlin 的 not() 函数调用，但不存在）
- **注意**：模板里的 `!isLoginMode` 可以用（Vue 模板编译器处理），但 `<script>` 里不行
- **正确**：
  ```typescript
  if (loggedIn === false) { ... }
  if (user === null) { ... }
  ```

---

## 四、函数与类


### 12.5 字符串比较用 == / !=，不要用 === / !==
- **错误**：`if (password !== confirmPassword)` 两个值都是 "123456" 却返回 true
- **原因**：UTS 编译到 Kotlin，`===`/`!==` 是**引用比较**（对应 Kotlin 的 ===），两个内容相同的字符串是不同对象实例；`==`/`!=` 才是**值比较**（对应 Kotlin 的 ==，调用 equals()）
- **正确**：`if (password != confirmPassword)`
- **注意**：number、boolean 等基本类型不受影响（Kotlin 中基本类型 === 和 == 行为相同）；和 `null` 比较也不受影响


### 12.6 云函数返回的嵌套对象必须用 ['key'] 访问，不能用点号
- **现象**：`JSON.stringify(res.data)` 能打印完整结构，但 `res.data.userInfo` 报错，error.message 为空
- **原因**：`uniCloud.callFunction` 返回的 `res.result` 是 `UTSJSONObject`，`JSON.parse()` 返回的也是 `UTSJSONObject`；`as T` 只是编译期类型断言，运行时仍是 UTSJSONObject，点号 `.key` 访问嵌套属性不生效
- **正确**：`const dataObj = res.data as UTSJSONObject; const userInfo = dataObj['userInfo'] as UTSJSONObject;`
- **最佳实践**：Mapper 层接收 UTSJSONObject，用 `['key']` 读取所有字段，输出对象字面量构造的纯 Entity，后续业务层正常点号访问
- **注意**：扁平结构（如注册返回的 UserInfiDTO）如果不访问子属性，直接 `as T` 不会报错；一旦需要 `.xxx` 就必须用 `['xxx']`

### 13. 业务层用 class + static，不用 const 对象字面量
- **错误**：
  ```typescript
  export const UserData = {
      save() { this.clear() },  // this 不生效
      clear() { ... }
  }
  ```
- **报错**：`'this' is not defined in this context`、`找不到名称"clearLocalUser"`
- **原因**：对象字面量方法中的 this 在 UTS 中不指向对象本身
- **正确**：
  ```typescript
  export class UserData {
      static save(user: User): void {
          UserData.clear()  // static 方法内用类名引用自身
      }
      static clear(): void { ... }
  }
  ```

### 14. 可选参数调用时可能仍需传值
- **错误**：`callCloud<T>('fn', 'action', { data: params })`（extra 是可选参数但没传）
- **报错**：`No value passed for parameter 'extra'`
- **正确**：显式传 `null`
  ```typescript
  callCloud<T>('fn', 'action', { data: params }, null)
  ```

### 15. 对象属性简写可能被误判
- **错误**：`{ action, appId: APP_ID }`（action 是变量名简写）
- **报错**：`Named arguments are prohibited for non-Kotlin functions`
- **正确**：写全 `{ action: action, appId: APP_ID }`

---

## 五、内置 API 差异

### 16. watch 必须监听 ref/computed，不能监听 getter
- **错误**：`watch(() => globalUser.isLogin, (val) => {...})`
- **报错**：`Return type mismatch: expected 'Function', actual 'Boolean'`
- **原因**：UTS 的 watch 第一个参数必须是 Ref 类型，不支持 `() => value` getter 函数
- **正确**：
  ```typescript
  // model 层用 computed
  readonly isLogin: ComputedRef<boolean>
  // 页面直接传 ref
  watch(globalUser.isLogin, (loggedIn: boolean) => { ... })
  ```

### 17. watch 回调参数必须显式类型
- **错误**：`watch(ref, (val) => {...})`
- **报错**：`Cannot infer type for this parameter. Specify it explicitly.`
- **正确**：`watch(globalUser.isLogin, (loggedIn: boolean) => {...})`

### 18. Number() 不能调用（抽象类）
- **错误**：`const ts = Number(dto.createTime)`
- **报错**：`Cannot create an instance of an abstract class`、`Too many arguments for 'constructor(): Number'`
- **正确**：`parseInt(dto.createTime.toString())`

### 19. Date 构造函数不接受联合类型
- **错误**：`new Date(dto.createTime).getTime()` 其中 createTime 是 `string | number`

- **补充：联合类型(string|number)上不能调方法**
  - **错误**：dto.createTime.toString() 其中 createTime 是 string | number
  - **现象**：运行时崩溃，error.message 为空（UTS 内部异常）
  - **正确**：先断言为具体类型再调方法，或直接断言
    `	ypescript
    const createTime = dto.createTime != null ? (dto.createTime as number) : Date.now();
    `
- **报错**：`None of the following candidates is applicable`、`找不到名称"getTime"`
- **正确**：避开 Date，直接用 parseInt 转时间戳
  ```typescript
  const createTime = dto.createTime !== null ? parseInt(dto.createTime.toString()) : Date.now()
  ```

### 20. JSON.stringify 返回 Any?，需断言
- **错误**：`uni.setStorageSync(key, JSON.stringify(obj))`
- **报错**：`参数类型不匹配：实际类型为 'Any?'，预期类型为 'String'`
- **正确**：`uni.setStorageSync(key, JSON.stringify(obj) as string)`

### 21. 不支持 ... 展开运算符
- **错误**：`const stored = { ...user, loginTime: Date.now() }`

### 21.5 catch 中只能用 error.message，不能用 error.name
- **错误**：console.log(error.name)
- **报错**：找不到名称"name"
- **原因**：UTS 中 catch 的 error 类型虽然声明为 any，但运行时是 Kotlin 异常对象，只有 message 属性可访问
- **正确**：console.log('失败:', error.message)
- **注意**：UTS 内部异常（如联合类型调方法、UTSJSONObject 点号访问）的 error.message 可能为空字符串，需要在关键节点加 console.log 定位
- **正确**：手动构造每个字段
  ```typescript
  const stored: StoredUser = {
      userId: user.userId,
      nickname: user.nickname,
      // ... 每个字段手动写
      loginTime: Date.now()
  }
  ```

---

## 六、模块与导入

### 22. uvue 不能 import .js 文件
- **错误**：`import { showToast } from '../../utils/utils.js'`

### 22.5 不能用 export type 重新导出，必须用 export *
- **错误**：export type { TokenPayload } from './token';
- **报错**：ailed to resolve ./token from index.uts（编译时找不到模块）
- **原因**：UTS 编译器对 export type 重新导出的解析有问题
- **正确**：export * from './token';（和其他模块保持一致）
- **报错**：`failed to resolve ... utils.js ... index not found`
- **正确**：创建 `.uts` 版本，import 时写 `.uts` 后缀
  ```typescript
  import { showToast } from '../../utils/utils.uts'
  ```
- 或者直接用 `uni.` 原生 API，不封装

---

## 七、模板语法

### 23. :key 优先用 index，不用对象属性
- **错误**：`<view v-for="(img, i) in list" :key="img.id">`
- **报错**：`找不到名称"id"`（类型推断失败时）
- **正确**：`:key="index"`

### 24. v-for 第二个参数是索引，不是元素属性
- **错误**：`<view v-for="(n, title) in list">{{ n.title }}</view>`（title 实际是索引 number）
- **正确**：`<view v-for="(item, index) in list" :key="index">{{ item.title }}</view>`

### 25. v-if 动态创建的元素上 v-model 绑定可能不稳定
- **现象**：注册确认密码框用 v-if 控制显隐，输入相同密码却提示"两次密码不一致"
- **原因**：UTS 中 v-if 条件渲染的 input 组件被销毁/重建时，v-model 绑定可能丢失或延迟
- **正确**：用 v-show 代替 v-if（元素始终存在，只控制显隐）
  `html
  <!-- 错误 -->
  <input v-if="isRegister" v-model="confirmPassword" />
  <!-- 正确 -->
  <input v-show="isRegister" v-model="confirmPassword" />
  `

### 26. uvue 页面用 onMounted 代替 onLoad
- **现象**：login 页 onLoad 里写自动跳转逻辑，应用重启后不执行，依旧停在登录页
- **原因**：uvue 编译到原生，uni-app 的页面生命周期 onLoad/onShow 可能不触发（或需要特殊导入）
- **正确**：用 Vue 的 onMounted（从 'vue' 导入，已在 app-tab-bar、index 等组件验证可用）
  `	ypescript
  import { onMounted } from 'vue';
  onMounted(() => {
      if (globalUser.isLogin.value === true) {
          uni.reLaunch({ url: '/pages/index/index' });
      }
  });
  `

---

## 八、速查表

| 场景 | 错误写法 | 正确写法 |
|---|---|---|
| 类型定义 | `interface User {}` | `type User = {}` |
| 动态对象 | `Record<string, unknown>` | `UTSJSONObject` |
| 空值判断 | `=== undefined` | `=== null` |
| 条件判断 | `if (!str)` | `if (str === '' \|\| str === null)` |
| 默认值 | `x \|\| 'default'` | `x !== null && x !== '' ? x : 'default'` |
| 逻辑非(script) | `if (!bool)` | `if (bool === false)` |
| 数字转换 | `Number(x)` | `parseInt(x.toString())` |
| 日期转时间戳 | `new Date(x).getTime()` | `parseInt(x.toString())` |
| 对象合并 | `{...a, ...b}` | `Object.assign(a, b)` |
| 业务层组织 | `const X = { method() {} }` | `class X { static method() {} }` |
| watch 源 | `watch(() => x, cb)` | `watch(xRef, cb)` |
| watch 回调 | `(val) => {}` | `(val: boolean) => {}` |
| 传参对象 | `fn({a: 1})` | `fn({a: 1} as Type)` |
| ref 数组 | `ref([{...}])` | `ref<Item[]>([{...}])` |
| 导入工具 | `import x from 'a.js'` | `import x from 'a.uts'` 或用 uni 原生 |
| 字符串比较 | password !== confirm | password != confirm |
| 嵌套对象访问 | es.data.userInfo | (res.data as UTSJSONObject)['userInfo'] |
| 动态对象转 type | aw as CloudResult | 手动提取字段构造 |
| 联合类型调方法 | (str\|num).toString() | (x as number) 先断言 |
| catch 异常属性 | error.name | error.message |
| 动态 input 显隐 | -if + -model | -show + -model |
| 全局背景色 | page {} | .page {}（class 选择器） |
| JSON.parse 取值 | JSON.parse(x) as Type | JSON.parse(x) as UTSJSONObject + ['key'] |
| 重新导出类型 | export type { X } from | export * from |
| 页面初始化 | onLoad() | onMounted() |
| font-weight | `800` | `700` |
| display | `block` | 删除或 `flex` |
| 宽高比 | `aspect-ratio: 1` | 固定 height |

---

## 九、调试流程建议

1. **编译报错先看文件名和行号**，对照本指南查对应规则
2. **类型相关错误**（参数不匹配、找不到名称）→ 先检查是否缺显式类型/泛型/as 断言
3. **条件相关错误**（must use boolean）→ 检查是否有 `!`、`||`、`&&` 非布尔操作数
4. **运行时崩溃**→ 检查是否用了 `undefined`、`...展开`、`this`（对象字面量中）
5. **改完一个文件重新编译**，UTS 错误会连锁（一个错可能导致后面一片报错），优先修第一个




