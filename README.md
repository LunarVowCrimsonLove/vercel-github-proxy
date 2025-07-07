# Vercel GitHub Proxy

基于 Vercel Serverless Functions 的 GitHub 资源加速代理，可加速访问 GitHub 的 release、archive、raw、blob 等资源。

## 功能特点

- 支持加速 GitHub 的 release、archive、raw、blob 等资源
- 支持 git clone 加速
- 支持访问私有仓库（需配置 GitHub Token）
- 提供简洁的 Web 界面
- 支持主页伪装和 302 跳转
- 内置爬虫屏蔽功能
- 支持直接在域名后添加完整 GitHub 链接的方式

## 快速部署

### 方法一：通过 Vercel 控制台部署

1. Fork 本仓库
2. 在 [Vercel 控制台](https://vercel.com/dashboard) 中导入项目
3. 配置环境变量（可选）
4. 点击部署

### 方法二：通过 Vercel CLI 部署

1. 安装 Vercel CLI：`npm i -g vercel`
2. 克隆本仓库：`git clone https://github.com/yourusername/vercel-github-proxy.git`
3. 进入项目目录：`cd vercel-github-proxy`
4. 安装依赖：`npm install`
5. 部署到 Vercel：`vercel --prod`

## 配置选项

在 Vercel 项目设置中，可以配置以下环境变量：

| 环境变量 | 说明 | 默认值 |
| --- | --- | --- |
| `GITHUB_TOKEN` | GitHub 个人访问令牌，用于访问私有仓库 | 空 |
| `URL` | 设置后，主页将显示为伪装页面 | 空 |
| `URL302` | 设置后，访问主页将 302 跳转到指定 URL | 空 |
| `BLOCKED_USER_AGENTS` | 要屏蔽的用户代理关键词，用逗号分隔 | bot,spider,crawler |

## 使用方法

### 方法一：直接添加完整 GitHub 链接（推荐）

直接在域名后添加完整的 GitHub 链接：

```
https://your-vercel-app.vercel.app/https://github.com/owner/repo/releases/download/tag/file.zip
```

这种方式与 CF-Workers-GitHub 项目完全兼容，方便迁移和使用。

### 方法二：简化路径格式

```
https://your-vercel-app.vercel.app/owner/repo/releases/download/tag/file.zip
```

### 加速 GitHub Release 文件下载

原始链接：
```
https://github.com/owner/repo/releases/download/tag/file.zip
```

加速链接（方法一）：
```
https://your-vercel-app.vercel.app/https://github.com/owner/repo/releases/download/tag/file.zip
```

加速链接（方法二）：
```
https://your-vercel-app.vercel.app/owner/repo/releases/download/tag/file.zip
```

### 加速 GitHub Raw 文件

原始链接：
```
https://github.com/owner/repo/raw/branch/file.txt
```

加速链接（方法一）：
```
https://your-vercel-app.vercel.app/https://github.com/owner/repo/raw/branch/file.txt
```

加速链接（方法二）：
```
https://your-vercel-app.vercel.app/owner/repo/raw/branch/file.txt
```

### 加速 Git Clone

原始命令：
```
git clone https://github.com/owner/repo.git
```

加速命令（方法一）：
```
git clone https://your-vercel-app.vercel.app/https://github.com/owner/repo.git
```

加速命令（方法二）：
```
git clone https://your-vercel-app.vercel.app/owner/repo.git
```

## 最近更新

- 增加了直接添加完整 GitHub 链接的支持，与 CF-Workers-GitHub 项目兼容
- 修复了大文件下载问题
- 增强了二进制文件处理
- 改进了错误处理和日志记录
- 增加了内存限制和超时时间
- 优化了 URL 解析逻辑

## 许可证

MIT 