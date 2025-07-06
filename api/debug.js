// 调试工具，用于诊断 URL 处理问题
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = async (req, res) => {
  try {
    // 获取请求信息
    const requestInfo = {
      url: req.url,
      method: req.method,
      headers: req.headers,
      host: req.headers.host,
      query: req.query || {}
    };

    // 解析 URL
    let urlInfo = {};
    let targetUrl = '';
    let error = null;
    
    try {
      // 解析请求 URL
      const url = new URL(req.url, `https://${req.headers.host}`);
      const pathname = url.pathname;
      const originalUrl = url.pathname.substring(1); // 去掉开头的斜杠
      const search = url.search;
      
      urlInfo = {
        href: url.href,
        origin: url.origin,
        protocol: url.protocol,
        host: url.host,
        hostname: url.hostname,
        port: url.port,
        pathname,
        search,
        originalUrl
      };
      
      // 检查是否是完整的 URL 格式
      const isCompleteUrl = originalUrl.match(/^https?:\/\//i);
      
      if (isCompleteUrl) {
        targetUrl = originalUrl;
      } else if (originalUrl.startsWith('debug/')) {
        // 如果是调试路径，移除 debug/ 前缀
        const testPath = originalUrl.substring(6); // 去掉 "debug/" 前缀
        
        // 检查测试路径是否是完整 URL
        if (testPath.match(/^https?:\/\//i)) {
          targetUrl = testPath;
        } else {
          targetUrl = `https://github.com/${testPath}`;
        }
      } else {
        targetUrl = `https://github.com/${originalUrl}`;
      }
      
      // 添加查询参数（如果有）
      if (search && !targetUrl.includes('?')) {
        targetUrl += search;
      }
      
      urlInfo.isCompleteUrl = isCompleteUrl;
      urlInfo.targetUrl = targetUrl;
      
      // 尝试请求目标 URL 的头信息
      if (req.query.test === 'true' && targetUrl) {
        try {
          const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          };
          
          const response = await fetch(targetUrl, {
            method: 'HEAD',
            headers,
            redirect: 'follow'
          });
          
          const responseHeaders = {};
          for (const [key, value] of Object.entries(response.headers.raw())) {
            responseHeaders[key] = value;
          }
          
          urlInfo.testResult = {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            ok: response.ok
          };
        } catch (testError) {
          urlInfo.testError = {
            message: testError.message,
            stack: testError.stack
          };
        }
      }
    } catch (parseError) {
      error = {
        message: parseError.message,
        stack: parseError.stack
      };
    }

    // 返回调试信息
    res.status(200).json({
      status: 'ok',
      message: 'Debug Endpoint',
      timestamp: new Date().toISOString(),
      request: requestInfo,
      url: urlInfo,
      error,
      help: {
        usage: "访问 /api/debug?test=true 来测试目标 URL 的可访问性",
        examples: [
          "/api/debug/DustinWin/proxy-tools/releases/download/mihomo/mihomo-alpha-linux-armv8.tar.gz",
          "/api/debug/https://github.com/DustinWin/proxy-tools/releases/download/mihomo/mihomo-alpha-linux-armv8.tar.gz"
        ]
      },
      env: {
        NODE_ENV: process.env.NODE_ENV || 'unknown',
        VERCEL_REGION: process.env.VERCEL_REGION || 'unknown',
        VERCEL_ENV: process.env.VERCEL_ENV || 'unknown'
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Debug endpoint encountered an error',
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
}; 