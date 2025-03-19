export async function onRequest(context) {
  const { request, env } = context;
  
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
    
    // 确保是POST请求
    if (request.method !== "POST") {
      return new Response(JSON.stringify({
        error: "Method not allowed",
        details: "Only POST requests are supported"
      }), {
        status: 405,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      });
    }
    
    // 提取请求体
    let body;
    try {
      body = await request.json();
      console.log("Request body:", JSON.stringify(body));
    } catch (bodyErr) {
      console.error("Error parsing request body:", bodyErr);
      return new Response(JSON.stringify({ 
        error: "Invalid JSON",
        details: bodyErr.message 
      }), {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      });
    }
    
    // 获取单词
    const word = body.word;
    if (!word) {
      return new Response(JSON.stringify({
        error: "Missing word",
        details: "Please provide an English word"
      }), {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      });
    }
    
    // 构建提示词
    const prompt = `
For the English word "${word}":
1. explain all the meanings of this word to a baby in a simple, friendly way
2. list all the meanings in LONG, SIMPLE sentences as if you're talking to a baby
3. make 5 phrase about this word
4. list 3 related word

IMPORTANT: Please respond in ENGLISH only.

Please respond in the following JSON format:
{
  "babyExplanation": "A simple, friendly explanation for babies...",
  "meaningsList": ["Long, simple sentence explaining meaning 1...", "Long, simple sentence explaining meaning 2...", "Long, simple sentence explaining meaning 3..."],
  "phrases": ["Phrase 1", "Phrase 2", "Phrase 3", "Phrase 4", "Phrase 5"],
  "relatedWords": ["Related word 1", "Related word 2", "Related word 3"]
}
`;
    
    // 检查API密钥
    const OPENAI_API_KEY = env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      console.error("Missing OpenAI API key");
      return new Response(JSON.stringify({
        error: "Configuration error", 
        details: "API key not configured"
      }), {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      });
    }
    
    // 调用OpenAI API
    console.log("Calling OpenAI API...");
    
    const openaiResponse = await fetch("https://yunwu.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an English language assistant. Always respond in English only and follow the exact JSON format requested."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });
    
    // 检查OpenAI响应
    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error(`OpenAI API error: ${openaiResponse.status}`, errorText);
      
      return new Response(JSON.stringify({
        error: "AI service error",
        details: `OpenAI API responded with ${openaiResponse.status}`,
        message: "服务暂时不可用，请稍后重试"
      }), {
        status: 502,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      });
    }
    
    // 解析OpenAI响应
    const openaiData = await openaiResponse.json();
    
    if (!openaiData.choices || !openaiData.choices[0] || !openaiData.choices[0].message) {
      console.error("Invalid OpenAI response format:", JSON.stringify(openaiData));
      
      return new Response(JSON.stringify({
        error: "Invalid response from AI service",
        details: "Response format unexpected"
      }), {
        status: 502,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      });
    }
    
    // 获取内容
    const content = openaiData.choices[0].message.content;
    
    // 解析JSON内容
    try {
      const parsedContent = JSON.parse(content);
      
      // 返回结果
      return new Response(JSON.stringify(parsedContent), {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      });
    } catch (jsonError) {
      console.error("Error parsing JSON from OpenAI:", jsonError);
      console.log("Raw content:", content);
      
      return new Response(JSON.stringify({
        error: "Failed to parse AI response",
        details: jsonError.message
      }), {
        status: 502,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      });
    }
  } catch (error) {
    // 总体错误处理
    console.error("General error:", error);
    
    return new Response(JSON.stringify({
      error: "Service error",
      details: error.message,
      message: "服务发生错误，请稍后重试"
    }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      }
    });
  }
} 