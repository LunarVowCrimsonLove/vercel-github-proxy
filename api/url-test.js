// 测试完整 URL 格式的处理
module.exports = async (req, res) => {
  try {
    // 获取请求信息
    const requestInfo = {
      url: req.url,
      method: req.method,
      headers: req.headers,
      host: req.headers.host
    };

    // 尝试解析 URL
    let originalUrl = '';
    let urlParts = {};
    let urlError = null;
    
    try {
      const url = new URL(req.url, `https://${req.headers.host}`);
      originalUrl = url.pathname.substring(1); // 去掉开头的斜杠
      
      urlParts = {
        href: url.href,
        origin: url.origin,
        protocol: url.protocol,
        host: url.host,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        search: url.search,
        originalUrl: originalUrl
      };
    } catch (error) {
      urlError = {
        message: error.message,
        stack: error.stack
      };
    }

    // 检查是否是完整的 URL 格式
    const isCompleteUrl = originalUrl.match(/^https?:\/\//i);
    
    // 模拟处理 URL
    let targetUrl = '';
    if (isCompleteUrl) {
      targetUrl = originalUrl;
    } else {
      targetUrl = `https://github.com/${originalUrl}`;
    }

    res.status(200).json({
      status: 'ok',
      message: 'URL Test Endpoint',
      timestamp: new Date().toISOString(),
      request: requestInfo,
      url_parsing: {
        success: urlError === null,
        parsed: urlParts,
        error: urlError,
        isCompleteUrl: !!isCompleteUrl,
        originalUrl: originalUrl,
        targetUrl: targetUrl
      },
      env: {
        NODE_ENV: process.env.NODE_ENV || 'unknown',
        VERCEL_REGION: process.env.VERCEL_REGION || 'unknown',
        VERCEL_ENV: process.env.VERCEL_ENV || 'unknown'
      }
    });
  } catch (error) {
    console.error('URL test endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: 'URL test endpoint encountered an error',
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
}; 