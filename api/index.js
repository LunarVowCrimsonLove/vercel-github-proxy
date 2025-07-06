let fetch;
try {
  fetch = require('node-fetch');
} catch (error) {
  // 如果 require 失败，可能是因为使用了 ESM 环境
  console.error('Failed to load node-fetch with require:', error);
  // 在这种情况下，我们会在处理请求时再次尝试导入
}

// 配置
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

// 环境变量
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const URL = process.env.URL || '';
const URL302 = process.env.URL302 || '';
const BLOCKED_USER_AGENTS = (process.env.BLOCKED_USER_AGENTS || 'bot,spider,crawler').split(',');

// HTML 页面
const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitHub 文件加速</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f6f8fa;
    }
    .container {
      max-width: 600px;
      padding: 20px;
      background-color: #fff;
      border-radius: 6px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    h1 {
      text-align: center;
      margin-bottom: 20px;
      color: #24292e;
    }
    .input-group {
      display: flex;
      margin-bottom: 10px;
    }
    input {
      flex: 1;
      padding: 10px;
      border: 1px solid #e1e4e8;
      border-radius: 6px 0 0 6px;
      font-size: 16px;
    }
    button {
      padding: 10px 20px;
      background-color: #2ea44f;
      color: white;
      border: none;
      border-radius: 0 6px 6px 0;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.2s;
    }
    button:hover {
      background-color: #2c974b;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 14px;
      color: #586069;
    }
    .footer a {
      color: #0366d6;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    @media (max-width: 600px) {
      .container {
        width: 100%;
        border-radius: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>GitHub 文件加速</h1>
    <div class="input-group">
      <input type="text" id="github-url" placeholder="输入 GitHub 链接" autocomplete="off">
      <button onclick="convert()">转换</button>
    </div>
    <div class="footer">
      <p>GitHub 文件加速服务，加速访问 GitHub 的 release、archive、项目文件等资源</p>
      <p>支持 release、archive、raw、blob、gist 等链接的加速</p>
      <p>Powered by <a href="https://vercel.com" target="_blank">Vercel</a></p>
    </div>
  </div>
  <script>
    function convert() {
      const url = document.getElementById('github-url').value.trim();
      if (url) {
        // 获取当前域名作为基础 URL
        const currentHost = window.location.protocol + '//' + window.location.host;
        // 处理输入的 GitHub URL
        let processedUrl = url;
        // 如果包含完整的 GitHub URL，则保留路径部分
        if (url.includes('github.com')) {
          processedUrl = url.replace(/^(https?:\/\/)?(www\.)?github\.com/, '');
        }
        // 确保路径以斜杠开头
        if (!processedUrl.startsWith('/')) {
          processedUrl = '/' + processedUrl;
        }
        // 跳转到处理后的 URL
        window.location.href = currentHost + processedUrl;
      }
    }
    
    document.getElementById('github-url').addEventListener('keyup', function(event) {
      if (event.key === 'Enter') {
        convert();
      }
    });
  </script>
</body>
</html>`;

// 伪装页面
const disguisedHtml = `<!DOCTYPE html>
<html>
<head>
  <title>404 Not Found</title>
  <style>
    body {
      font-family: Tahoma, Arial, sans-serif;
      margin: 0;
      padding: 30px;
      background-color: #f0f0f0;
      color: #333;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 20px;
    }
    p {
      margin: 10px 0;
    }
    hr {
      border: 0;
      border-top: 1px solid #ccc;
      margin: 20px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #fff;
      padding: 30px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>404 Not Found</h1>
    <p>The requested URL was not found on this server.</p>
    <hr>
    <p>nginx/1.18.0</p>
  </div>
</body>
</html>`;

// 检查是否为爬虫
function isBot(userAgent) {
  if (!userAgent) return false;
  userAgent = userAgent.toLowerCase();
  return BLOCKED_USER_AGENTS.some(botAgent => userAgent.includes(botAgent.toLowerCase()));
}

// 处理请求
module.exports = async (req, res) => {
  try {
    // 确保 fetch 可用
    if (!fetch) {
      try {
        // 尝试动态导入 (ESM 方式)
        const module = await import('node-fetch');
        fetch = module.default;
      } catch (error) {
        console.error('Failed to import node-fetch:', error);
        res.status(500).send('Server configuration error: node-fetch not available');
        return;
      }
    }

    // 获取请求信息
    let url;
    try {
      url = new URL(req.url, `https://${req.headers.host}`);
    } catch (error) {
      console.error('Invalid URL:', error);
      res.status(400).send('Bad Request: Invalid URL');
      return;
    }
    
    const pathname = url.pathname;
    const userAgent = req.headers['user-agent'] || '';
    
    // 检查是否为爬虫
    if (isBot(userAgent)) {
      res.status(403).send('Forbidden');
      return;
    }

    // 处理主页
    if (pathname === '/' || pathname === '') {
      // 如果设置了URL302，则进行302跳转
      if (URL302) {
        res.setHeader('Location', URL302);
        res.status(302).send('');
        return;
      }
      
      // 如果设置了URL，则显示伪装页面
      if (URL) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(disguisedHtml);
        return;
      }
      
      // 默认显示加速页面
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
      return;
    }

    // 解析路径
    let path = pathname.replace(/^\//, '');
    
    // 处理自定义前缀
    if (config.prefix && path.startsWith(config.prefix)) {
      path = path.replace(config.prefix, '');
    }
    
    // 匹配不同类型的GitHub URL
    const releaseMatch = path.match(/^(?:https?:\/\/)?github\.com\/([^\/]+)\/([^\/]+)\/releases\/(?:download|tag)\/([^\/]+)(?:\/(.+))?/i);
    const archiveMatch = path.match(/^(?:https?:\/\/)?github\.com\/([^\/]+)\/([^\/]+)\/archive\/(.+)/i);
    const blobMatch = path.match(/^(?:https?:\/\/)?github\.com\/([^\/]+)\/([^\/]+)\/blob\/(.+)/i);
    const rawMatch = path.match(/^(?:https?:\/\/)?github\.com\/([^\/]+)\/([^\/]+)\/raw\/(.+)/i);
    const gistMatch = path.match(/^(?:https?:\/\/)?gist\.github\.com\/([^\/]+)\/([^\/]+)\/raw\/(.+)/i);
    const gistRawMatch = path.match(/^(?:https?:\/\/)?gist\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/raw\/(.+)/i);
    const rawUserContentMatch = path.match(/^(?:https?:\/\/)?raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/(.+)/i);
    const cloneMatch = path.match(/^(?:https?:\/\/)?github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?$/i);
    const jsDelivrMatch = path.match(/^(?:https?:\/\/)?cdn\.jsdelivr\.net\/gh\/([^\/]+)\/([^\/]+)\/(.+)/i);

    // 检查白名单
    const checkWhitelist = (owner) => {
      if (config.whitelist.length === 0) return true;
      return config.whitelist.includes(owner);
    };

    // 构建代理URL
    let targetUrl = '';
    let headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    // 添加GitHub Token（如果有）
    if (config.private && GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    // 处理不同类型的URL
    if (releaseMatch) {
      const [, owner, repo, tag, filePath] = releaseMatch;
      if (!checkWhitelist(owner)) {
        res.status(403).send('Forbidden: Repository not in whitelist');
        return;
      }
      
      if (filePath) {
        targetUrl = `https://github.com/${owner}/${repo}/releases/download/${tag}/${filePath}`;
      } else {
        targetUrl = `https://github.com/${owner}/${repo}/releases/tag/${tag}`;
      }
    } else if (archiveMatch) {
      const [, owner, repo, ref] = archiveMatch;
      if (!checkWhitelist(owner)) {
        res.status(403).send('Forbidden: Repository not in whitelist');
        return;
      }
      
      targetUrl = `https://github.com/${owner}/${repo}/archive/${ref}`;
    } else if (blobMatch) {
      const [, owner, repo, ref] = blobMatch;
      if (!checkWhitelist(owner)) {
        res.status(403).send('Forbidden: Repository not in whitelist');
        return;
      }
      
      targetUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}`;
    } else if (rawMatch) {
      const [, owner, repo, ref] = rawMatch;
      if (!checkWhitelist(owner)) {
        res.status(403).send('Forbidden: Repository not in whitelist');
        return;
      }
      
      targetUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}`;
    } else if (gistMatch) {
      const [, owner, gistId, file] = gistMatch;
      if (!checkWhitelist(owner)) {
        res.status(403).send('Forbidden: Repository not in whitelist');
        return;
      }
      
      targetUrl = `https://gist.githubusercontent.com/${owner}/${gistId}/raw/${file}`;
    } else if (gistRawMatch) {
      const [, owner, gistId, file] = gistRawMatch;
      if (!checkWhitelist(owner)) {
        res.status(403).send('Forbidden: Repository not in whitelist');
        return;
      }
      
      targetUrl = `https://gist.githubusercontent.com/${owner}/${gistId}/raw/${file}`;
    } else if (rawUserContentMatch) {
      const [, owner, repo, ref] = rawUserContentMatch;
      if (!checkWhitelist(owner)) {
        res.status(403).send('Forbidden: Repository not in whitelist');
        return;
      }
      
      targetUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}`;
    } else if (cloneMatch) {
      const [, owner, repo] = cloneMatch;
      if (!checkWhitelist(owner)) {
        res.status(403).send('Forbidden: Repository not in whitelist');
        return;
      }
      
      targetUrl = `https://github.com/${owner}/${repo}.git`;
    } else if (jsDelivrMatch && config.jsdelivr) {
      const [, owner, repo, file] = jsDelivrMatch;
      if (!checkWhitelist(owner)) {
        res.status(403).send('Forbidden: Repository not in whitelist');
        return;
      }
      
      targetUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}/${file}`;
    } else {
      // 不匹配任何规则，尝试作为完整URL处理
      if (path.startsWith('http')) {
        targetUrl = path;
      } else {
        // 无法解析的路径，返回404
        res.status(404).send('Not Found');
        return;
      }
    }

    try {
      // 发送代理请求
      const response = await fetch(targetUrl, {
        headers,
        method: req.method,
        redirect: 'follow'
      });

      // 复制响应头
      try {
        const responseHeaders = response.headers;
        // 使用 forEach 而不是 entries() 来增加兼容性
        responseHeaders.forEach((value, key) => {
          if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'content-length') {
            res.setHeader(key, value);
          }
        });
      } catch (headerError) {
        console.error('Error copying headers:', headerError);
        // 继续执行，不因为头部复制失败而中断
      }

      // 设置状态码
      res.status(response.status);

      // 返回响应体
      try {
        // 尝试使用 arrayBuffer() 方法（更广泛支持）
        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
      } catch (bufferError) {
        console.error('Error reading response body as arrayBuffer:', bufferError);
        try {
          // 如果 arrayBuffer() 失败，尝试使用 text()
          const text = await response.text();
          res.send(text);
        } catch (textError) {
          console.error('Error reading response body as text:', textError);
          res.status(502).send('Error processing upstream response');
        }
      }
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).send('Internal Server Error');
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    res.status(500).send('Internal Server Error');
  }
}; 