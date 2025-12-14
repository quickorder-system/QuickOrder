/**
 * Eligibility Manager
 * Handles SC/PWD discount management and verification for Admin and Owner
 */

class EligibilityManager {
    constructor(role = 'admin') {
        this.role = role;
        this.verificationFilter = {
            status: '',
            type: ''
        };
    }

    /**
     * Initialize the eligibility manager
     */
    init() {
        this.bindEvents();
        this.loadStatistics();
        this.loadVerificationRequests();
    }

    /**
     * Bind UI events
     */
    bindEvents() {
        // Setup button
        document.getElementById('setupDiscountsBtn')?.addEventListener('click', () => this.setupDefaultDiscounts());

        // Filters
        document.getElementById('verificationStatusFilter')?.addEventListener('change', (e) => {
            this.verificationFilter.status = e.target.value;
            this.loadVerificationRequests();
        });

        document.getElementById('verificationTypeFilter')?.addEventListener('change', (e) => {
            this.verificationFilter.type = e.target.value;
            this.loadVerificationRequests();
        });
    }

    /**
     * Setup default SC/PWD discounts
     */
    async setupDefaultDiscounts() {
        const scPercentage = parseInt(document.getElementById('scPercentage')?.value) || 20;
        const pwdPercentage = parseInt(document.getElementById('pwdPercentage')?.value) || 15;
        const year = parseInt(document.getElementById('discountYear')?.value) || 2026;

        const btn = document.getElementById('setupDiscountsBtn');
        const originalText = btn.innerHTML;

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Setting up...';

            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Authentication token not found. Please login again.');
            }

            const response = await fetch('/api/discounts/setup-eligibility-discounts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    scPercentage,
                    pwdPercentage,
                    year
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to setup discounts');
            }

            alert(`✅ ${data.message}\n\nSC: ${data.discounts.sc.code} - ${data.discounts.sc.discountValue}% off\nPWD: ${data.discounts.pwd.code} - ${data.discounts.pwd.discountValue}% off`);
            
            // Log activity
            if (typeof activityLogger !== 'undefined') {
                activityLogger.logActivity({
                    action: 'SETUP_ELIGIBILITY_DISCOUNTS',
                    details: `Setup SC (${scPercentage}%) and PWD (${pwdPercentage}%) discounts for year ${year}`
                });
            }
        } catch (error) {
            console.error('Setup error:', error);
            alert('Error: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    /**
     * Load and display verification requests
     */
    async loadVerificationRequests() {
        const container = document.getElementById('verificationRequestsList');
        if (!container) return;

        try {
            container.innerHTML = '<p>Loading verification requests...</p>';

            // For now, we'll show a placeholder since the verification requests need to be fetched from backend
            // This would be implemented with a backend endpoint to fetch pending verifications
            
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #999;">
                    <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>No pending verification requests at the moment</p>
                    <p style="font-size: 0.9rem;">Customers will appear here when they submit SC/PWD eligibility claims</p>
                </div>
            `;

        } catch (error) {
            console.error('Error loading verification requests:', error);
            container.innerHTML = '<p style="grid-column: 1 / -1; color: #f44336;">Error loading verification requests</p>';
        }
    }

    /**
     * Create verification card HTML
     */
    createVerificationCard(request) {
        const typeClass = request.type === 'SC' ? 'sc' : 'pwd';
        const typeLabel = request.type === 'SC' ? 'Senior Citizen' : 'PWD';
        const statusClass = request.status || 'pending';

        return `
            <div class="verification-card" data-request-id="${request.id}">
                <div class="verification-header">
                    <div class="verification-user">
                        <div class="verification-user-name">${request.userName}</div>
                        <div class="verification-user-email">${request.userEmail}</div>
                    </div>
                    <span class="verification-type-badge ${typeClass}">${typeLabel}</span>
                </div>
                
                <div class="verification-body">
                    <div class="verification-detail">
                        <label>ID Number:</label>
                        <value>${request.idNumber || 'N/A'}</value>
                    </div>
                    <div class="verification-detail">
                        <label>Status:</label>
                        <span class="verification-status ${statusClass}">${this.formatStatus(request.status)}</span>
                    </div>
                    <div class="verification-detail">
                        <label>Submitted:</label>
                        <value>${new Date(request.submittedAt).toLocaleDateString()}</value>
                    </div>
                    ${request.documentUrl ? `
                        <div class="verification-detail">
                            <label>Document:</label>
                            <a href="${request.documentUrl}" target="_blank" style="color: #667eea;">View ID</a>
                        </div>
                    ` : ''}
                </div>

                ${request.status === 'pending' ? `
                    <div class="verification-actions">
                        <button class="btn-approve" onclick="adminEligibilityManager.approveVerification('${request.id}', '${request.type}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn-reject" onclick="adminEligibilityManager.rejectVerification('${request.id}', '${request.type}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Format status string
     */
    formatStatus(status) {
        const statusMap = {
            'pending': 'Pending Review',
            'approved': 'Approved',
            'rejected': 'Rejected'
        };
        return statusMap[status] || status;
    }

    /**
     * Approve verification
     */
    async approveVerification(requestId, type) {
        if (!confirm(`Approve ${type} eligibility for this customer?`)) return;

        try {
            const token = localStorage.getItem('authToken');
            // This endpoint would be implemented in the backend
            alert('Verification approved! (Endpoint to be implemented)');
        } catch (error) {
            console.error('Error approving verification:', error);
            alert('Error: ' + error.message);
        }
    }

    /**
     * Reject verification
     */
    async rejectVerification(requestId, type) {
        if (!confirm(`Reject ${type} eligibility for this customer?`)) return;

        try {
            const token = localStorage.getItem('authToken');
            // This endpoint would be implemented in the backend
            alert('Verification rejected! (Endpoint to be implemented)');
        } catch (error) {
            console.error('Error rejecting verification:', error);
            alert('Error: ' + error.message);
        }
    }

    /**
     * Load and display statistics
     */
    async loadStatistics() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.warn('No authentication token found');
                return;
            }
            
            const response = await fetch('/api/discounts/eligibility-stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.warn('Failed to load statistics:', response.status);
                return;
            }

            const data = await response.json();
            if (data.stats) {
                document.getElementById('totalSCUsers').textContent = data.stats.totalSCUsers || '0';
                document.getElementById('totalPWDUsers').textContent = data.stats.totalPWDUsers || '0';
                document.getElementById('totalSCDiscounts').textContent = `₱${(data.stats.totalSCDiscountsGiven || 0).toFixed(2)}`;
                document.getElementById('totalPWDDiscounts').textContent = `₱${(data.stats.totalPWDDiscountsGiven || 0).toFixed(2)}`;
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    /**
     * Update statistics display
     */
    updateStatistics(stats) {
        if (stats.totalSCUsers !== undefined) {
            document.getElementById('totalSCUsers').textContent = stats.totalSCUsers;
        }
        if (stats.totalPWDUsers !== undefined) {
            document.getElementById('totalPWDUsers').textContent = stats.totalPWDUsers;
        }
        if (stats.totalSCDiscounts !== undefined) {
            document.getElementById('totalSCDiscounts').textContent = `₱${stats.totalSCDiscounts.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
        }
        if (stats.totalPWDDiscounts !== undefined) {
            document.getElementById('totalPWDDiscounts').textContent = `₱${stats.totalPWDDiscounts.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
        }
    }
}

// Initialize manager when page is ready
let adminEligibilityManager;
document.addEventListener('DOMContentLoaded', () => {
    const eligibilityTab = document.getElementById('eligibilityTab');
    if (eligibilityTab) {
        adminEligibilityManager = new AdminEligibilityManager();
        adminEligibilityManager.init();
    }
});
