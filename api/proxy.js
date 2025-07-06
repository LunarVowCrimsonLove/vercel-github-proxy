// 专门用于处理完整 URL 的代理端点
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { Readable } = require('stream');

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
    console.log('Proxy request received:', {
      url: req.url,
      method: req.method,
      host: req.headers.host
    });
    
    // 获取要代理的 URL
    let targetUrl = '';
    
    // 从查询参数中获取目标 URL
    if (req.query.url) {
      targetUrl = fixUrl(req.query.url);
      console.log('URL from query parameter:', targetUrl);
    } else {
      // 从路径中提取 URL
      try {
        const url = new URL(req.url, `https://${req.headers.host}`);
        const pathname = url.pathname;
        const originalPath = pathname.substring(7); // 去掉 "/proxy/" 前缀
        
        if (originalPath.match(/^https?:\/?\/?/i)) {
          targetUrl = fixUrl(originalPath);
          console.log('URL from path (fixed):', targetUrl);
        } else {
          targetUrl = `https://github.com/${originalPath}`;
          console.log('URL from path (with github prefix):', targetUrl);
        }
        
        // 添加查询参数
        if (url.search && !targetUrl.includes('?')) {
          targetUrl += url.search;
        }
      } catch (error) {
        console.error('Error parsing URL:', error);
        res.status(400).send('Bad Request: Invalid URL format');
        return;
      }
    }
    
    // 检查目标 URL
    if (!targetUrl) {
      res.status(400).send('Bad Request: Missing target URL');
      return;
    }
    
    console.log('Target URL:', targetUrl);
    
    // 检查是否是 GitHub URL
    if (!targetUrl.includes('github.com')) {
      console.log('Non-GitHub URL detected');
      // 可以选择是否允许代理非 GitHub URL
      // res.status(403).send('Forbidden: Only GitHub URLs are allowed');
      // return;
    }
    
    // 构建请求头
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
    
    try {
      // 发送代理请求
      console.log('Fetching from:', targetUrl);
      const response = await fetch(targetUrl, {
        headers,
        method: req.method,
        redirect: 'follow'
      });
      
      console.log('Response status:', response.status);
      
      // 如果响应不成功，直接返回错误状态
      if (!response.ok) {
        console.error(`Error response from target: ${response.status} ${response.statusText}`);
        res.status(response.status).send(`Error from upstream server: ${response.statusText}`);
        return;
      }
      
      // 获取文件名（用于设置 Content-Disposition 头）
      let filename = '';
      try {
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        // 如果响应头中没有文件名，尝试从URL中提取
        if (!filename && targetUrl.includes('/')) {
          filename = decodeURIComponent(targetUrl.split('/').pop().split('?')[0]);
        }
        
        console.log('Detected filename:', filename);
      } catch (error) {
        console.error('Error extracting filename:', error);
      }
      
      // 复制响应头
      try {
        // 先清除所有可能冲突的头
        res.removeHeader('content-disposition');
        res.removeHeader('content-encoding');
        res.removeHeader('content-length');
        res.removeHeader('transfer-encoding');
        
        // 复制原始响应头
        for (const [key, value] of Object.entries(response.headers.raw())) {
          // 跳过一些特殊的头，这些头会由 Vercel 自动处理
          if (
            key.toLowerCase() !== 'content-encoding' && 
            key.toLowerCase() !== 'content-length' &&
            key.toLowerCase() !== 'transfer-encoding'
          ) {
            res.setHeader(key, value);
          }
        }
        
        // 对于二进制文件，确保设置正确的 Content-Type 和 Content-Disposition
        const contentType = response.headers.get('content-type');
        if (contentType) {
          res.setHeader('Content-Type', contentType);
        }
        
        // 如果是下载文件，添加 Content-Disposition 头
        if (filename && (
          targetUrl.includes('/releases/download/') || 
          targetUrl.includes('/archive/') || 
          filename.match(/\.(zip|tar\.gz|exe|dmg|apk|jar|iso|bin|rar|7z|gz|xz)$/i)
        )) {
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        }
      } catch (headerError) {
        console.error('Error copying headers:', headerError);
        // 继续执行，不因为头部复制失败而中断
      }
      
      // 设置状态码
      res.status(response.status);
      
      // 返回响应体
      try {
        // 对于二进制文件，使用流式传输
        if (response.body) {
          // 直接流式传输响应体
          await new Promise((resolve, reject) => {
            const stream = Readable.fromWeb(response.body);
            stream.pipe(res);
            stream.on('end', resolve);
            stream.on('error', reject);
          });
        } else {
          // 如果不支持流式传输，回退到 buffer 方式
          const buffer = await response.buffer();
          res.send(buffer);
        }
      } catch (streamError) {
        console.error('Error streaming response:', streamError);
        try {
          // 如果流式传输失败，尝试使用 buffer
          const buffer = await response.buffer();
          res.send(buffer);
        } catch (bufferError) {
          console.error('Error reading response as buffer:', bufferError);
          try {
            // 最后尝试使用 text
            const text = await response.text();
            res.send(text);
          } catch (textError) {
            console.error('All response reading methods failed:', textError);
            res.status(502).send('Error processing upstream response');
          }
        }
      }
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).send(`Internal Server Error: ${error.message}`);
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
}; 