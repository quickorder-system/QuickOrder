/**
 * Discount Manager Component
 * Handles admin discount management UI and operations
 */

class DiscountManager {
    constructor() {
        this.discounts = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.searchTerm = '';
        this.filterStatus = '';
        this.editingDiscountId = null;
    }

    /**
     * Initialize discount manager
     */
    async init() {
        this.renderPanel();
        this.attachEventListeners();
        await this.loadDiscounts();
    }

    /**
     * Render discount panel HTML
     */
    renderPanel() {
        const container = document.getElementById('discountPanelContainer');
        if (!container) return;

        const panelHTML = `
            <div class="discount-panel">
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

        container.innerHTML = panelHTML;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // New discount button
        const newBtn = document.getElementById('newDiscountBtn');
        if (newBtn) {
            newBtn.addEventListener('click', () => this.openForm());
        }

        // Search and filter
        const searchInput = document.getElementById('discountSearch');
        const statusFilter = document.getElementById('discountStatusFilter');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.currentPage = 1;
                this.renderDiscounts();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterStatus = e.target.value;
                this.currentPage = 1;
                this.renderDiscounts();
            });
        }

        // Form events
        const form = document.getElementById('discountForm');
        const closeBtn = document.getElementById('closeDiscountForm');
        const cancelBtn = document.getElementById('cancelDiscountForm');

        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeForm());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeForm());
        }
    }

    /**
     * Load discounts from API
     */
    async loadDiscounts() {
        try {
            const response = await discountService.getActiveDiscounts();
            this.discounts = response.discounts || [];
            this.renderDiscounts();
        } catch (error) {
            console.error('Error loading discounts:', error);
            this.showError('Failed to load discounts');
        }
    }

    /**
     * Render discount list
     */
    renderDiscounts() {
        const container = document.getElementById('discountListContainer');
        if (!container) return;

        // Filter discounts
        let filtered = this.discounts;

        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(d => 
                d.code.toLowerCase().includes(term) ||
                d.description.toLowerCase().includes(term)
            );
        }

        if (this.filterStatus !== '') {
            const isActive = this.filterStatus === 'true';
            filtered = filtered.filter(d => d.isActive === isActive);
        }

        // Paginate
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const paginated = filtered.slice(start, end);

        // Render items
        if (paginated.length === 0) {
            container.innerHTML = '<div class="empty-state">No discounts found. Create one to get started!</div>';
        } else {
            container.innerHTML = paginated
                .map(discount => this.createDiscountItemHTML(discount))
                .join('');

            // Attach event listeners to buttons
            container.querySelectorAll('.btn-edit-discount').forEach(btn => {
                btn.addEventListener('click', () => this.openForm(btn.dataset.id));
            });

            container.querySelectorAll('.btn-delete-discount').forEach(btn => {
                btn.addEventListener('click', () => this.deleteDiscount(btn.dataset.id));
            });
        }

        // Render pagination
        this.renderPagination(filtered.length);
    }

    /**
     * Create discount item HTML
     */
    createDiscountItemHTML(discount) {
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
    }

    /**
     * Render pagination
     */
    renderPagination(total) {
        const container = document.getElementById('discountPagination');
        if (!container) return;

        const pages = Math.ceil(total / this.pageSize);
        if (pages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';
        for (let i = 1; i <= pages; i++) {
            html += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="window.discountManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        container.innerHTML = html;
    }

    /**
     * Go to page
     */
    goToPage(page) {
        this.currentPage = page;
        this.renderDiscounts();
    }

    /**
     * Open form (create or edit)
     */
    openForm(discountId = null) {
        const modal = document.getElementById('discountFormModal');
        const title = document.getElementById('formTitle');
        const form = document.getElementById('discountForm');

        if (!modal || !form) return;

        this.editingDiscountId = discountId;

        if (discountId) {
            title.textContent = 'Edit Discount';
            const discount = this.discounts.find(d => d._id === discountId);
            
            if (discount) {
                document.getElementById('code').value = discount.code;
                document.getElementById('description').value = discount.description || '';
                document.getElementById('discountType').value = discount.discountType;
                document.getElementById('discountValue').value = discount.discountValue;
                document.getElementById('minOrderAmount').value = discount.minOrderAmount || '';
                document.getElementById('maxDiscountAmount').value = discount.maxDiscountAmount || '';
                document.getElementById('maxUsagePerCustomer').value = discount.maxUsagePerCustomer || '';
                document.getElementById('maxTotalUsage').value = discount.maxTotalUsage || '';
                document.getElementById('startDate').value = new Date(discount.startDate).toISOString().slice(0, 16);
                document.getElementById('endDate').value = new Date(discount.endDate).toISOString().slice(0, 16);
                document.getElementById('isActive').checked = discount.isActive;
                document.getElementById('code').disabled = true; // Can't change code
            }
        } else {
            title.textContent = 'Create New Discount';
            form.reset();
            document.getElementById('code').disabled = false;
        }

        modal.style.display = 'flex';
    }

    /**
     * Close form
     */
    closeForm() {
        const modal = document.getElementById('discountFormModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.editingDiscountId = null;
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit(e) {
        e.preventDefault();

        const data = {
            code: document.getElementById('code').value.toUpperCase(),
            description: document.getElementById('description').value,
            discountType: document.getElementById('discountType').value,
            discountValue: parseFloat(document.getElementById('discountValue').value),
            minOrderAmount: parseFloat(document.getElementById('minOrderAmount').value) || 0,
            maxDiscountAmount: document.getElementById('maxDiscountAmount').value 
                ? parseFloat(document.getElementById('maxDiscountAmount').value) 
                : null,
            maxUsagePerCustomer: document.getElementById('maxUsagePerCustomer').value 
                ? parseInt(document.getElementById('maxUsagePerCustomer').value) 
                : null,
            maxTotalUsage: document.getElementById('maxTotalUsage').value 
                ? parseInt(document.getElementById('maxTotalUsage').value) 
                : null,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            isActive: document.getElementById('isActive').checked
        };

        try {
            if (this.editingDiscountId) {
                await discountService.updateDiscount(this.editingDiscountId, data);
                this.showSuccess('Discount updated successfully');
            } else {
                await discountService.createDiscount(data);
                this.showSuccess('Discount created successfully');
            }

            await this.loadDiscounts();
            this.closeForm();
        } catch (error) {
            this.showFormError(error.message);
        }
    }

    /**
     * Delete discount
     */
    async deleteDiscount(discountId) {
        if (!confirm('Are you sure you want to delete this discount?')) {
            return;
        }

        try {
            await discountService.deleteDiscount(discountId);
            this.showSuccess('Discount deleted successfully');
            await this.loadDiscounts();
        } catch (error) {
            this.showError('Failed to delete discount: ' + error.message);
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        // You can use a toast notification here
        console.log('Success:', message);
        alert(message); // Simple fallback
    }

    /**
     * Show form error
     */
    showFormError(message) {
        const errorEl = document.getElementById('formError');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('Error:', message);
        alert(message); // Simple fallback
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('discountPanelContainer')) {
        window.discountManager = new DiscountManager();
        window.discountManager.init();
    }
});
