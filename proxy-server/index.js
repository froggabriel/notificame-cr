const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS to allow requests from your React app's origin
const corsOptions = {
    origin: ['https://froggabriel.github.io', 'http://localhost:3000'],
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Proxy endpoint for fetching stores from Auto Mercado
app.get('/am/stores', async (req, res) => {
    try {
        const response = await axios.get('https://automercado.azure-api.net/prod-front/home/getStores');
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching stores:', error);
        res.status(500).json({ error: 'Failed to fetch stores' });
    }
});

// Proxy endpoint for fetching product availability from Algolia for Auto Mercado
app.post('/am/availability', express.json(), async (req, res) => {
    try {
        const algoliaRequest = req.body;

        const response = await axios.post(
            'https://fu5xfx7knl-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(4.24.0)%3B%20Browser%20(lite)&x-algolia-api-key=113941a18a90ae0f17d602acd16f91b2&x-algolia-application-id=FU5XFX7KNL',
            algoliaRequest,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ error: 'Failed to fetch availability' });
    }
});

// Proxy endpoint for fetching product availability from PriceSmart
app.post('/ps/availability', express.json(), async (req, res) => {
    try {
        const requestData = req.body;
        const response = await axios.post('https://www.pricesmart.com/api/ct/getProduct', requestData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching PriceSmart availability:', error);
        res.status(500).json({ error: 'Failed to fetch PriceSmart availability' });
    }
});

// Proxy endpoint for fetching recommendations from Algolia for Auto Mercado
app.post('/am/recommendations', express.json(), async (req, res) => {
    try {
        const algoliaRequest = req.body;
        const response = await axios.post(
            'https://fu5xfx7knl-dsn.algolia.net/1/indexes/*/recommendations?x-algolia-agent=Algolia%20for%20JavaScript%20(4.24.0)%3B%20Recommend%20(4.24.0)%3B%20Browser&x-algolia-api-key=113941a18a90ae0f17d602acd16f91b2&x-algolia-application-id=FU5XFX7KNL',
            algoliaRequest,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

// Proxy endpoint for fetching search results from PriceSmart
app.post('/ps/search', express.json(), async (req, res) => {
    try {
        const requestData = req.body;
        const response = await axios.post('https://www.pricesmart.com/api/br_discovery/getProductsSuggestionByKeyword', requestData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching search results:', error);
        res.status(500).json({ error: 'Failed to fetch search results' });
    }
});

app.listen(port, () => {
    console.log(`Proxy server listening on port ${port}`);
});
