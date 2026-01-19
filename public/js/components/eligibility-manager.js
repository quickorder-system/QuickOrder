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
        const pwdPercentage = parseInt(document.getElementById('pwdPercentage')?.value) || 20;
        const year = parseInt(document.getElementById('discountYear')?.value) || 2026;

        const btn = document.getElementById('setupDiscountsBtn');
        const originalText = btn.innerHTML;

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Setting up...';

            const token = localStorage.getItem('token');
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

            const token = localStorage.getItem('token');
            console.log('[EligibilityManager] loadVerificationRequests - Token exists:', !!token);
            const response = await fetch('/api/customers/pending-verifications', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Verification requests response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error:', response.status, errorData);
                throw new Error(`Failed to fetch verification requests: ${response.status}`);
            }

            const result = await response.json();
            console.log('Verification requests result:', result);
            const requests = result.data || [];

            if (requests.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #999;">
                        <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                        <p>No verification requests found</p>
                        <p style="font-size: 0.9rem;">Customers will appear here when they submit SC/PWD eligibility claims</p>
                    </div>
                `;
                return;
            }

            // Filter based on selected filters
            let filtered = requests;
            if (this.verificationFilter.type) {
                filtered = filtered.filter(r => r.typeShort === this.verificationFilter.type);
            }
            if (this.verificationFilter.status) {
                filtered = filtered.filter(r => r.status === this.verificationFilter.status);
            }

            if (filtered.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #999;">
                        <p>No requests match your filter</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = filtered.map(request => this.createVerificationCard(request)).join('');

        } catch (error) {
            console.error('Error loading verification requests:', error);
            console.error('Error stack:', error.stack);
            container.innerHTML = '<p style="grid-column: 1 / -1; color: #f44336;">Error loading verification requests: ' + error.message + '</p>';
        }
    }

    /**
     * Create verification card HTML
     */
    createVerificationCard(request) {
        const typeClass = request.typeShort === 'SC' ? 'sc' : 'pwd';
        const typeLabel = request.typeShort === 'SC' ? 'Senior Citizen' : 'PWD';
        const statusClass = request.status || 'pending';
        
        // Determine status icon
        const statusIcon = {
            'pending': '⏳',
            'approved': '✅',
            'rejected': '❌'
        }[request.status] || '❓';

        // Build document preview if available
        const documentHtml = request.document ? `
            <div class="verification-document-preview">
                <label>Uploaded Document:</label>
                <div class="document-preview-container">
                    <img src="${request.document}" alt="ID Document" class="document-image clickable-document" onclick="window.eligibilityManager.openDocumentModal('${request.document}', '${request.userName}')" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22 font-family=%22Arial%22 font-size=%2212%22%3ENo Image%3C/text%3E%3C/svg%3E'" style="cursor: pointer;">
                    <span class="image-hint">Click to enlarge</span>
                </div>
                <a href="${request.document}" target="_blank" class="document-link">
                    <i class="fas fa-download"></i> Download Document
                </a>
            </div>
        ` : `
            <div class="verification-document-preview">
                <label>Document:</label>
                <p class="no-document">No document uploaded</p>
            </div>
        `;

        return `
            <div class="verification-card ${statusClass}" data-request-id="${request.id}">
                <div class="verification-header">
                    <div class="verification-user">
                        <div class="verification-user-name">${request.userName}</div>
                        <div class="verification-user-email">${request.userEmail}</div>
                    </div>
                    <div class="verification-header-right">
                        <span class="verification-type-badge ${typeClass}">${typeLabel}</span>
                        <span class="verification-status-badge ${statusClass}">
                            ${statusIcon} ${this.formatStatus(request.status)}
                        </span>
                    </div>
                </div>
                
                <div class="verification-body">
                    <div class="verification-detail">
                        <label>ID Number:</label>
                        <value>${request.idNumber || 'N/A'}</value>
                    </div>
                    
                    ${documentHtml}
                    
                    ${request.verifiedAt ? `
                        <div class="verification-detail">
                            <label>Verified On:</label>
                            <value>${new Date(request.verifiedAt).toLocaleDateString()} at ${new Date(request.verifiedAt).toLocaleTimeString()}</value>
                        </div>
                    ` : ''}
                </div>

                ${request.status === 'pending' ? `
                    <div class="verification-actions">
                        <button class="btn-approve" onclick="window.eligibilityManager.approveVerification('${request.customerId}', '${request.typeShort}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn-reject" onclick="window.eligibilityManager.rejectVerification('${request.customerId}', '${request.typeShort}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                ` : `
                    <div class="verification-actions-readonly">
                        <span class="status-locked">
                            <i class="fas fa-lock"></i> ${this.formatStatus(request.status)}
                        </span>
                    </div>
                `}
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
     * Open document in modal
     */
    openDocumentModal(documentUrl, customerName) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('documentModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'documentModal';
            modal.className = 'document-modal';
            modal.innerHTML = `
                <div class="document-modal-content">
                    <button class="document-modal-close" onclick="window.eligibilityManager.closeDocumentModal()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="document-modal-header">
                        <h3 id="documentModalTitle"></h3>
                    </div>
                    <div class="document-modal-body">
                        <img id="documentModalImage" src="" alt="Document" class="document-modal-image">
                    </div>
                    <div class="document-modal-footer">
                        <a id="documentModalDownload" href="" target="_blank" class="btn-download-full">
                            <i class="fas fa-download"></i> Download Full Size
                        </a>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeDocumentModal();
                }
            });
            
            // Close modal on ESC key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeDocumentModal();
                }
            });
        }
        
        // Populate modal with image data
        document.getElementById('documentModalTitle').textContent = `ID Document - ${customerName}`;
        document.getElementById('documentModalImage').src = documentUrl;
        document.getElementById('documentModalDownload').href = documentUrl;
        
        // Show modal
        modal.classList.add('show');
    }

    /**
     * Close document modal
     */
    closeDocumentModal() {
        const modal = document.getElementById('documentModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    /**
     * Approve verification
     */
    async approveVerification(requestId, type) {
        if (!confirm(`Approve ${type} eligibility for this customer?`)) return;

        try {
            const token = localStorage.getItem('token');
            const eligibilityType = type === 'SC' ? 'SC' : 'PWD';
            
            const response = await fetch('/api/customers/verify-eligibility', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customerId: requestId,
                    eligibilityType: eligibilityType,
                    approveStatus: 'approved'
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to approve verification');
            }

            alert('Verification approved successfully!');
            this.loadVerificationRequests();
            this.loadStatistics();
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
            const token = localStorage.getItem('token');
            const eligibilityType = type === 'SC' ? 'SC' : 'PWD';
            
            const response = await fetch('/api/customers/verify-eligibility', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customerId: requestId,
                    eligibilityType: eligibilityType,
                    approveStatus: 'rejected'
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to reject verification');
            }

            alert('Verification rejected successfully!');
            this.loadVerificationRequests();
            this.loadStatistics();
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
            const token = localStorage.getItem('token');
            console.log('[EligibilityManager] loadStatistics - Token exists:', !!token);
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
                document.getElementById('totalSCDiscounts').textContent = `₱${(data.stats.totalSCDiscounts || 0).toFixed(2)}`;
                document.getElementById('totalPWDDiscounts').textContent = `₱${(data.stats.totalPWDDiscounts || 0).toFixed(2)}`;
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
