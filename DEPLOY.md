# 部署指南

本文档提供了将 Vercel GitHub Proxy 部署到 Vercel 平台的详细步骤。

## 通过 Vercel 控制台部署

1. 登录 [Vercel 控制台](https://vercel.com/dashboard)
2. 点击 "Add New..." -> "Project"
3. 导入 GitHub 仓库（如果是第一次使用，需要先授权 Vercel 访问你的 GitHub 账号）
4. 选择包含 vercel-github-proxy 代码的仓库
5. 配置项目（可以保持默认设置）
6. 在环境变量部分，可以添加以下可选环境变量：
   - `GITHUB_TOKEN`：GitHub 个人访问令牌，用于访问私有仓库
   - `URL`：设置后，主页将显示为伪装页面
   - `URL302`：设置后，访问主页将 302 跳转到指定 URL
   - `BLOCKED_USER_AGENTS`：要屏蔽的用户代理关键词，用逗号分隔
7. 点击 "Deploy" 按钮开始部署
8. 等待部署完成后，Vercel 会提供一个 `*.vercel.app` 域名

## 配置自定义域名（可选）

1. 在项目页面，点击 "Settings" -> "Domains"
2. 添加你的自定义域名
3. 按照 Vercel 的指引配置 DNS 记录
4. 等待 DNS 生效

## 更新已部署的项目

1. 在本地修改代码后，将更改推送到 GitHub 仓库
2. Vercel 会自动检测更改并重新部署
3. 也可以在 Vercel 控制台手动触发重新部署

## 常见问题

### 部署失败

如果部署失败，请检查：
1. 确保 package.json 文件正确
2. 检查是否有语法错误
3. 查看 Vercel 的构建日志以获取详细错误信息

### 无法访问私有仓库

确保已正确设置 `GITHUB_TOKEN` 环境变量，并且该 Token 具有访问私有仓库的权限。

### 文件下载问题

如果遇到大文件下载问题：
1. 检查 Vercel 的日志以查看具体错误
2. 确认 vercel.json 中的内存和超时设置是否足够
3. 对于特别大的文件（>50MB），可能会受到 Vercel 平台限制

## 性能优化建议

1. 使用自定义域名并配置 CDN
2. 选择离用户最近的 Vercel 区域部署
3. 考虑为经常访问的资源设置缓存策略 