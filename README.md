# English Word Learning Assistant

A web application that provides simple, child-friendly explanations for English words.

## Features

- Simple explanations for babies
- List of all meanings in child-friendly language
- Common phrases using the word
- Related words

## Technology Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- API: Cloud AI service

## Local Development

1. Clone the repository
```
git clone https://github.com/yourusername/english-learning-app.git
cd english-learning-app
```

2. Install dependencies
```
npm install
```

3. Set up environment variables
```
cp .env.example .env
```
Then edit the `.env` file and add your API key.

4. Start the server
```
npm start
```
Or use development mode (auto-restart):
```
npm run dev
```

5. Access the website
Open your browser and visit http://localhost:3000

## Deployment

### Frontend (Cloudflare Pages)

1. Push your code to a GitHub or GitLab repository
2. Log in to your Cloudflare account
3. Go to Pages and click "Create a project"
4. Connect your repository
5. Configure build settings:
   - Build command: (leave empty)
   - Build output directory: `public`
6. Click "Save and Deploy"

### Backend (Render, Railway, Heroku, etc.)

1. Create a new web service on your chosen platform
2. Connect your repository
3. Configure environment variables:
   - `OPENAI_API_KEY`: Your API key
   - `CORS_ORIGIN`: Your frontend URL (e.g., https://your-app.pages.dev)
4. Deploy the service

### Connecting Frontend to Backend

After deploying both services, update the API URL in the frontend:

1. Edit `public/script.js`
2. Change the API_URL variable to point to your backend:
```javascript
const API_URL = 'https://your-backend-service.com/api/explain-word';
```
3. Redeploy the frontend

## License

MIT 