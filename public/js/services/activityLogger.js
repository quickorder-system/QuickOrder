/**
 * Activity Logger Service
 * Used by both Admin and Owner pages to log user actions
 */

// Helper function to decode JWT and get username
const getUsernameFromToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    // Decode JWT (basic decoding - no verification needed on client)
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const decoded = JSON.parse(atob(parts[1]));
    return decoded.user?.username || null;
  } catch (error) {
    console.error('[ActivityLogger] Error decoding token:', error);
    return null;
  }
};

const logActivity = async (action, page, description, details = {}) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[ActivityLogger] No token found, skipping log');
      return;
    }

    const username = getUsernameFromToken();

    const response = await fetch('/api/activity-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({
        action,
        page,
        description,
        details,
        username
      })
    });

    if (!response.ok) {
      console.error('[ActivityLogger] Failed to log activity:', response.status);
    }
  } catch (error) {
    console.error('[ActivityLogger] Error logging activity:', error);
  }
};

const getActivityLogs = async (options = {}) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return [];

    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.action) params.append('action', options.action);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    params.append('limit', options.limit || 50);
    params.append('skip', options.skip || 0);

    const response = await fetch(`/api/activity-logs?${params.toString()}`, {
      headers: {
        'x-auth-token': token
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch logs');
    }

    return await response.json();
  } catch (error) {
    console.error('[ActivityLogger] Error fetching logs:', error);
    return { logs: [], totalCount: 0 };
  }
};

const getActivityStats = async (options = {}) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return [];

    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);

    const response = await fetch(`/api/activity-logs/stats/summary?${params.toString()}`, {
      headers: {
        'x-auth-token': token
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }

    return await response.json();
  } catch (error) {
    console.error('[ActivityLogger] Error fetching stats:', error);
    return { stats: [] };
  }
};

const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

const formatAction = (action) => {
  const actionMap = {
    'CREATE_ITEM': 'Created Item',
    'UPDATE_ITEM': 'Updated Item',
    'DELETE_ITEM': 'Deleted Item',
    'ADD_VARIATION': 'Added Variation',
    'DELETE_VARIATION': 'Deleted Variation',
    'VERIFY_PAYMENT': 'Verified Payment',
    'REJECT_PAYMENT': 'Rejected Payment',
    'UPDATE_ORDER_STATUS': 'Updated Order Status',
    'CREATE_USER': 'Created User',
    'UPDATE_USER': 'Updated User',
    'DELETE_USER': 'Deleted User',
    'GENERATE_REPORT': 'Generated Report',
    'LOGIN': 'Logged In',
    'LOGOUT': 'Logged Out',
    'OTHER': 'Other Action'
  };
  return actionMap[action] || action;
};
