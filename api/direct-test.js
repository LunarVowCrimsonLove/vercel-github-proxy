// 专门用于测试完整 URL 格式的端点
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// 修复 URL 格式
function fixUrl(url) {
  // 确保 URL 有正确的协议格式
  if (url.startsWith('http:/')) {
    if (!url.startsWith('http://')) {
      url = 'http://' + url.substring(6);
    }
  } else if (url.startsWith('https:/')) {
    if (!url.startsWith('https://')) {
      url = 'https://' + url.substring(7);
    }
  }
  return url;
}

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

    // 从查询参数中获取要测试的 URL
    const testUrl = req.query.url || '';
    
    if (!testUrl) {
      return res.status(200).json({
        status: 'error',
        message: '请提供要测试的 URL',
        usage: '使用 /api/direct-test?url=https://github.com/user/repo/releases/download/tag/file.zip 来测试',
        timestamp: new Date().toISOString()
      });
    }
    
    // 修复 URL 格式
    const fixedUrl = fixUrl(testUrl);
    
    // 准备测试结果
    const result = {
      status: 'ok',
      message: 'Direct URL Test',
      timestamp: new Date().toISOString(),
      request: requestInfo,
      url: {
        original: testUrl,
        fixed: fixedUrl,
        isHttps: fixedUrl.startsWith('https://'),
        isGitHub: fixedUrl.includes('github.com')
      }
    };
    
    // 尝试请求目标 URL 的头信息
    try {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      };
      
      console.log('Testing direct URL:', fixedUrl);
      const response = await fetch(fixedUrl, {
        method: req.query.method || 'HEAD',
        headers,
        redirect: 'follow'
      });
      
      const responseHeaders = {};
      for (const [key, value] of Object.entries(response.headers.raw())) {
        responseHeaders[key] = value;
      }
      
      result.testResult = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        ok: response.ok
      };
      
      // 如果请求方法是 GET，尝试获取内容类型和大小
      if ((req.query.method || 'HEAD') === 'GET') {
        try {
          const contentType = response.headers.get('content-type');
          const contentLength = response.headers.get('content-length');
          
          result.contentInfo = {
            type: contentType,
            length: contentLength,
            isText: contentType && contentType.includes('text'),
            isBinary: contentType && !contentType.includes('text')
          };
          
          // 如果是文本内容，尝试获取前 1000 个字符
          if (contentType && contentType.includes('text')) {
            const text = await response.text();
            result.contentPreview = text.substring(0, 1000) + (text.length > 1000 ? '...' : '');
          }
        } catch (contentError) {
          result.contentError = {
            message: contentError.message
          };
        }
      }
    } catch (testError) {
      result.testError = {
        message: testError.message,
        stack: testError.stack
      };
    }

    // 返回测试结果
    res.status(200).json(result);
  } catch (error) {
    console.error('Direct test endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Direct test endpoint encountered an error',
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
}; 