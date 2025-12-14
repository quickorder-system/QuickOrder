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
          <div class="activity-logs-actions">
            <button id="exportExcelBtn" class="btn-export" title="Export to Excel">
              <i class="fas fa-file-excel"></i> Export to Excel
            </button>
            <button id="exportPdfBtn" class="btn-export" title="Export to PDF">
              <i class="fas fa-file-pdf"></i> Export to PDF
            </button>
          </div>
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
              <option value="CREATE_DISCOUNT">Create Discount</option>
              <option value="UPDATE_DISCOUNT">Update Discount</option>
              <option value="DELETE_DISCOUNT">Delete Discount</option>
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
                <th>Role</th>
                <th>Action</th>
                <th>Description</th>
                <th>Before</th>
                <th>After</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody id="activityLogsTableBody">
              <tr><td colspan="8" class="text-center">Loading...</td></tr>
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
    document.getElementById('exportExcelBtn')?.addEventListener('click', () => this.exportToExcel());
    document.getElementById('exportPdfBtn')?.addEventListener('click', () => this.exportToPDF());
    
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
        <td class="log-role"><span class="role-badge ${log.page?.toLowerCase() || 'unknown'}">${log.page || 'Unknown'}</span></td>
        <td class="log-action"><span class="action-badge">${formatAction(log.action)}</span></td>
        <td class="log-description">${log.description || '-'}</td>
        <td class="log-before">
          ${log.beforeData ? `<details><summary>View</summary><pre>${JSON.stringify(log.beforeData, null, 2)}</pre></details>` : '-'}
        </td>
        <td class="log-after">
          ${log.afterData ? `<details><summary>View</summary><pre>${JSON.stringify(log.afterData, null, 2)}</pre></details>` : '-'}
        </td>
        <td class="log-details">
          ${log.details ? `<details><summary>View</summary><pre>${JSON.stringify(log.details, null, 2)}</pre></details>` : '-'}
        </td>
      </tr>
    `).join('');
  }

  renderError(message) {
    const tbody = document.getElementById('activityLogsTableBody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center error">${message}</td></tr>`;
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

  async exportToExcel() {
    try {
      const result = await getActivityLogs({
        action: this.filters.action,
        startDate: this.filters.startDate,
        endDate: this.filters.endDate,
        limit: 10000,
        skip: 0
      });

      const logs = result.logs;
      if (!logs || logs.length === 0) {
        alert('No logs to export');
        return;
      }

      // Prepare data for Excel
      const headers = ['Timestamp', 'User', 'Role', 'Action', 'Description', 'Before Data', 'After Data', 'Additional Details'];
      const data = logs.map(log => [
        formatTimestamp(log.createdAt),
        log.username || log.userId,
        log.page || 'Unknown',
        formatAction(log.action),
        log.description || '-',
        log.beforeData ? JSON.stringify(log.beforeData) : '-',
        log.afterData ? JSON.stringify(log.afterData) : '-',
        log.details ? JSON.stringify(log.details) : '-'
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...data.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.click();
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export logs to Excel');
    }
  }

  async exportToPDF() {
    try {
      const result = await getActivityLogs({
        action: this.filters.action,
        startDate: this.filters.startDate,
        endDate: this.filters.endDate,
        limit: 10000,
        skip: 0
      });

      const logs = result.logs;
      if (!logs || logs.length === 0) {
        alert('No logs to export');
        return;
      }

      // Create PDF content using a simple approach
      let pdfContent = `Activity Log Report\nGenerated on: ${new Date().toLocaleString()}\n\n`;
      pdfContent += `Total Records: ${logs.length}\n`;
      pdfContent += `Applied Filters - Action: ${this.filters.action || 'All'}, Date Range: ${this.filters.startDate || 'N/A'} to ${this.filters.endDate || 'N/A'}\n\n`;
      pdfContent += '='.repeat(120) + '\n\n';

      logs.forEach((log, index) => {
        pdfContent += `[${index + 1}] ${formatTimestamp(log.createdAt)}\n`;
        pdfContent += `User: ${log.username || log.userId}\n`;
        pdfContent += `Role: ${log.page || 'Unknown'}\n`;
        pdfContent += `Action: ${formatAction(log.action)}\n`;
        pdfContent += `Description: ${log.description || '-'}\n`;
        if (log.beforeData) pdfContent += `Before: ${JSON.stringify(log.beforeData)}\n`;
        if (log.afterData) pdfContent += `After: ${JSON.stringify(log.afterData)}\n`;
        if (log.details) pdfContent += `Details: ${JSON.stringify(log.details)}\n`;
        pdfContent += '-'.repeat(120) + '\n\n';
      });

      // For proper PDF generation, you might want to use a library like jsPDF
      // For now, we'll create a text file as alternative
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.txt`);
      link.click();
      
      alert('PDF exported as text file. For better PDF formatting, integrate jsPDF library.');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export logs to PDF');
    }
  }
}

// Auto-initialize if element exists
document.addEventListener('DOMContentLoaded', () => {
  const component = new ActivityLogsComponent('activityLogsContainer');
  if (document.getElementById('activityLogsContainer')) {
    component.init();
  }
});
