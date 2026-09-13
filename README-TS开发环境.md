# uniapp 云函数 TypeScript 开发环境配置指南

基于 **esbuild bundle** + `nodemon` 实现 TS 分层源码实时打包为单文件 JS，用于 uniapp 云函数开发。

> 开发时写多文件 TS（controller/service/dao/entity/dto/common 分层），上传时自动合并成单个 `dist/index.js`，云函数环境无需 node_modules。

---

## 一、环境要求

| 工具 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | **v18 ~ v20** | ⚠️ 不要用 v22+，pnpm 高版本会依赖 `node:sqlite` 导致崩溃 |
| pnpm | **v9.x** | ⚠️ 不要用 v10+，v10 要求 Node ≥ v22.13 |
| npm | 任意 | 用于全局安装 pnpm |

### 版本降级命令（如果装了高版本）

```bash
# 降级 pnpm 到 9.15.0（兼容 Node 20）
npm install -g pnpm@9.15.0 --registry=https://registry.npmmirror.com
```

---

## 二、目录结构

```
Vheart-Model/                         # 云函数根目录
├── src/
│   ├── index.ts                      # 云函数入口（action 路由）
│   ├── controller/                   # 控制层：参数校验 + 调 Service + 包装响应
│   │   └── auth.controller.ts
│   ├── service/                      # 业务层：登录/注册业务逻辑编排
│   │   └── auth.service.ts
│   ├── dao/                          # 数据层：数据库 CRUD
│   │   └── user.dao.ts
│   ├── entity/                       # 实体：数据表字段定义
│   │   └── user.entity.ts
│   ├── dto/                          # DTO：请求/响应类型
│   │   └── auth.dto.ts
│   └── common/                       # 公共工具
│       ├── result.ts                 # 统一响应 {code, msg, data}
│       └── crypto.ts                 # 密码加密 + token 生成
├── dist/
│   └── index.js                      # ⭐ 打包输出（单文件，自动生成）
├── build.js                          # esbuild 打包脚本（bundle 单文件）
├── node_modules/                     # 依赖（自动生成）
├── .pnpm-store/                      # pnpm 本地缓存（自动生成，已配 .npmrc）
├── .npmrc                            # pnpm 配置（镜像源 + store 路径）
├── package.json                      # 项目依赖与入口配置
├── tsconfig.json                     # TypeScript 编译配置（类型检查用）
├── nodemon.json                      # 文件监听配置
└── pnpm-lock.yaml                    # 依赖锁定文件
```

### 关键路径说明

- **写代码** → `src/` 下按分层创建 `.ts` 文件
- **打包输出** → `dist/index.js`（单文件，包含所有层 + 依赖）
- **uniapp 云函数入口** → `package.json` 中 `"main": "dist/index.js"`
- **根目录 `index.js`** → uniCloud 标准入口，内部 `require('./dist/index.js')`

---

## 三、配置文件详解

### 1. package.json

```json
{
  "name": "Vheart-Model",
  "main": "dist/index.js",
  "scripts": {
    "build": "node build.js",
    "dev": "nodemon"
  },
  "dependencies": {
    "esbuild-node-tsc": "^2.0.5",
    "nodemon": "^3.1.14",
    "typescript": "5.5.4"
  },
  "devDependencies": {
    "esbuild": "0.28.2"
  },
  "extensions": {
    "uni-cloud-jql": {}
  }
}
```

> `esbuild` 必须作为直接依赖安装（pnpm 依赖隔离，etsc 内部的 esbuild 顶层不可见）。

### 2. build.js（核心：esbuild bundle 单文件打包）

```js
const esbuild = require('esbuild');

esbuild.buildSync({
  entryPoints: ['src/index.ts'],
  bundle: true,          // ⭐ 关键：合并所有本地 import 到一个文件
  platform: 'node',
  format: 'cjs',
  target: 'es2017',
  minify: true,
  outfile: 'dist/index.js',
  logLevel: 'info',
});
```

- `bundle: true`：把 controller/service/dao/common 等所有本地模块合并进 `dist/index.js`
- Node 内置模块（`crypto` 等）和 uniCloud 全局变量自动不打包
- 后续新增的 npm 依赖也会自动打进 bundle（云函数环境无需 node_modules）

### 3. tsconfig.json

```json
{
  "compilerOptions": {
    "module": "CommonJS",
    "target": "ES2017",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

> tsconfig 主要用于编辑器类型提示和 IDE 检查；实际打包由 esbuild 完成（esbuild 不读 tsconfig 的编译选项）。

### 4. nodemon.json

```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "exec": "node build.js",
  "legacyWatch": true
}
```

- `watch`：监听的目录
- `ext`：监听的文件扩展名
- `exec`：文件变化时执行 `node build.js` 重新打包
- `legacyWatch`：Windows 下建议开启

### 5. .npmrc

```
registry=https://registry.npmmirror.com
store-dir=./.pnpm-store
```

- `registry`：国内镜像源，加速下载
- `store-dir`：pnpm 缓存目录，放在项目内避免系统盘权限问题

---

## 四、首次部署 / 换电脑后配置步骤

### Step 1：确认 Node 和 pnpm 版本

```bash
node --version    # 应输出 v18.x 或 v20.x
pnpm --version    # 应输出 9.x.x
```

如果 pnpm 版本不对：
```bash
npm install -g pnpm@9.15.0 --registry=https://registry.npmmirror.com
```

### Step 2：进入云函数目录

```bash
cd uniCloud-alipay/cloudfunctions/Vheart-Model
```

### Step 3：安装依赖

```bash
pnpm install
```

> 如果报 `EPERM: operation not permitted, mkdir 'D:\.pnpm-store'`，确认 `.npmrc` 中已配置 `store-dir=./.pnpm-store`。

### Step 4：验证打包

```bash
node build.js
```

成功后应输出：
```
dist/index.js  3.2kb
Done in 6ms
[build] dist/index.js generated (single bundle)
```

且 `dist/` 目录下**只有一个 `index.js`**（不是分散的多文件）。

---

## 五、日常使用

### 开发模式（推荐：文件保存自动打包）

```bash
pnpm dev
# 等价于
npx nodemon
```

启动后输出：
```
[nodemon] watching path(s): src\**\*
[nodemon] starting `node build.js`
dist/index.js  3.2kb
Done in 6ms
[build] dist/index.js generated (single bundle)
[nodemon] clean exit - waiting for changes before restart
```

修改 `src/` 下任意 `.ts` 文件保存后，自动触发重新打包。

> ⚡ 启动命令和之前 etsc 版本完全一样（`npx nodemon` / `pnpm dev`），只是内部从多文件编译变成了单文件打包。

### 单次打包

```bash
pnpm build
# 等价于
node build.js
```

### 上传云函数

1. 确保 `dist/index.js` 已最新打包
2. 在 HBuilderX 中右键云函数目录 `Vheart-Model` → 「上传部署」
3. uniapp 会根据 `package.json` 的 `"main": "dist/index.js"` 找到入口
4. 上传的是单文件 `dist/index.js`，云函数端无需安装依赖

---

## 六、分层架构说明

```
index.ts（入口）
    ↓ 解析 action 路由
controller/（控制层）—— 参数校验、调 Service、包装统一响应
    ↓
service/（业务层）—— 业务逻辑编排、密码校验、token 生成
    ↓
dao/（数据层）—— 数据库 CRUD，不写业务逻辑
    ↓
entity/（实体）—— 数据表字段定义
dto/（数据传输对象）—— 请求/响应类型，对齐前端
common/（公共工具）—— result 响应封装、crypto 加密
```

**依赖方向**：index → controller → service → dao → 数据库，每一层只依赖下一层，符合开闭原则。新增业务（如忘记密码）只需加 controller 方法 + service 方法，不动现有代码。

---

## 七、常见问题排查

### ❌ 问题1：`Error [ERR_UNKNOWN_BUILTIN_MODULE]: No such built-in module: node:sqlite`

**原因**：pnpm 版本过高（v10+），要求 Node ≥ v22.13。

**解决**：
```bash
npm install -g pnpm@9.15.0 --registry=https://registry.npmmirror.com
```

---

### ❌ 问题2：`ERROR packages field missing or empty`

**原因**：项目根目录有 `pnpm-workspace.yaml`，但内容不是有效的 workspace 配置。

**解决**：删除 `pnpm-workspace.yaml`（单云函数项目不需要 workspace）。

---

### ❌ 问题3：`EPERM: operation not permitted, mkdir 'D:\.pnpm-store\v3'`

**原因**：pnpm 默认把 store 放在系统盘根目录，当前用户无写入权限。

**解决**：在项目根目录创建 `.npmrc`：
```
store-dir=./.pnpm-store
```

---

### ❌ 问题4：`Error: Cannot find module 'esbuild'`

**原因**：pnpm 依赖隔离，esbuild 只作为 etsc 的间接依赖存在，顶层 `require('esbuild')` 找不到。

**解决**：
```bash
pnpm add -D esbuild
```

---

### ❌ 问题5：打包后 dist 下还是多个文件

**原因**：用了 etsc 多文件编译，没有用 build.js 的 bundle 模式。

**解决**：确认 `nodemon.json` 的 `exec` 是 `node build.js`，不是 `etsc`。删除旧的 `dist/` 目录后重新 `node build.js`。

---

### ❌ 问题6：删除 node_modules 时「访问被拒绝」

**原因**：pnpm 的 node_modules 使用硬链接/符号链接，PowerShell 的 `Remove-Item` 处理不好。

**解决**：用 cmd 的 `rmdir`：
```bash
cmd /c "rmdir /s /q node_modules"
```

---

## 八、新增云函数

如果需要新增另一个云函数（如 `user-center`），步骤：

1. 在 `cloudfunctions/` 下新建 `user-center/` 目录
2. 复制以下文件到新目录：`package.json`、`tsconfig.json`、`build.js`、`nodemon.json`、`.npmrc`、根目录 `index.js`
3. 修改 `package.json` 的 `name` 为 `user-center`
4. 创建 `src/index.ts` 和分层目录写业务代码
5. 在新目录下执行 `pnpm install` + `pnpm dev`

> 每个云函数是独立的 npm 项目，需要单独安装依赖和启动监听。

---

## 九、依赖版本锁定清单（已验证可用）

| 包 | 版本 | 说明 |
|----|------|------|
| Node.js | 20.20.2 | 运行时 |
| pnpm | 9.15.0 | 包管理器 |
| esbuild | 0.28.2 | ⭐ 打包工具（直接依赖，bundle 单文件） |
| esbuild-node-tsc | 2.0.5 | 保留（不再用于构建，可移除） |
| nodemon | 3.1.14 | 文件监听 |
| typescript | 5.5.4 | 类型检查 / IDE 提示 |

> `esbuild-node-tsc` 和 `etsc.config.js` 在 bundle 模式下已不再使用，可从依赖中移除。保留不影响功能。
