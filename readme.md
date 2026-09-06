# Vheart-Model

> 基于 uni-app x 的跨端应用 —— 通过相机扫描现实物品，一键生成可复用的 3D 数字资产。

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-uni--app%20x-green)
![Vue](https://img.shields.io/badge/vue-3-brightgreen)
![Target](https://img.shields.io/badge/target-Android-orange)

## 项目简介

Vheart-Model 是一款面向普通用户的 **3D 资产采集工具**。用户只需用手机相机围绕物品拍摄，应用即可自动完成三维重建，输出可用于游戏、建模、AR/VR 等场景的标准 3D 模型文件。

项目命名中的 "Vheart" 寓意 **Virtual Heart（虚拟之心）**——将现实世界的物品"记忆"为数字世界的三维资产。

## 功能特性

### ✅ 已实现

- **用户体系**：手机号 + 密码登录 / 注册，预留第三方登录入口，基于 `uni-id-common` 统一身份认证
- **首页工作台**：物品搜索、轮播 Banner、最近扫描记录展示
- **相册管理**：扫描素材与生成结果的本地相册入口（页面框架已搭建）
- **跨端架构**：uni-app x 原生渲染，一套代码多端发布
- **双击退出**：Android / HarmonyOS 端按返回键两次确认退出

### 🚧 开发中 / 规划中

- **相机扫描采集**：多视角图像采集、陀螺仪辅助、采集质量实时反馈
- **三维重建管线**：基于多视图立体匹配（MVS）的点云生成、网格重建、纹理贴图
- **3D 模型预览**：内置模型查看器，支持旋转、缩放、材质切换
- **资产导出**：支持 OBJ / GLTF / FBX 等主流格式导出与分享
- **云端处理**：重计算任务卸载至 uniCloud 云函数，端侧仅负责采集与预览

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | **uni-app x** | DCloud 下一代跨端框架，原生渲染 |
| 视图层 | **UVue** (`.uvue`) | 类 Vue 单文件组件，编译为原生 |
| 逻辑层 | **UTS** (`.uts`) | TypeScript 超集，编译为 Kotlin / Swift |
| 状态管理 | Vue 3 Composition API | `ref` / `reactive` |
| 样式 | SCSS | 全局变量定义于 `uni.scss` |
| 用户认证 | `uni-id-common` | 统一用户身份体系 |
| 配置中心 | `uni-config-center` | 多环境配置管理 |
| 云服务 | **uniCloud（支付宝云）** | 云函数 + 云数据库 |
| 目标平台 | Android（优先） | `platformConfig.json` 已锁定 APP-ANDROID |

## 项目结构

```
Vheart-Model/
├── App.uvue                  # 应用入口（生命周期、双击退出）
├── main.uts                  # UTS 主入口，创建 SSR App
├── index.html                # H5 入口模板
├── manifest.json             # 应用配置（appid、版本、平台分发）
├── pages.json                # 页面路由与 tabBar 配置
├── platformConfig.json       # 编译目标平台（APP-ANDROID）
├── uni.scss                  # 全局 SCSS 变量与主题
│
├── pages/                    # 页面目录
│   ├── login/
│   │   └── login.uvue        # 登录 / 注册页（启动页）
│   ├── index/
│   │   └── index.uvue        # 首页（物品记忆 · 搜索 · 最近记录）
│   └── photo/
│       └── photo.uvue        # 相册页（扫描素材管理）
│
├── commen/
│   └── utils/
│       └── utils.js          # 公共工具（页面跳转封装）
│
├── uni_modules/              # uni_modules 插件
│   ├── uni-config-center/    # 配置中心
│   └── uni-id-common/        # 用户身份认证
│
├── uniCloud-alipay/          # 支付宝云服务空间
│   ├── cloudfunctions/       # 云函数
│   └── database/             # 云数据库（含 JQL 查询）
│
├── static/                   # 静态资源
│   └── logo.png
│
└── unpackage/                # 编译产物（gitignore）
```

## 快速开始

### 环境要求

- **HBuilderX**（推荐 4.0+，需安装 uni-app x 插件）
- **Android Studio** / 真机（用于运行调试）
- JDK 17+（Android 编译依赖）

### 运行步骤

1. **克隆项目**
   ```bash
   git clone <repo-url>
   cd Vheart-Model
   ```

2. **使用 HBuilderX 打开项目**
   - 文件 → 打开目录 → 选择 `Vheart-Model` 文件夹

3. **配置云服务空间**
   - 右键 `uniCloud-alipay` → 关联云服务空间
   - 上传 `cloudfunctions` 下的云函数
   - 初始化 `database` 中的数据表

4. **运行到 Android**
   - 连接 Android 设备或启动模拟器
   - 运行 → 运行到手机或模拟器 → 运行到 Android App 基座

5. **打包发布**
   - 发行 → 原生 App-云打包 → 选择 Android → 提交打包

## 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `pages/login/login` | 登录页 | 应用启动页，手机号登录 / 注册 |
| `pages/index/index` | 首页 | 物品搜索、轮播、最近扫描记录 |
| `pages/photo/photo` | 相册 | 扫描素材与生成模型管理 |

底部 tabBar：**首页** · **相册** · **我的**（我的页面待开发）

## 云服务说明

项目使用 **uniCloud 支付宝云** 作为后端服务：

- **用户认证**：`uni-id-common` 提供 token 鉴权、用户注册登录
- **云函数**：`uniCloud-alipay/cloudfunctions/` 目录下部署
- **云数据库**：`uniCloud-alipay/database/` 管理数据集合与 JQL 查询
- **配置中心**：`uni-config-center` 统一管理多环境配置

> 后续三维重建的重计算任务将以云函数形式部署，端侧上传采集图像后异步等待处理结果。

## 开发规范

- 页面文件统一使用 `.uvue` 扩展名，逻辑脚本使用 `lang="uts"`
- 公共工具函数存放于 `commen/utils/`，通过 ES Module 导出
- 样式使用 SCSS，全局变量引用 `uni.scss` 中定义的设计令牌
- 所有页面 `navigationStyle: custom`，采用自定义导航栏
- 颜色主色调：`#3c86fe`（按钮 / 链接），深色背景 `#0c141e` / `#1f293a`

## 路线图

```
v0.1  ──  当前  ──  项目骨架搭建（登录 / 首页 / 相册框架）
v0.2  ──  相机采集模块  ──  多视角拍摄、采集引导、质量检测
v0.3  ──  云端重建管线  ──  图像上传、点云生成、网格重建
v0.4  ──  3D 预览器     ──  模型加载、交互查看、材质编辑
v0.5  ──  资产导出      ──  多格式导出、分享、云存储管理
v1.0  ──  正式发布      ──  全流程打通、性能优化、多端适配
```

## 许可证

MIT License

---

*Vheart-Model — 让每一件物品都拥有数字生命。*
