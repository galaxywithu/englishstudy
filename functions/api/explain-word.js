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
      try {
        body = await request.clone().text();
        // 记录请求体内容用于调试
        console.log("Request body:", body);
      } catch (bodyErr) {
        console.error("Error reading request body:", bodyErr);
        return new Response(JSON.stringify({ 
          error: "Failed to read request body",
          details: bodyErr.message 
        }), {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          }
        });
      }
    }
    
    // 创建转发请求
    const newRequest = new Request(url, {
      method: request.method,
      headers: {
        "Content-Type": "application/json"
      },
      body: body
    });
    
    console.log(`Forwarding request to: ${url}`);
    
    // 转发请求
    const response = await fetch(newRequest);
    
    // 检查响应状态
    if (!response.ok) {
      console.error(`Error from backend: ${response.status} ${response.statusText}`);
      
      // 尝试读取错误响应
      let errorText = "";
      try {
        errorText = await response.text();
        console.error("Backend error response:", errorText);
      } catch (e) {
        console.error("Could not read error response", e);
      }
      
      // 返回更详细的错误响应
      return new Response(JSON.stringify({
        error: "Backend service error",
        details: errorText,
        status: response.status,
        message: `服务暂时不可用 (${response.status})`
      }), {
        status: response.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
          "X-Error-Info": `Backend responded with ${response.status}: ${errorText.substring(0, 100)}`
        }
      });
    }
    
    // 尝试解析响应
    let responseData;
    try {
      responseData = await response.json();
      console.log("Successful response from backend");
    } catch (jsonError) {
      console.error("Error parsing JSON response:", jsonError);
      
      // 尝试读取原始响应
      let responseText = "";
      try {
        responseText = await response.clone().text();
        console.error("Raw response:", responseText);
      } catch (e) {
        console.error("Could not read raw response", e);
      }
      
      // 返回错误信息
      return new Response(JSON.stringify({
        error: "Failed to parse backend response",
        details: jsonError.message,
        rawResponse: responseText.substring(0, 500) // 限制长度
      }), {
        status: 502,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      });
    }
    
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
    console.error("Proxy error:", error);
    
    return new Response(JSON.stringify({
      error: "Service error",
      details: error.message
    }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      }
    });
  }
} 