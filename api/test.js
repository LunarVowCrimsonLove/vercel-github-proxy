// 简单的测试端点，用于检查服务是否正常工作
module.exports = async (req, res) => {
  try {
    // 收集请求信息
    const requestInfo = {
      url: req.url,
      method: req.method,
      headers: req.headers,
      host: req.headers.host,
      path: req.path || 'N/A',
      query: req.query || {}
    };

    // 尝试解析 URL
    let parsedUrl = null;
    let urlError = null;
    try {
      parsedUrl = new URL(req.url, `https://${req.headers.host}`);
    } catch (error) {
      urlError = {
        message: error.message,
        stack: error.stack
      };
    }

    res.status(200).json({
      status: 'ok',
      message: 'Vercel GitHub Proxy test endpoint is running!',
      timestamp: new Date().toISOString(),
      node_version: process.version,
      request: requestInfo,
      url_parsing: {
        success: urlError === null,
        parsed: parsedUrl ? {
          href: parsedUrl.href,
          origin: parsedUrl.origin,
          protocol: parsedUrl.protocol,
          host: parsedUrl.host,
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          pathname: parsedUrl.pathname,
          search: parsedUrl.search
        } : null,
        error: urlError
      },
      env: {
        NODE_ENV: process.env.NODE_ENV || 'unknown',
        VERCEL_REGION: process.env.VERCEL_REGION || 'unknown',
        VERCEL_ENV: process.env.VERCEL_ENV || 'unknown'
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Test endpoint encountered an error',
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
}; 