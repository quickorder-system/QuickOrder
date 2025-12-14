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

      // Check if jsPDF is available
      if (typeof jspdf === 'undefined' || !jspdf.jsPDF) {
        alert('jsPDF library not loaded. Please ensure the library is properly included.');
        return;
      }

      const { jsPDF } = jspdf;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      let yPosition = margin;

      // Add header
      doc.setFontSize(16);
      doc.text('Activity Log Report', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Total Records: ${logs.length}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Applied Filters - Action: ${this.filters.action || 'All'}, Date Range: ${this.filters.startDate || 'N/A'} to ${this.filters.endDate || 'N/A'}`, margin, yPosition);
      yPosition += 10;

      // Add table header
      const columns = ['Timestamp', 'User', 'Role', 'Action', 'Description'];
      const columnWidths = {
        timestamp: 30,
        user: 25,
        role: 15,
        action: 30,
        description: 50
      };

      doc.setFontSize(9);
      doc.setFillColor(100, 120, 150);
      doc.setTextColor(255, 255, 255);

      let columnX = margin;
      columns.forEach((col, idx) => {
        const widths = [30, 25, 15, 30, 50];
        doc.rect(columnX, yPosition - 4, widths[idx], 6, 'F');
        doc.text(col, columnX + 2, yPosition);
        columnX += widths[idx];
      });

      yPosition += 8;
      doc.setTextColor(0, 0, 0);

      // Add rows
      logs.forEach((log) => {
        const timestamp = formatTimestamp(log.createdAt);
        const user = log.username || log.userId || '-';
        const role = log.page || 'Unknown';
        const action = formatAction(log.action);
        const description = log.description || '-';

        // Check if we need a new page
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(8);
        columnX = margin;

        // Timestamp
        doc.text(timestamp, columnX + 1, yPosition);
        columnX += 30;

        // User
        doc.text(user.substring(0, 15), columnX + 1, yPosition);
        columnX += 25;

        // Role
        doc.text(role, columnX + 1, yPosition);
        columnX += 15;

        // Action
        doc.text(action.substring(0, 20), columnX + 1, yPosition);
        columnX += 30;

        // Description
        const descLines = doc.splitTextToSize(description.substring(0, 40), 48);
        doc.text(descLines[0] || '-', columnX + 1, yPosition);

        yPosition += (descLines.length > 1 ? descLines.length * 3 : 5);
      });

      // Save the PDF
      doc.save(`activity_logs_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export logs to PDF: ' + error.message);
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
