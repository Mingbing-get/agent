---
name: 'project-framework'
description: '规定项目架构和技术选型。当用户需要制定项目架构、技术栈选择或项目结构规划时调用。'
---

# 项目架构规划技能

## 功能描述

本技能用于帮助用户制定项目架构和技术选型，包括：

- 项目目录结构设计
- 技术栈选择建议
- 架构模式推荐
- 开发流程规范
- 代码规范制定

## 何时调用

当用户需要以下内容时，应该调用本技能：

- 开始新项目时需要规划架构
- 现有项目需要重构或优化架构
- 技术栈升级或切换
- 项目结构不清晰需要规范化
- 团队协作需要统一架构规范

## 项目架构规划流程

### 1. 需求分析

- 明确项目目标和范围
- 识别核心功能和非核心功能
- 分析业务需求和技术需求
- 确定性能和可扩展性要求

### 2. 技术栈选择

使用pnpm多包管理，将项目分为前端和后端作为子包。

#### 前端技术

- **框架选择**：React、小程序使用taro+react框架
- **语言**：TypeScript
- **构建工具**：Vite
- **UI 库**：Ant Design、Tailwind CSS
- **测试工具**：Jest、Cypress、Testing Library

#### 后端技术

- **语言**：Node.js + TypeScript
- **框架**：koa
- **数据库**：PostgreSQL
- **认证**：JWT
- **API 设计**：RESTful

#### DevOps 工具

- **版本控制**：Git
- **CI/CD**：GitHub Actions
- **容器化**：Docker

### 3. 项目目录结构

#### 前端项目结构示例

```
/src
  /assets            # 静态资源
  /components        # 通用组件
  /pages             # 页面组件
  /hooks             # 自定义钩子
  /utils             # 工具函数
  /api               # API 服务
  /styles            # 全局样式
  /types             # TypeScript 类型定义
  /tests             # 测试文件
  App.ts             # 应用入口
  main.tsx           # 主文件
```

#### 后端项目结构示例

```
/src
  /controllers       # 控制器
  /services          # 业务逻辑
  /models            # 数据模型
  /routes            # 路由
  /middleware        # 中间件
  /config            # 配置文件
  /utils             # 工具函数
  /tests             # 测试文件
  app.ts             # 应用入口
  server.ts          # 服务器启动
```

### 4. 架构模式

- **MVC (Model-View-Controller)**
- **MVVM (Model-View-ViewModel)**
- **Clean Architecture**
- **Hexagonal Architecture**
- **Event-Driven Architecture**
- **Microservices Architecture**

### 5. 代码规范

- **命名规范**：变量、函数、类的命名规则
- **缩进和格式**：代码缩进、空格使用
- **注释规范**：代码注释的格式和要求
- **错误处理**：异常处理的最佳实践
- **代码质量**：代码复杂度、重复代码处理

### 6. 开发流程

- **分支管理**：Git 分支策略
- **代码审查**：Pull Request 流程
- **测试策略**：单元测试、集成测试、端到端测试
- **部署流程**：开发、测试、生产环境部署
- **版本管理**：语义化版本规范

## 输出示例

### 前端项目架构示例

```
# 前端项目架构

## 技术栈
- 框架：React
- 语言：TypeScript
- 构建工具：Vite
- UI 库：Tailwind CSS
- 测试工具：Jest + Testing Library

## 目录结构
/src
  /assets            # 静态资源
  /components        # 通用组件
  /pages             # 页面组件
  /hooks             # 自定义钩子
  /utils             # 工具函数
  /services          # API 服务
  /store             # 状态管理
  /styles            # 全局样式
  /types             # TypeScript 类型定义
  /tests             # 测试文件
  App.ts            # 应用入口
  main.tsx           # 主文件
```

### 后端项目架构示例

```
# 后端项目架构

## 技术栈
- 语言：Node.js
- 框架：koa
- 数据库：PostgreSQL
- 认证：JWT
- API 设计：RESTful

## 目录结构
/src
  /controllers       # 控制器
  /services          # 业务逻辑
  /models            # 数据模型
  /routes            # 路由
  /middleware        # 中间件
  /config            # 配置文件
  /utils             # 工具函数
  /tests             # 测试文件
  app.ts             # 应用入口
  server.ts          # 服务器启动
```

### 开发流程

1. 从 main 分支创建 feature 分支
2. 开发完成后提交 PR
3. 代码审查通过后合并到 main
4. 自动部署到测试环境
5. 测试通过后部署到生产环境

## 使用建议

1. 根据项目规模和复杂度选择合适的架构模式
2. 保持目录结构清晰一致
3. 制定并严格遵守代码规范
4. 建立完善的测试体系
5. 定期进行架构评审和优化

通过本技能，您可以获得符合最佳实践的项目架构方案，确保项目的可维护性、可扩展性和可靠性。
