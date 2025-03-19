export async function onRequest(context) {
  const { request } = context;
  
  // 转发请求到阿里云函数
  const url = "https://func-hjcbg-kgzbjasltj.cn-shanghai.fcapp.run";
  
  try {
    // 处理OPTIONS请求
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400"
        }
      });
    }
    
    // 提取请求体
    let body = null;
    if (request.method === "POST") {
      body = await request.clone().text();
    }
    
    // 创建转发请求
    const newRequest = new Request(url, {
      method: request.method,
      headers: {
        "Content-Type": "application/json"
      },
      body: body
    });
    
    // 转发请求
    const response = await fetch(newRequest);
    const responseData = await response.json();
    
    // 返回带CORS头的响应
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    // 错误处理
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      }
    });
  }
} 