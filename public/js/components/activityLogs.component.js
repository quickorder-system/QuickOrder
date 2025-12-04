/**
 * Activity Logs Component
 * Displays and filters activity logs for Admin and Owner pages
 */

class ActivityLogsComponent {
  constructor(containerId = 'activityLogsContainer') {
    this.containerId = containerId;
    this.currentPage = 1;
    this.itemsPerPage = 15;
    this.filters = {
      action: '',
      startDate: '',
      endDate: ''
    };
  }

  async init() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Create UI
    this.createUI();
    await this.loadLogs();
  }

  createUI() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const html = `
      <div class="activity-logs-wrapper">
        <div class="activity-logs-header">
          <h3><i class="fas fa-history"></i> Activity Logs</h3>
        </div>

        <div class="activity-logs-filters">
          <div class="filter-group">
            <label for="activityAction">Action:</label>
            <select id="activityAction" class="filter-select">
              <option value="">All Actions</option>
              <option value="CREATE_ITEM">Create Item</option>
              <option value="UPDATE_ITEM">Update Item</option>
              <option value="DELETE_ITEM">Delete Item</option>
              <option value="CREATE_CATEGORY">Create Category</option>
              <option value="UPDATE_CATEGORY">Update Category</option>
              <option value="DELETE_CATEGORY">Delete Category</option>
              <option value="VERIFY_PAYMENT">Verify Payment</option>
              <option value="REJECT_PAYMENT">Reject Payment</option>
              <option value="UPDATE_ORDER_STATUS">Update Order Status</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="activityStartDate">From:</label>
            <input type="date" id="activityStartDate" class="filter-input">
          </div>

          <div class="filter-group">
            <label for="activityEndDate">To:</label>
            <input type="date" id="activityEndDate" class="filter-input">
          </div>

          <button id="activityFilterBtn" class="btn-filter">
            <i class="fas fa-search"></i> Filter
          </button>
          <button id="activityClearBtn" class="btn-clear">
            <i class="fas fa-redo"></i> Clear
          </button>
        </div>

        <div class="activity-logs-table-wrapper">
          <table class="activity-logs-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Description</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody id="activityLogsTableBody">
              <tr><td colspan="5" class="text-center">Loading...</td></tr>
            </tbody>
          </table>
        </div>

        <div class="activity-logs-pagination">
          <button id="activityPrevBtn" class="btn-pagination" disabled>← Previous</button>
          <span id="activityPageInfo">Page 1</span>
          <button id="activityNextBtn" class="btn-pagination">Next →</button>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attach event listeners
    document.getElementById('activityFilterBtn')?.addEventListener('click', () => this.applyFilters());
    document.getElementById('activityClearBtn')?.addEventListener('click', () => this.clearFilters());
    document.getElementById('activityPrevBtn')?.addEventListener('click', () => this.previousPage());
    document.getElementById('activityNextBtn')?.addEventListener('click', () => this.nextPage());
    
    // Allow Enter key in filters
    document.getElementById('activityAction')?.addEventListener('change', (e) => {
      this.filters.action = e.target.value;
    });
    document.getElementById('activityStartDate')?.addEventListener('change', (e) => {
      this.filters.startDate = e.target.value;
    });
    document.getElementById('activityEndDate')?.addEventListener('change', (e) => {
      this.filters.endDate = e.target.value;
    });
  }

  async loadLogs(page = 1) {
    this.currentPage = page;
    const skip = (page - 1) * this.itemsPerPage;

    try {
      const result = await getActivityLogs({
        action: this.filters.action,
        startDate: this.filters.startDate,
        endDate: this.filters.endDate,
        limit: this.itemsPerPage,
        skip: skip
      });

      this.renderLogs(result.logs);
      this.updatePagination(result.totalCount);
    } catch (error) {
      console.error('Error loading activity logs:', error);
      this.renderError('Failed to load activity logs');
    }
  }

  renderLogs(logs) {
    const tbody = document.getElementById('activityLogsTableBody');
    if (!tbody) return;

    if (!logs || logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No activity logs found</td></tr>';
      return;
    }

    tbody.innerHTML = logs.map(log => `
      <tr class="log-row">
        <td class="log-timestamp">${formatTimestamp(log.createdAt)}</td>
        <td class="log-user">${log.username || log.userId}</td>
        <td class="log-action"><span class="action-badge">${formatAction(log.action)}</span></td>
        <td class="log-description">${log.description || '-'}</td>
        <td class="log-details">
          ${log.details ? `<details><summary>View</summary><pre>${JSON.stringify(log.details, null, 2)}</pre></details>` : '-'}
        </td>
      </tr>
    `).join('');
  }

  renderError(message) {
    const tbody = document.getElementById('activityLogsTableBody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center error">${message}</td></tr>`;
    }
  }

  updatePagination(totalCount) {
    const totalPages = Math.ceil(totalCount / this.itemsPerPage);
    const prevBtn = document.getElementById('activityPrevBtn');
    const nextBtn = document.getElementById('activityNextBtn');
    const pageInfo = document.getElementById('activityPageInfo');

    if (prevBtn) prevBtn.disabled = this.currentPage === 1;
    if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
    if (pageInfo) pageInfo.textContent = `Page ${this.currentPage} of ${totalPages || 1}`;
  }

  async applyFilters() {
    this.currentPage = 1;
    await this.loadLogs(1);
  }

  clearFilters() {
    this.filters = { action: '', startDate: '', endDate: '' };
    document.getElementById('activityAction').value = '';
    document.getElementById('activityStartDate').value = '';
    document.getElementById('activityEndDate').value = '';
    this.currentPage = 1;
    this.loadLogs(1);
  }

  async previousPage() {
    if (this.currentPage > 1) {
      await this.loadLogs(this.currentPage - 1);
      window.scrollTo(0, 0);
    }
  }

  async nextPage() {
    await this.loadLogs(this.currentPage + 1);
    window.scrollTo(0, 0);
  }
}

// Auto-initialize if element exists
document.addEventListener('DOMContentLoaded', () => {
  const component = new ActivityLogsComponent('activityLogsContainer');
  if (document.getElementById('activityLogsContainer')) {
    component.init();
  }
});
