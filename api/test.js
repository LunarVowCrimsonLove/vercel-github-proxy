// 简单的测试端点，用于检查服务是否正常工作
module.exports = async (req, res) => {
  try {
    res.status(200).json({
      status: 'ok',
      message: 'Vercel GitHub Proxy is running!',
      timestamp: new Date().toISOString(),
      node_version: process.version,
      env: {
        NODE_ENV: process.env.NODE_ENV || 'unknown'
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Test endpoint encountered an error',
      error: error.message
    });
  }
}; 