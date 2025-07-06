// URL 解析测试工具
module.exports = async (req, res) => {
  try {
    // 获取要测试的 URL
    const testUrl = req.query.url || req.url;
    
    // 解析结果
    const result = {
      status: 'ok',
      message: 'URL 解析测试',
      timestamp: new Date().toISOString(),
      original: testUrl,
      parsed: {}
    };
    
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
    
    // 尝试不同的解析方式
    try {
      // 1. 标准 URL 解析
      try {
        const url = new URL(testUrl);
        result.parsed.standard = {
          href: url.href,
          protocol: url.protocol,
          host: url.host,
          hostname: url.hostname,
          port: url.port,
          pathname: url.pathname,
          search: url.search,
          hash: url.hash,
          origin: url.origin
        };
      } catch (error) {
        result.parsed.standard = {
          error: error.message
        };
      }
      
      // 2. 尝试修复 URL 后解析
      try {
        const fixed = fixUrl(testUrl);
        result.fixed = fixed;
        
        const url = new URL(fixed);
        result.parsed.fixed = {
          href: url.href,
          protocol: url.protocol,
          host: url.host,
          hostname: url.hostname,
          port: url.port,
          pathname: url.pathname,
          search: url.search,
          hash: url.hash,
          origin: url.origin
        };
      } catch (error) {
        result.parsed.fixed = {
          error: error.message
        };
      }
      
      // 3. 尝试添加基础 URL 后解析
      try {
        const baseUrl = `https://${req.headers.host || 'example.com'}`;
        const url = new URL(testUrl, baseUrl);
        result.parsed.withBase = {
          baseUrl: baseUrl,
          href: url.href,
          protocol: url.protocol,
          host: url.host,
          hostname: url.hostname,
          port: url.port,
          pathname: url.pathname,
          search: url.search,
          hash: url.hash,
          origin: url.origin
        };
      } catch (error) {
        result.parsed.withBase = {
          error: error.message
        };
      }
      
      // 4. 正则表达式匹配测试
      result.regexTests = {
        isCompleteUrl: !!testUrl.match(/^https?:\/?\/?/i),
        isHttpProtocol: !!testUrl.match(/^http:\/?\/?/i),
        isHttpsProtocol: !!testUrl.match(/^https:\/?\/?/i),
        isGitHubUrl: !!testUrl.match(/github\.com/i),
        isReleaseUrl: !!testUrl.match(/releases\/download/i)
      };
      
      // 5. 路径解析测试
      const pathOnly = testUrl.replace(/^https?:\/?\/?/i, '').split('?')[0];
      result.pathAnalysis = {
        pathOnly: pathOnly,
        segments: pathOnly.split('/'),
        isGitHubPath: pathOnly.startsWith('github.com'),
        possibleOwner: pathOnly.split('/')[1] || null,
        possibleRepo: pathOnly.split('/')[2] || null
      };
      
      // 6. 构建目标 URL
      let targetUrl = '';
      
      if (testUrl.match(/^https?:\/?\/?/i)) {
        targetUrl = fixUrl(testUrl);
      } else {
        targetUrl = `https://github.com/${testUrl}`;
      }
      
      result.targetUrl = targetUrl;
      
    } catch (parseError) {
      result.error = {
        message: parseError.message,
        stack: parseError.stack
      };
    }

    // 返回解析结果
    res.status(200).json(result);
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