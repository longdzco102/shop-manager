const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('No API key found in .env');
            return;
        }

        console.log('Fetching available models...');

        // Use Node fetch to call the REST API directly to list models
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            console.error('Failed to fetch:', response.status, response.statusText);
            const error = await response.text();
            console.error(error);
            return;
        }

        const data = await response.json();
        const models = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));

        console.log('\n--- AVAILABLE MODELS FOR GENERATECONTENT ---');
        models.forEach(m => {
            console.log(`- ${m.name.replace('models/', '')}: ${m.displayName}`);
        });

    } catch (err) {
        console.error('Error:', err);
    }
}

listModels();
