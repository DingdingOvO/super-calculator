# 🧮 超级计算器 (Super Calculator)

<div align="center">

[![Build Status](https://img.shields.io/github/actions/workflow/status/DingdingOvO/super-calculator/build.yml?branch=main&label=Build&logo=github)](https://github.com/DingdingOvO/super-calculator/actions/workflows/build.yml)
[![Test Status](https://img.shields.io/github/actions/workflow/status/DingdingOvO/super-calculator/tests.yml?branch=main&label=Tests&logo=vitest)](https://github.com/DingdingOvO/super-calculator/actions/workflows/tests.yml)
[![E2E Tests](https://img.shields.io/github/actions/workflow/status/DingdingOvO/super-calculator/e2e.yml?branch=main&label=E2E&logo=playwright)](https://github.com/DingdingOvO/super-calculator/actions/workflows/e2e.yml)
[![Lint Status](https://img.shields.io/github/actions/workflow/status/DingdingOvO/super-calculator/lint.yml?branch=main&label=Lint&logo=eslint)](https://github.com/DingdingOvO/super-calculator/actions/workflows/lint.yml)
[![Release](https://img.shields.io/github/actions/workflow/status/DingdingOvO/super-calculator/release.yml?branch=main&label=Release&logo=github)](https://github.com/DingdingOvO/super-calculator/actions/workflows/release.yml)
[![Nightly Build](https://img.shields.io/github/actions/workflow/status/DingdingOvO/super-calculator/nightly.yml?branch=main&label=Nightly&logo=githubactions)](https://github.com/DingdingOvO/super-calculator/actions/workflows/nightly.yml)

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Rust](https://img.shields.io/badge/Rust_WASM-DEA584?logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Webpack 5](https://img.shields.io/badge/Webpack_5-8DD6F9?logo=webpack&logoColor=black)](https://webpack.js.org/)
[![SWC](https://img.shields.io/badge/SWC-FBE5A0?logo=swc&logoColor=black)](https://swc.rs/)

**Webpack 5 + SWC + React 19 + TypeScript 严格模式 + Rust WASM (rust_decimal)**
</div>

---

## 概述

一个**小题大作**的现代计算器 Web 应用。将 Rust WASM 的高精度计算能力与 React 19 的并发渲染相结合，配合 Windows 11 云母半透明（Mica/Acrylic）材质 UI，打造极致的计算体验。

### 特性

- **Rust 核心引擎**: 利用 `rust_decimal` 库实现高精度小数计算，状态机在 Rust 侧完整维护；科学模式使用递归下降表达式解析器，支持三角函数与 libm 跨平台一致性
- **React 19 useTransition**: 所有计算操作通过并发特性包装，保证 UI 响应不阻塞
- **Windows 11 Mica 材质**: 毛玻璃 + 动态微色调，支持亮色/深色主题平滑切换
- **插件化架构**: 标准、科学、程序员、日期计算四种模式各为独立插件，可动态加载
- **科学计算模式 (BETA)**: 支持 sin、cos、tan、log、ln、sqrt、阶乘、幂运算、括号、角度/弧度切换，通过递归下降解析器计算字符串表达式
- **纯 SVG 图标**: 所有图标均为手写 SVG 组件，零外部图标依赖
- **三语国际化**: 简体中文、繁体中文（精确校正）、英文，修正 Windows 官方机翻术语
- **完整键盘映射**: 数字、运算符、小数点、回车、退格、ESC 等全键盘支持
- **CI/CD 完备**: 6 个独立 GitHub Actions 工作流（含 E2E 测试），覆盖构建、测试、lint、发布、每日构建

---

## 快速开始

```bash
# 1. 确保安装了 Rust 工具链和 wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# 2. 安装 Node 依赖
npm install

# 3. 构建 Rust WASM 模块
cd rust-calculator && wasm-pack build --target bundler --release && cd ..

# 4. 启动开发服务器
npm start
# 打开 http://localhost:3000

# 5. 构建生产版本
npm run build
```

---

## 项目结构

```
super-calculator/
├── rust-calculator/          # Rust 计算引擎 (WASM)
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs            # WASM 绑定入口
│       ├── state.rs          # 计算器状态机
│       └── engine.rs         # 计算引擎封装
├── src/
│   ├── index.tsx              # React 入口
│   ├── App.tsx                # 主应用组件
│   ├── components/
│   │   ├── CalculatorShell.tsx # 外壳 (标题/模式切换/主题)
│   │   ├── Display.tsx        # 显示屏组件
│   │   ├── Button.tsx         # 按钮 & 网格组件
│   │   └── icons/             # 纯 SVG 图标组件
│   ├── hooks/
│   │   ├── useCalculator.ts   # WASM 计算器 Hook (useTransition)
│   │   └── useTheme.ts        # 主题管理 Hook
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── zh-CN.ts
│   │   ├── zh-TW.ts
│   │   └── en.ts
│   ├── plugins/
│   │   ├── types.ts           # 插件接口定义
│   │   ├── registry.ts        # 插件注册表
│   │   ├── Standard/          # 标准模式 (已实现)
│   │   ├── Scientific/        # 科学模式 (占位)
│   │   ├── Programmer/        # 程序员模式 (占位)
│   │   └── DateCalculation/   # 日期计算 (占位)
│   └── styles/
│       └── global.css         # 全局样式 (Mica/Acrylic)
├── .github/workflows/
│   ├── build.yml              # 构建验证
│   ├── tests.yml              # 单元测试
│   ├── lint.yml               # Lint 检查
│   ├── release.yml            # 自动发布
│   └── nightly.yml            # 每日构建
├── webpack.config.js          # Webpack 5 配置 (SWC + FS Cache)
├── tsconfig.json              # TypeScript 严格模式
└── package.json
```

---

## 技术栈

| 层面 | 技术 | 说明 |
|------|------|------|
| 构建 | Webpack 5 | 文件系统持久化缓存，二次编译 < 1s |
| 转译 | SWC (swc-loader) | Rust 驱动的超高速 TS/JSX 转译 |
| 框架 | React 19 | useTransition 并发渲染 |
| 类型 | TypeScript 严格模式 | strict + noUncheckedIndexedAccess |
| 核心逻辑 | Rust → WASM | rust_decimal 高精度计算，完整状态机 |
| 样式 | CSS (原生) | 零依赖，Mica/Acrylic 毛玻璃效果 |
| 测试 | Vitest + cargo test | 前端 + Rust 双重测试覆盖 |
| CI/CD | GitHub Actions | 5 个独立工作流，全缓存加速 |

---

## 插件系统

插件基于 `CalculatorPlugin` 接口，每个模式是一个独立模块：

```typescript
interface CalculatorPlugin {
  meta: CalculatorPluginMeta;  // id, name, icon, enabled
  render: (i18n, theme) => CalculatorPluginRender;
}
```

- 插件通过 `registerPlugin()` 注册，通过 `getPlugin(id)` 按需加载
- 新添模式只需实现 `CalculatorPlugin` 接口并注册，无需修改核心代码
- 第一阶段标准模式已完成，其他模式以占位按钮（灰色禁用）呈现

---

## 国际化术语参考

| 简体中文 | 繁體中文 | English |
|----------|---------|--------|
| 标准 | 標準 | Standard |
| 科学 | 工程型 | Scientific |
| 程序员 | 程式設計師 | Programmer |
| 日期计算 | 日期計算 | Date Calculation |
| 正弦 (sin) | 正弦 (sin) | Sine (sin) |
| 余弦 (cos) | 餘弦 (cos) | Cosine (cos) |
| 正切 (tan) | 正切 (tan) | Tangent (tan) |
| 常用对数 (log) | 常用對數 (log) | Logarithm (log) |
| 自然对数 (ln) | 自然對數 (ln) | Natural Log (ln) |
| 平方根 (√) | 平方根 (√) | Square Root (√) |
| 角度 / 弧度 | 度 / 弧度 | Deg / Rad |

---

## 键盘快捷键

| 按键 | 功能 |
|------|------|
| `0`-`9` | 数字输入 |
| `.` / `,` | 小数点 |
| `+` | 加法 |
| `-` | 减法 |
| `*` | 乘法 |
| `/` | 除法 |
| `Enter` / `=` | 计算结果 |
| `Backspace` | 退格删除 |
| `Esc` / `C` | 全部清除 |
| `%` | 百分比 |

---

## CI/CD 工作流

| 工作流 | 触发条件 | 包含内容 |
|--------|----------|----------|
| **Build** | push/PR → main | 安装依赖、Rust 测试、WASM 构建、前端构建、TS 类型检查、ESLint |
| **Tests** | push/PR → main | 独立运行 Rust 测试 + Vitest 前端测试，生成报告 |
| **E2E** | push/PR → main | Playwright 浏览器端到端测试，验证标准/科学模式计算流程 |
| **Lint** | push/PR → main | Clippy (Rust) + ESLint (TS/TSX) 并行检查 |
| **Release** | 推送 `v*` 标签 | 构建 → 部署 GitHub Pages → Release + Changelog |
| **Nightly** | 每日 00:00 UTC | 完整构建 + 测试 + lint，确保依赖兼容性 |

所有工作流均使用 `actions/cache` 缓存 node_modules、cargo registry 和 Rust target 目录，加速后续运行。

---

## 许可证

MIT
