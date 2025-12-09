const ApiService = {
    baseUrl: window.location.origin,

    async request(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        try {
            const response = await fetch(this.baseUrl + endpoint, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`ApiService ${method} request to ${endpoint} failed:`, error);
            throw error;
        }
    },

    async get(endpoint) {
        return this.request(endpoint);
    },

    async post(endpoint, body) {
        return this.request(endpoint, 'POST', body);
    },

    async uploadImage(file) {
        const formData = new FormData();
        formData.append('paymentScreenshot', file);

        try {
            const response = await fetch(this.baseUrl + '/api/upload', {
                method: 'POST',
                body: formData,
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('ApiService uploadImage request failed:', error);
            throw error;
        }
    },

    async createOrder(orderData) {
        return this.post('/api/orders', orderData);
    },

    async getInventory() {
        return this.get('/api/inventory');
    },

    async checkApiHealth() {
        try {
            await this.get('/api/health');
            console.log('API connection OK!');
        } catch (error) {
            console.error('API connection FAILED!');
        }
    }
};