document.addEventListener('DOMContentLoaded', () => {
    // 添加通知样式
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            z-index: 1000;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            animation: slide-in 0.5s ease-out;
        }
        
        @keyframes slide-in {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .notification.error {
            background-color: #ff4d4f;
        }
        
        .notification.info {
            background-color: #1890ff;
        }
        
        .notification.success {
            background-color: #52c41a;
        }
    `;
    document.head.appendChild(style);
    
    // API endpoint - change this when deploying
    // const API_URL = '/api/explain-word'; // Local development
    // const API_URL = 'https://lingering-flower-420b.2913760687.workers.dev/api/explain-word'; // Cloudflare Worker
    // const API_URL = 'https://func-hjcbg-kgzbjasltj.cn-shanghai.fcapp.run'; // 阿里云函数直接地址
    
    // 使用Cloudflare Pages Functions代理 (相对路径)
    const API_URL = '/api/explain-word'; 
    
    // 保存API可用状态
    let isApiAvailable = true;
    
    // 自动检测可用的API
    checkConnection(API_URL);

    const wordInput = document.getElementById('word-input');
    const searchBtn = document.getElementById('search-btn');
    const resultsSection = document.getElementById('results');
    
    // Results section elements
    const babyExplanationContent = document.querySelector('#baby-explanation .content');
    const meaningsListContent = document.querySelector('#meanings-list .content');
    const phrasesContent = document.querySelector('#phrases .content');
    const relatedWordsContent = document.querySelector('#related-words .content');
    
    // Listen for search button click
    searchBtn.addEventListener('click', () => {
        searchWord();
    });
    
    // Listen for Enter key in input field
    wordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchWord();
        }
    });
    
    // Search word function
    async function searchWord() {
        const word = wordInput.value.trim();
        
        if (!word) {
            showNotification('请输入一个英文单词', 'error');
            return;
        }
        
        // Show loading state
        showLoading(true);
        
        try {
            // Call API
            const data = await callAPIWithRetry(word);
            
            // Display results
            displayResults(data);
            
            // Show results section
            resultsSection.classList.add('visible');
        } catch (error) {
            console.error('Error:', error);
            let errorMessage = '获取单词信息失败';
            
            if (error.message.includes('502')) {
                errorMessage = '服务器暂时不可用，请稍后重试';
            } else if (error.message.includes('network')) {
                errorMessage = '网络连接失败，请检查网络设置';
            } else if (error.message.includes('timeout')) {
                errorMessage = '请求超时，请稍后重试';
            }
            
            showNotification(errorMessage, 'error');
            resultsSection.classList.remove('visible');
        } finally {
            // Hide loading state
            showLoading(false);
        }
    }
    
    // Display results function
    function displayResults(data) {
        console.log('API returned data:', data); // Add log for debugging
        
        // Display baby explanation
        babyExplanationContent.innerHTML = `<p>${data.babyExplanation || 'No data'}</p>`;
        
        // Display all meanings list
        if (data.meaningsList && Array.isArray(data.meaningsList)) {
            meaningsListContent.innerHTML = `<ul>${data.meaningsList.map(meaning => `<li>${meaning}</li>`).join('')}</ul>`;
        } else {
            meaningsListContent.innerHTML = '<p>No data</p>';
        }
        
        // Display phrases
        if (data.phrases && Array.isArray(data.phrases)) {
            phrasesContent.innerHTML = `<ul>${data.phrases.map(phrase => `<li>${phrase}</li>`).join('')}</ul>`;
        } else {
            phrasesContent.innerHTML = '<p>No data</p>';
        }
        
        // Display related words
        if (data.relatedWords && Array.isArray(data.relatedWords)) {
            relatedWordsContent.innerHTML = `<ul>${data.relatedWords.map(word => `<li>${word}</li>`).join('')}</ul>`;
        } else {
            relatedWordsContent.innerHTML = '<p>No data</p>';
        }
    }
    
    // Show/hide loading state
    function showLoading(isLoading) {
        if (isLoading) {
            // Add loading animation
            if (!document.querySelector('.loading')) {
                const loadingSpinner = document.createElement('span');
                loadingSpinner.className = 'loading';
                searchBtn.appendChild(loadingSpinner);
            }
            searchBtn.disabled = true;
        } else {
            // Remove loading animation
            const loadingSpinner = document.querySelector('.loading');
            if (loadingSpinner) {
                loadingSpinner.remove();
            }
            searchBtn.disabled = false;
        }
    }
    
    // API call function
    async function callAPIWithRetry(word, maxRetries = 2) {
        let lastError;
        
        for (let i = 0; i <= maxRetries; i++) {
            try {
                if (i > 0) {
                    console.log(`第${i}次重试请求...`);
                    showNotification(`正在重新尝试请求...`, 'info');
                }
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ word }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `服务器错误 (${response.status})`);
                }
                
                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.message || data.error);
                }
                
                return data;
            } catch (error) {
                console.error(`请求失败 (尝试 ${i+1}/${maxRetries+1}):`, error);
                lastError = error;
                
                if (error.name === 'AbortError' || error.message.includes('network')) {
                    await new Promise(r => setTimeout(r, 1000 * (i + 1)));
                    continue;
                } else {
                    break;
                }
            }
        }
        
        // 所有重试都失败了
        console.error('所有重试都失败了:', lastError);
        throw lastError;
    }
    
    // 检查API连接是否可用
    async function checkConnection(apiUrl) {
        console.log('Checking connection to API:', apiUrl);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const testResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ word: 'test' }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (testResponse.ok) {
                console.log('API connection successful');
                isApiAvailable = true;
            } else {
                console.error('API返回错误状态码:', testResponse.status);
                isApiAvailable = false;
                showNotification('服务暂时不可用，请稍后重试', 'error');
            }
        } catch (error) {
            console.error('API connection failed:', error);
            isApiAvailable = false;
            showNotification('服务暂时不可用，请稍后重试', 'error');
        }
    }
    
    // 添加通知函数
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // 3秒后自动移除
        setTimeout(() => {
            notification.remove();
        }, 3000);
    } 
});// In a real application, we need to add a backend service to handle API requests
// Below is an example API call function, but it will not be used in pure frontend demo

/*
async function callOpenAI(word) {
    const response = await fetch('/api/explain-word', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word }),
    });
    
    if (!response.ok) {
        throw new Error('API request failed');
    }
    
    return await response.json();
}
*/ 

