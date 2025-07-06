# Vercel GitHub Proxy

基于 Vercel Serverless Functions 的 GitHub 资源加速服务，可加速访问 GitHub 的 release、archive、项目文件等资源。本项目是 CF-Workers-GitHub 项目的 Vercel 版本，保留了原项目的所有功能，并利用 Vercel 的边缘计算能力提供全球加速服务。

## 功能特点

- **多种资源加速**：支持加速 GitHub 的 release、archive、raw、blob 等多种资源
- **Git Clone 加速**：支持 git clone 操作的加速
- **私有仓库支持**：通过配置 GitHub Token，可以访问私有仓库的资源
- **jsDelivr 镜像加速**：支持对 jsDelivr CDN 的代理加速
- **简洁 Web 界面**：提供简洁美观的 Web 界面，方便用户输入 GitHub 链接进行加速
- **安全保护功能**：
  - 支持主页伪装（显示为 404 页面）
  - 支持 302 跳转（访问主页时跳转到其他网站）
  - 内置爬虫屏蔽功能，避免被恶意爬取
- **白名单功能**：可以设置仓库白名单，只允许代理特定用户或组织的仓库
- **自定义前缀**：支持设置自定义路径前缀

## 部署方法

### 方法一：一键部署

点击下面的按钮，一键将项目部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/USERNAME/vercel-github-proxy)

部署过程中，Vercel 会自动 Fork 本仓库到你的 GitHub 账号下，并完成部署。

### 方法二：手动部署

1. **克隆本仓库**：

```bash
git clone https://github.com/USERNAME/vercel-github-proxy.git
cd vercel-github-proxy
```

2. **安装 Vercel CLI**：

```bash
npm install -g vercel
```

3. **登录 Vercel**：

```bash
vercel login
```

4. **部署到 Vercel**：

```bash
vercel deploy --prod
```

按照提示完成部署流程，Vercel 会自动为你分配一个域名。

## 环境变量配置

在 Vercel 平台部署项目后，你需要配置一些环境变量来启用特定功能。这些环境变量可以在 Vercel 控制台中设置：

1. 登录 Vercel 控制台，进入你的项目
2. 点击 "Settings" 选项卡
3. 在左侧菜单中选择 "Environment Variables"
4. 添加以下环境变量（根据需要）

### 可用的环境变量

**GITHUB_TOKEN**
- **作用**：用于访问 GitHub 私有仓库
- **是否必须**：否，只有需要访问私有仓库时才需要
- **格式示例**：`ghp_xxxxxxxxxxxxxxxxxxxx`
- **如何获取**：
  1. 访问 GitHub 的 [Personal Access Tokens](https://github.com/settings/tokens) 页面
  2. 点击 "Generate new token"
  3. 选择 "repo" 权限
  4. 生成并复制 token

**URL**
- **作用**：启用主页伪装功能，将主页显示为 404 页面
- **是否必须**：否
- **格式示例**：设置为任何非空值，如 `true` 或 `yes` 即可启用

**URL302**
- **作用**：设置主页 302 跳转目标
- **是否必须**：否
- **格式示例**：`https://www.example.com`
- **说明**：当有人访问你的网站主页时，会自动跳转到这个 URL

**BLOCKED_USER_AGENTS**
- **作用**：屏蔽特定的爬虫或机器人
- **是否必须**：否，默认值为 `bot,spider,crawler`
- **格式示例**：`bot,spider,crawler,googlebot`
- **说明**：用逗号分隔多个关键词，包含这些关键词的 User-Agent 将被拒绝访问

### 环境变量优先级

如果同时设置了 `URL302` 和 `URL`，则 `URL302` 的优先级更高。也就是说：
- 如果设置了 `URL302`，访问主页会直接 302 跳转
- 如果只设置了 `URL`，访问主页会显示伪装的 404 页面
- 如果两者都未设置，访问主页会显示正常的 GitHub 加速工具页面

## 使用方法

### 基本使用

1. 访问部署后的网站（例如：`https://your-project.vercel.app`）
2. 在输入框中输入 GitHub 链接
3. 点击"转换"按钮
4. 自动跳转到加速后的链接

### 直接访问

也可以直接在浏览器地址栏中使用以下格式访问：

```
https://your-project.vercel.app/github.com/用户名/仓库名/...
```

例如：
- 加速访问 Release 文件：`https://your-project.vercel.app/github.com/username/repo/releases/download/v1.0/file.zip`
- 加速访问仓库文件：`https://your-project.vercel.app/github.com/username/repo/blob/main/README.md`

## 支持的链接类型

| 资源类型 | 原始格式 | 加速格式 |
|---------|---------|---------|
| Release 文件 | `github.com/{owner}/{repo}/releases/download/{tag}/{file}` | `your-project.vercel.app/github.com/{owner}/{repo}/releases/download/{tag}/{file}` |
| 存档文件 | `github.com/{owner}/{repo}/archive/{ref}` | `your-project.vercel.app/github.com/{owner}/{repo}/archive/{ref}` |
| 文件内容 | `github.com/{owner}/{repo}/blob/{ref}` | `your-project.vercel.app/github.com/{owner}/{repo}/blob/{ref}` |
| Raw 文件 | `github.com/{owner}/{repo}/raw/{ref}` | `your-project.vercel.app/github.com/{owner}/{repo}/raw/{ref}` |
| Gist | `gist.github.com/{owner}/{gistId}/raw/{file}` | `your-project.vercel.app/gist.github.com/{owner}/{gistId}/raw/{file}` |
| Raw User Content | `raw.githubusercontent.com/{owner}/{repo}/{ref}` | `your-project.vercel.app/raw.githubusercontent.com/{owner}/{repo}/{ref}` |
| Git Clone | `github.com/{owner}/{repo}.git` | `your-project.vercel.app/github.com/{owner}/{repo}.git` |
| jsDelivr CDN | `cdn.jsdelivr.net/gh/{owner}/{repo}/{file}` | `your-project.vercel.app/cdn.jsdelivr.net/gh/{owner}/{repo}/{file}` |

## 自定义域名

为了获得更好的访问体验，你可以为你的 Vercel 项目添加自定义域名：

1. 在 Vercel 控制台中，进入你的项目
2. 点击 "Settings" -> "Domains"
3. 添加你的自定义域名
4. 按照 Vercel 的指引配置 DNS 记录

配置完成后，你可以使用你的自定义域名来访问加速服务。

## 高级配置

如果需要修改更多配置，可以编辑 `api/index.js` 文件中的 `config` 对象：

```javascript
const config = {
  // 是否开启对 jsDelivr 的代理
  jsdelivr: true,
  // 是否开启对私有仓库的代理
  private: true,
  // 白名单，只允许代理以下 Github 用户/组织的仓库，空数组则不限制
  whitelist: [],
  // 自定义前缀，默认为空
  prefix: ''
};
```

## 性能优化

Vercel 的 Serverless Functions 部署在全球边缘节点上，可以提供更低的延迟和更快的访问速度。为了获得最佳性能：

1. 选择离你最近的 Vercel 区域部署
2. 使用自定义域名并配置 CDN
3. 考虑为经常访问的资源设置缓存策略

## 注意事项

- 本项目仅供学习研究使用，请遵守 GitHub 的使用条款
- 如需用于生产环境，请自行评估风险和法律合规性
- 不建议用于大文件传输，可能会受到 Vercel 平台的限制
- 定期更新 GitHub Token，以确保安全性

## 常见问题

**Q: 为什么我无法访问私有仓库？**  
A: 请确保你已正确配置 `GITHUB_TOKEN` 环境变量，并且该 Token 具有访问私有仓库的权限。

**Q: 如何修改白名单？**  
A: 编辑 `api/index.js` 文件中的 `config.whitelist` 数组，添加允许的用户名或组织名。

**Q: 如何设置自定义前缀？**  
A: 编辑 `api/index.js` 文件中的 `config.prefix` 字段，设置你想要的路径前缀。

## 许可证

本项目采用 [MIT 许可证](./LICENSE)。 