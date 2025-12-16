/**
 * Discount UI Utilities
 * Reusable UI components and helpers for discount features
 */

const discountUIUtils = {
    /**
     * Create discount input HTML section with automatic discount support
     * @returns {string} HTML for discount input section
     */
    createDiscountInputSection() {
        return `
            <div class="discount-section" id="discountSection">
                <!-- Automatic Discounts (SC/PWD) -->
                <div id="automaticDiscountsContainer" style="display: none;">
                    <div class="automatic-discounts-box">
                        <h4 class="discount-label">
                            <i class="fas fa-gift"></i> Your Eligible Discounts
                        </h4>
                        <div id="eligibleDiscountsList" class="eligible-discounts-list">
                            <!-- Will be populated dynamically -->
                        </div>
                    </div>
                </div>

                <!-- Manual Discount Code -->
                <div class="discount-input-container">
                    <h4 class="discount-label">💰 Have a Discount Code?</h4>
                    <div class="discount-input-group">
                        <input 
                            type="text" 
                            id="discountCode" 
                            class="discount-input" 
                            placeholder="Enter discount code"
                            maxlength="20"
                        >
                        <button 
                            type="button" 
                            class="btn-apply-discount"
                            id="applyDiscountBtn"
                        >
                            Apply
                        </button>
                    </div>
                    <div id="discountMessage" class="discount-message" style="display: none;"></div>
                </div>

                <!-- Applied Discount Display -->
                <div id="appliedDiscountDisplay" class="applied-discount" style="display: none;">
                    <div class="discount-badge">
                        <span class="discount-code" id="appliedCode"></span>
                        <span class="discount-amount" id="discountAmount"></span>
                        <button 
                            type="button" 
                            class="btn-remove-discount" 
                            id="removeDiscountBtn"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Create HTML for a single eligible discount option
     * @param {Object} discount - Discount object
     * @returns {string} HTML for discount option
     */
    createEligibleDiscountOption(discount) {
        const icon = discount.type === 'SC' ? '<i class="fas fa-user-tie"></i>' : '<i class="fas fa-wheelchair"></i>';
        const typeLabel = discount.type === 'SC' ? 'Senior Citizen' : 'PWD';
        
        // Add verification status badge based on verificationStatus field
        let statusBadge = '';
        let disabledAttr = '';
        let disabledClass = '';
        let tooltipText = '';
        
        if (discount.verificationStatus === 'approved') {
            statusBadge = `<span class="verification-badge approved" title="Your ${typeLabel} eligibility is approved"><i class="fas fa-check-circle"></i> Approved</span>`;
            tooltipText = `Your ${typeLabel} eligibility has been approved. You can use this discount!`;
        } else if (discount.verificationStatus === 'rejected') {
            statusBadge = `<span class="verification-badge rejected" title="Your ${typeLabel} eligibility was rejected"><i class="fas fa-times-circle"></i> Rejected</span>`;
            disabledAttr = 'disabled';
            disabledClass = ' disabled';
            tooltipText = `Your ${typeLabel} eligibility was rejected. Please review and resubmit if needed.`;
        } else {
            statusBadge = `<span class="verification-badge pending" title="Your ${typeLabel} eligibility is pending admin approval"><i class="fas fa-hourglass-half"></i> Pending</span>`;
            disabledAttr = 'disabled';
            disabledClass = ' disabled';
            tooltipText = `Your ${typeLabel} eligibility is pending admin verification. You'll be able to use this discount once approved.`;
        }
        
        return `
            <label class="discount-option${disabledClass}" data-discount-id="${discount.id}" title="${tooltipText}">>
                <input 
                    type="radio" 
                    name="automaticDiscount" 
                    value="${discount.id}"
                    data-discount-type="${discount.type}"
                    data-discount-code="${discount.code}"
                    data-discount-value="${discount.discountValue}"
                    data-discount-type-name="${discount.discountType}"
                    ${disabledAttr}
                >
                <span class="discount-option-content">
                    <span class="discount-option-header">
                        ${icon}
                        <span class="discount-option-title">${typeLabel} Discount</span>
                        <span class="discount-option-amount">${discount.discountValue}% OFF</span>
                    </span>
                    <span class="discount-option-description">${discount.description}</span>
                    <span class="discount-status-row">${statusBadge}</span>
                </span>
            </label>
        `;
    },

    /**
     * Show message (success or error)
     * @param {string} message - Message text
     * @param {string} type - 'success' or 'error'
     */
    showMessage(message, type = 'success') {
        // Try to find existing message element
        let messageEl = document.getElementById('discountMessage');
        
        // If not found, create a temporary alert
        if (!messageEl) {
            // Create a simple alert div at the top of discount section
            const discountSection = document.getElementById('discountSection');
            if (discountSection) {
                messageEl = document.createElement('div');
                messageEl.id = 'discountMessage';
                messageEl.className = `discount-message ${type}`;
                messageEl.textContent = message;
                messageEl.style.cssText = `
                    display: block;
                    padding: 12px 16px;
                    margin: 8px 0;
                    border-radius: 4px;
                    font-size: 14px;
                    font-weight: 500;
                    ${type === 'success' ? 'background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 'background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'}
                `;
                discountSection.insertBefore(messageEl, discountSection.firstChild);
            } else {
                // Fallback: use browser alert
                alert(`[${type.toUpperCase()}] ${message}`);
                return;
            }
        } else {
            messageEl.textContent = message;
            messageEl.className = `discount-message ${type}`;
            messageEl.style.display = 'block';
        }
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (messageEl) {
                messageEl.style.display = 'none';
            }
        }, 5000);
    },

    /**
     * Create discount admin panel HTML
     * @returns {string} HTML for discount management panel
     */
    createDiscountAdminPanel() {
        return `
            <div id="discountPanel" class="admin-panel discount-panel" style="display: none;">
                <div class="panel-header">
                    <h3>💰 Discount Management</h3>
                    <button class="btn-new-discount" id="newDiscountBtn">+ New Discount</button>
                </div>

                <div class="panel-content">
                    <!-- Filters -->
                    <div class="filter-section">
                        <input 
                            type="text" 
                            id="discountSearch" 
                            placeholder="Search discounts..." 
                            class="search-input"
                        >
                        <select id="discountStatusFilter" class="filter-select">
                            <option value="">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>

                    <!-- Discount List -->
                    <div id="discountListContainer" class="discount-list">
                        <div class="loading">Loading discounts...</div>
                    </div>

                    <!-- Pagination -->
                    <div id="discountPagination" class="pagination"></div>
                </div>
            </div>

            <!-- Create/Edit Discount Modal -->
            <div id="discountFormModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <span class="close" id="closeDiscountForm">&times;</span>
                    <h2 id="formTitle">Create New Discount</h2>
                    <form id="discountForm">
                        <div class="form-group">
                            <label for="code">Discount Code *</label>
                            <input 
                                type="text" 
                                id="code" 
                                required 
                                placeholder="e.g., WELCOME10"
                                maxlength="20"
                            >
                            <small>Uppercase letters and numbers only</small>
                        </div>

                        <div class="form-group">
                            <label for="description">Description</label>
                            <textarea 
                                id="description" 
                                placeholder="e.g., Welcome bonus for new customers"
                                rows="2"
                            ></textarea>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="discountType">Type *</label>
                                <select id="discountType" required>
                                    <option value="">Select Type</option>
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (₱)</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="discountValue">Value *</label>
                                <input 
                                    type="number" 
                                    id="discountValue" 
                                    required 
                                    min="1" 
                                    placeholder="e.g., 10"
                                >
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="minOrderAmount">Minimum Order Amount (₱)</label>
                            <input 
                                type="number" 
                                id="minOrderAmount" 
                                min="0" 
                                placeholder="0 for no minimum"
                            >
                        </div>

                        <div class="form-group">
                            <label for="maxDiscountAmount">Max Discount Amount (₱)</label>
                            <input 
                                type="number" 
                                id="maxDiscountAmount" 
                                min="0" 
                                placeholder="Leave empty for no limit"
                            >
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="maxUsagePerCustomer">Uses Per Customer</label>
                                <input 
                                    type="number" 
                                    id="maxUsagePerCustomer" 
                                    min="1" 
                                    placeholder="e.g., 1"
                                >
                            </div>

                            <div class="form-group">
                                <label for="maxTotalUsage">Total Uses Limit</label>
                                <input 
                                    type="number" 
                                    id="maxTotalUsage" 
                                    min="1" 
                                    placeholder="e.g., 100"
                                >
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="startDate">Start Date *</label>
                                <input type="datetime-local" id="startDate" required>
                            </div>

                            <div class="form-group">
                                <label for="endDate">End Date *</label>
                                <input type="datetime-local" id="endDate" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="isActive" checked>
                                Active
                            </label>
                        </div>

                        <div id="formError" class="error-message" style="display: none;"></div>

                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Save Discount</button>
                            <button type="button" class="btn-secondary" id="cancelDiscountForm">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    /**
     * Create discount list item HTML
     * @param {object} discount - Discount object
     * @returns {string} HTML for discount list item
     */
    createDiscountListItem(discount) {
        const startDate = new Date(discount.startDate).toLocaleDateString();
        const endDate = new Date(discount.endDate).toLocaleDateString();
        const status = discount.isActive ? '✓ Active' : '✗ Inactive';
        const usageInfo = discount.maxTotalUsage 
            ? `${discount.currentUsage}/${discount.maxTotalUsage}` 
            : `${discount.currentUsage}`;

        return `
            <div class="discount-item" data-id="${discount._id}">
                <div class="discount-info">
                    <div class="discount-code-badge">${discount.code}</div>
                    <div class="discount-details">
                        <p class="description">${discount.description || 'No description'}</p>
                        <div class="meta">
                            <span class="type">${discount.discountType === 'percentage' ? `${discount.discountValue}%` : `₱${discount.discountValue}`}</span>
                            <span class="dates">${startDate} to ${endDate}</span>
                            <span class="usage">Uses: ${usageInfo}</span>
                            <span class="status ${discount.isActive ? 'active' : 'inactive'}">${status}</span>
                        </div>
                    </div>
                </div>
                <div class="discount-actions">
                    <button class="btn-edit-discount" data-id="${discount._id}">Edit</button>
                    <button class="btn-delete-discount" data-id="${discount._id}">Delete</button>
                </div>
            </div>
        `;
    },

    /**
     * Display applied discount in order summary
     * @param {object} discount - Applied discount data
     * @param {object} orderTotal - Order total details
     */
    displayAppliedDiscount(discount, orderTotal) {
        const display = document.getElementById('appliedDiscountDisplay');
        const codeEl = document.getElementById('appliedCode');
        const amountEl = document.getElementById('discountAmount');

        if (!display || !codeEl || !amountEl) return;

        codeEl.textContent = discount.code;
        amountEl.textContent = `-₱${orderTotal.discountAmount}`;

        display.style.display = 'block';
    },

    /**
     * Hide applied discount display
     */
    hideAppliedDiscount() {
        const display = document.getElementById('appliedDiscountDisplay');
        if (display) {
            display.style.display = 'none';
        }
    },

    /**
     * Clear discount input
     */
    clearDiscountInput() {
        const input = document.getElementById('discountCode');
        const message = document.getElementById('discountMessage');

        if (input) input.value = '';
        if (message) message.style.display = 'none';

        this.hideAppliedDiscount();
    },

    /**
     * Disable discount input (during processing)
     * @param {boolean} disable - True to disable, false to enable
     */
    setDiscountInputDisabled(disable) {
        const input = document.getElementById('discountCode');
        const btn = document.getElementById('applyDiscountBtn');

        if (input) input.disabled = disable;
        if (btn) {
            btn.disabled = disable;
            btn.textContent = disable ? 'Validating...' : 'Apply';
        }
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = discountUIUtils;
}
