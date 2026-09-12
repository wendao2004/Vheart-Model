# uniapp 云函数 TypeScript 开发环境配置指南

基于 `esbuild-node-tsc` + `nodemon` 实现 TS 实时编译为 JS，用于 uniapp 云函数开发。

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
Vheat-Model/                          # 云函数根目录
├── src/
│   └── index.ts                      # TS 源码入口（写代码在这里）
├── dist/
│   └── index.js                      # 编译输出（自动生成，不要手动改）
├── node_modules/                     # 依赖（自动生成）
├── .pnpm-store/                      # pnpm 本地缓存（自动生成，已配 .npmrc）
├── .npmrc                            # pnpm 配置（镜像源 + store 路径）
├── package.json                      # 项目依赖与入口配置
├── tsconfig.json                     # TypeScript 编译配置
├── etsc.config.js                    # esbuild-node-tsc 配置（v2 格式）
├── nodemon.json                      # 文件监听配置
└── pnpm-lock.yaml                    # 依赖锁定文件
```

### 关键路径说明

- **写代码** → `src/index.ts`（或 `src/` 下任意 `.ts` 文件）
- **编译输出** → `dist/index.js`
- **uniapp 云函数入口** → `package.json` 中 `"main": "dist/index.js"`

---

## 三、配置文件详解

### 1. package.json

```json
{
  "name": "api-main",
  "main": "dist/index.js",
  "dependencies": {
    "esbuild-node-tsc": "^2.0.5",
    "nodemon": "^3.1.14",
    "typescript": "5.5.4"
  },
  "extensions": {
    "uni-cloud-jql": {}
  }
}
```

> ⚠️ **TypeScript 必须锁定 5.x**，7.x 版本的 `ts.sys.fileExists` API 变更会导致 etsc 崩溃。

### 2. tsconfig.json

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

- `outDir`：编译输出目录，必须和 `etsc.config.js` 一致
- `rootDir`：源码根目录，决定输出时是否保留子目录结构
- `include`：只编译 `src/` 下的文件

### 3. etsc.config.js（v2 格式，必须是 .js 后缀）

```js
module.exports = {
  esbuild: {
    outdir: "./dist",
    minify: true,
    target: "es2017",
    platform: "node",
    format: "cjs"
  }
};
```

> ⚠️ **v1 与 v2 格式不兼容**：v1 用 `outDir`（大写 D）+ `include`/`exclude`/`preserveModules` 顶层字段；v2 全部放在 `esbuild` 对象内，且 `outdir` 是小写。文件名必须是 `.js`（内容是 `module.exports`），不能叫 `.json`。

### 4. nodemon.json

```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "exec": "etsc --config etsc.config.js",
  "legacyWatch": true
}
```

- `watch`：监听的目录
- `ext`：监听的文件扩展名
- `exec`：文件变化时执行的命令
- `legacyWatch`：Windows 下建议开启，避免某些文件系统事件不触发

### 5. .npmrc

```
registry=https://registry.npmmirror.com
store-dir=./.pnpm-store
```

- `registry`：国内镜像源，加速下载
- `store-dir`：pnpm 缓存目录，放在项目内避免沙箱/权限问题（默认在系统盘根目录可能无权限）

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
cd uniCloud-alipay/cloudfunctions/Vheat-Model
```

### Step 3：安装依赖

```bash
pnpm install
```

> 如果报 `EPERM: operation not permitted, mkdir 'D:\.pnpm-store'`，确认 `.npmrc` 中已配置 `store-dir=./.pnpm-store`。

### Step 4：验证编译

```bash
npx etsc --config etsc.config.js
```

成功后应输出 `Built in: xxxms`，且 `dist/index.js` 已生成。

---

## 五、日常使用

### 开发模式（推荐：文件保存自动编译）

```bash
npx nodemon
```

或在 `package.json` 中添加脚本后用 `pnpm dev`：
```json
{
  "scripts": {
    "dev": "nodemon",
    "build": "etsc --config etsc.config.js"
  }
}
```

启动后输出：
```
[nodemon] watching path(s): src\**\*
[nodemon] starting `etsc --config etsc.config.js`
Built in: 320.003ms
[nodemon] clean exit - waiting for changes before restart
```

修改 `src/` 下任意 `.ts` 文件保存后，自动触发重新编译。

### 单次编译

```bash
npx etsc --config etsc.config.js
```

### 上传云函数

1. 确保 `dist/index.js` 已最新编译
2. 在 HBuilderX 中右键云函数目录 `Vheat-Model` → 「上传部署」
3. uniapp 会根据 `package.json` 的 `"main": "dist/index.js"` 找到入口

---

## 六、常见问题排查

### ❌ 问题1：`Error [ERR_UNKNOWN_BUILTIN_MODULE]: No such built-in module: node:sqlite`

**原因**：pnpm 版本过高（v10+），要求 Node ≥ v22.13。

**解决**：
```bash
npm install -g pnpm@9.15.0 --registry=https://registry.npmmirror.com
```

---

### ❌ 问题2：`ERROR packages field missing or empty`

**原因**：项目根目录有 `pnpm-workspace.yaml`，但内容不是有效的 workspace 配置（比如只有 `allowBuilds` 字段）。

**解决**：删除 `pnpm-workspace.yaml`（单云函数项目不需要 workspace）。

---

### ❌ 问题3：`EPERM: operation not permitted, mkdir 'D:\.pnpm-store\v3'`

**原因**：pnpm 默认把 store 放在系统盘根目录，当前用户无写入权限。

**解决**：在项目根目录创建 `.npmrc`：
```
store-dir=./.pnpm-store
```

---

### ❌ 问题4：`Your etsc config file is using the old v1.0 format`

**原因**：`etsc.config.js` 使用了 v1 格式（顶层 `outDir`、`include`、`preserveModules` 等字段）。

**解决**：改为 v2 格式，所有 esbuild 选项放在 `esbuild` 对象内：
```js
module.exports = {
  esbuild: {
    outdir: "./dist",
    minify: true,
    target: "es2017",
    platform: "node",
    format: "cjs"
  }
};
```

---

### ❌ 问题5：`TypeError: Cannot read properties of undefined (reading 'fileExists')`

**原因**：TypeScript 版本过高（7.x），`ts.sys.fileExists` API 变更，etsc 2.0.5 不兼容。

**解决**：
```bash
pnpm remove typescript
pnpm add -D typescript@5.5.4
```

---

### ❌ 问题6：`etsc.config.json` 不生效 / 报错

**原因**：配置文件内容是 `module.exports = {...}`（CommonJS 模块），但后缀是 `.json`。

**解决**：重命名为 `etsc.config.js`。

---

### ❌ 问题7：删除 node_modules 时「访问被拒绝」

**原因**：pnpm 的 node_modules 使用硬链接/符号链接，PowerShell 的 `Remove-Item` 处理不好。

**解决**：用 cmd 的 `rmdir`：
```bash
cmd /c "rmdir /s /q node_modules"
```

---

## 七、新增云函数

如果需要新增另一个云函数（如 `user-center`），步骤：

1. 在 `cloudfunctions/` 下新建 `user-center/` 目录
2. 复制以下文件到新目录：`package.json`、`tsconfig.json`、`etsc.config.js`、`nodemon.json`、`.npmrc`
3. 修改 `package.json` 的 `name` 为 `user-center`
4. 创建 `src/index.ts` 写业务代码
5. 在新目录下执行 `pnpm install` + `npx nodemon`

> 每个云函数是独立的 npm 项目，需要单独安装依赖和启动监听。

---

## 八、依赖版本锁定清单（已验证可用）

| 包 | 版本 | 说明 |
|----|------|------|
| Node.js | 20.20.2 | 运行时 |
| pnpm | 9.15.0 | 包管理器 |
| esbuild-node-tsc | 2.0.5 | TS 编译器 |
| esbuild | 0.28.2 | 底层构建工具（etsc 依赖） |
| nodemon | 3.1.14 | 文件监听 |
| typescript | 5.5.4 | ⚠️ 必须 5.x，不能 7.x |
