class OrderService {
    static async getAllOrders() {
        try {
            const response = await fetch('/api/orders', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return []; // Return empty array for no orders
                }
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            // Check for non-JSON responses
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Invalid response format from server');
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch orders');
            }

            const data = await response.json();
            if (!Array.isArray(data)) {
                throw new Error('Server returned invalid data format');
            }

            return data;
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw new Error(`Failed to fetch orders: ${error.message}`);
        }
    }

    static async updateOrderStatus(orderId, status) {
        try {
            const token = localStorage.getItem('token');
            console.log('Token from localStorage:', token ? 'Token exists (' + token.substring(0, 20) + '...)' : 'NO TOKEN FOUND');
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token || ''
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update order status');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    }

    static async cancelOrder(orderId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token || ''
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to cancel order');
            }

            return await response.json();
        } catch (error) {
            console.error('Error cancelling order:', error);
            throw error;
        }
    }

    static async deleteOrder(orderId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': token || ''
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete order');
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting order:', error);
            throw error;
        }
    }
}

// Add to window object for global access
window.OrderService = OrderService;
