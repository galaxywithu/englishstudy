document.addEventListener('DOMContentLoaded', () => {
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
            alert('Please enter an English word');
            return;
        }
        
        // Show loading state
        showLoading(true);
        
        try {
            // Call API
            const data = await callAPI(word);
            
            // Display results
            displayResults(data);
            
            // Show results section
            resultsSection.classList.add('visible');
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to get word information, please try again later');
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
    async function callAPI(word) {
        // 如果API已被检测为不可用，直接使用模拟数据
        if (!isApiAvailable) {
            console.log('API已被检测为不可用，使用模拟数据');
            return mockApiCall(word);
        }
        
        try {
            console.log('Sending API request:', word);
            
            // Add timeout handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ word }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId); // Clear timeout
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API response:', data);
            return data;
        } catch (error) {
            console.error('API call error:', error);
            
            // Show more detailed error information
            if (error.name === 'AbortError') {
                console.error('Request timed out. Worker may be inactive or URL incorrect.');
            }
            
            // If API call fails, use mock data
            console.log('Using mock data instead');
            return mockApiCall(word);
        }
    }
    
    // 检查API连接是否可用
    async function checkConnection(apiUrl) {
        console.log('Checking connection to API:', apiUrl);
        try {
            // 尝试直接发送POST请求而不是OPTIONS请求
            // OPTIONS请求可能会被CORS阻止，但POST请求在出错时会更明确
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
            
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
                console.warn('API返回错误，将使用模拟数据。请检查API配置。');
            }
        } catch (error) {
            console.error('API connection failed:', error);
            isApiAvailable = false;
            
            // 不显示弹窗，避免用户困扰
            console.warn('API连接失败，将使用模拟数据');
        }
    }
    
    // Mock API call (used when API is unavailable)
    async function mockApiCall(word) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Return mock data
        return {
            babyExplanation: `"${word}" is a fun word! Imagine if you see a puppy, you can say "${word}" to describe it. This word is like magic, it helps us express our thoughts and feelings.`,
            meaningsList: [
                `${word} can be a noun, referring to an object or concept`,
                `${word} can also be a verb, meaning to do something`,
                `Sometimes ${word} can be an adjective, describing qualities of things`
            ],
            phrases: [
                `${word} out - indicating completion or ending`,
                `${word} up - indicating increase or improvement`,
                `${word} in - indicating participation or inclusion`,
                `${word} on - indicating continuation or persistence`,
                `${word} off - indicating departure or cancellation`
            ],
            relatedWords: [
                `${word}er - usually refers to a person who does this action`,
                `${word}ing - the present participle of this word`,
                `${word}ed - the past tense of this word`
            ]
        };
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

