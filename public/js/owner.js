// ===== State Variables for Reports =====
let chartInstance = null;
let reportChartData = null;
let isLoadingReport = false;
let reportError = null;
let isDisplayingQuickReport = false; // Flag to prevent auto-fetch during quick reports

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', function() {
  if (confirm('Are you sure you want to log out?')) {
    window.location.href = 'Login.html';
  }
});

/**
 * Global "Add New Item" button handler - works for both Admin and Owner
 */
function handleAddNewItem() {
  console.log('[Owner] handleAddNewItem called');
  openNewItemModal();
}

document.addEventListener('DOMContentLoaded', function() {
  // Set up tab switching
  document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.dataset.tab;
      showTab(tabId, this);
    });
  });

  // Set default active tab
  const defaultTabButton = document.querySelector('.tab-btn.active');
  if (defaultTabButton) {
    showTab(defaultTabButton.dataset.tab, defaultTabButton);
  }

  // Initialize chart if reports tab is active on load
  if (document.getElementById('reportsTab')?.classList.contains('active')) {
    initializeReports();
  }

  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('orderDate')?.setAttribute('value', today);
  document.getElementById('reportStartDate')?.setAttribute('value', today);
  document.getElementById('reportEndDate')?.setAttribute('value', today);

  // Set up report date input listeners for auto-generation
  const reportStartDate = document.getElementById('reportStartDate');
  const reportEndDate = document.getElementById('reportEndDate');
  
  if (reportStartDate) {
    reportStartDate.addEventListener('change', () => {
      if (!isDisplayingQuickReport && document.getElementById('reportsTab')?.classList.contains('active')) {
        fetchAndRenderSalesReport();
      }
    });
  }

  if (reportEndDate) {
    reportEndDate.addEventListener('change', () => {
      if (!isDisplayingQuickReport && document.getElementById('reportsTab')?.classList.contains('active')) {
        fetchAndRenderSalesReport();
      }
    });
  }

  // Set up quick report buttons
  document.querySelectorAll('.quick-report-btn').forEach(button => {
    button.addEventListener('click', function() {
      const reportType = this.dataset.reportType;
      loadQuickReport(reportType);
    });
  });

  // Set up "Add New Item" button event listener
  const addNewItemBtn = document.getElementById('addNewItemBtn');
  if (addNewItemBtn) {
    addNewItemBtn.addEventListener('click', function() {
      handleAddNewItem();
    });
  }

  // Set up modal close button listeners
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }

  const modalCancelBtn = document.getElementById('modalCancelBtn');
  if (modalCancelBtn) {
    modalCancelBtn.addEventListener('click', closeModal);
  }

  // Set up modal background click to close
  const itemModal = document.getElementById('itemModal');
  if (itemModal) {
    itemModal.addEventListener('click', function(e) {
      if (e.target === this) closeModal();
    });
  }

  // Set up payment screenshot modal
  const paymentModal = document.getElementById('screenshot-modal');
  const closeModalButton = paymentModal ? paymentModal.querySelector('.close-button') : null;
  
  if (closeModalButton) {
    closeModalButton.addEventListener('click', closePaymentModal);
  }
  
  window.addEventListener('click', (event) => {
    if (event.target === paymentModal) {
      closePaymentModal();
    }
  });
});

// Tab switching
function showTab(tabId, clickedButton) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remove active class from all buttons
  document.querySelectorAll('.tab-btn').forEach(button => {
    button.classList.remove('active');
  });
  
  // Show selected tab
  document.getElementById(tabId).classList.add('active');
  
  // Add active class to clicked button
  if (clickedButton) {
    clickedButton.classList.add('active');
  } else {
    // Fallback if clickedButton is not provided (e.g., initial load)
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
  }
  
  // Load content based on tab
  if (tabId === 'reportsTab') {
    setTimeout(initializeReports, 100);
  } else if (tabId === 'ordersTab') {
    loadOrders();
  } else if (tabId === 'inventoryTab') {
    renderInventoryOwner();
  }
}

// ===== Payment Modal Functions =====

/**
 * Open payment modal with screenshot image
 * @param {string} imageUrl - URL of the payment screenshot
 */
function openPaymentModal(imageUrl) {
  const paymentModal = document.getElementById('screenshot-modal');
  const modalImage = document.getElementById('screenshot-image');
  
  if (paymentModal && modalImage && imageUrl) {
    modalImage.src = imageUrl;
    paymentModal.style.display = 'flex';
  } else {
    alert('No payment screenshot available for this order.');
  }
}

/**
 * Close payment modal
 */
function closePaymentModal() {
  const paymentModal = document.getElementById('screenshot-modal');
  if (paymentModal) {
    paymentModal.style.display = 'none';
  }
}

/**
 * Initialize reports tab and load initial data
 */
function initializeReports() {
  if (!isDisplayingQuickReport) {
    fetchAndRenderSalesReport();
  }
}

/**
 * Generate report - called from the Generate Report button
 */
function generateReport() {
  fetchAndRenderSalesReport();
}

/**
 * Fetch sales data from backend and render chart + metrics
 */
async function fetchAndRenderSalesReport() {
  const startDate = document.getElementById('reportStartDate')?.value;
  const endDate = document.getElementById('reportEndDate')?.value;

  if (!startDate || !endDate) {
    showReportError('Please select both start and end dates');
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    showReportError('Start date must be before end date');
    return;
  }

  // Show loading state
  setReportLoading(true);
  clearReportError();

  try {
    // Fetch data from backend API
    const response = await fetch(`/api/reports/sales?startDate=${startDate}&endDate=${endDate}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }

    const chartData = await response.json();
    
    // Store the data
    reportChartData = chartData;
    
    // Render the chart
    renderSalesChart(chartData);
    
    // Update metrics
    updateReportMetrics(chartData.summary);

  } catch (error) {
    console.error('Error fetching sales report:', error);
    showReportError(`Failed to load report: ${error.message}`);
  } finally {
    setReportLoading(false);
  }
}

/**
 * Render the sales chart using Chart.js
 * @param {Object} chartData - Data from API with labels and datasets
 */
function renderSalesChart(chartData) {
  const canvasElement = document.getElementById('salesChart');
  
  if (!canvasElement) {
    console.error('Canvas element for chart not found');
    return;
  }

  // Destroy existing chart instance if it exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  // Create new chart
  chartInstance = new Chart(canvasElement, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: chartData.datasets[0].label || 'Daily Sales (₱)',
          data: chartData.datasets[0].data,
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: 'rgba(75, 192, 192, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(75, 192, 192, 1)'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 13,
              weight: 'bold'
            },
            color: '#374151'
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: function(context) {
              return `₱${context.parsed.y.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(200, 200, 200, 0.2)',
            drawBorder: false
          },
          ticks: {
            callback: function(value) {
              return '₱' + value.toFixed(0);
            },
            font: {
              size: 12
            },
            color: '#6B7280'
          }
        },
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            font: {
              size: 12
            },
            color: '#6B7280'
          }
        }
      }
    }
  });
}

/**
 * Update the metrics cards with summary data
 * @param {Object} summary - Summary data from API response
 */
function updateReportMetrics(summary) {
  if (!summary) return;

  // Update Total Sales metric
  const totalSalesElement = document.querySelector('[data-metric="total-sales"] .metric-value');
  if (totalSalesElement) {
    totalSalesElement.textContent = `₱${summary.totalRevenue.toFixed(2)}`;
  }

  // Update Total Orders metric
  const totalOrdersElement = document.querySelector('[data-metric="total-orders"] .metric-value');
  if (totalOrdersElement) {
    totalOrdersElement.textContent = summary.totalOrdersCompleted;
  }

  // Update Average Order metric
  const averageOrderElement = document.querySelector('[data-metric="average-order"] .metric-value');
  if (averageOrderElement) {
    const avgOrder = summary.totalOrdersCompleted > 0 
      ? (summary.totalRevenue / summary.totalOrdersCompleted).toFixed(2)
      : '0.00';
    averageOrderElement.textContent = `₱${avgOrder}`;
  }

  // Add additional metrics display
  console.log('Sales Report Summary:', {
    'Total Revenue': `₱${summary.totalRevenue.toFixed(2)}`,
    'Average Daily Sales': `₱${summary.averageDailySales}`,
    'Max Daily Sales': `₱${summary.maxDailySales}`,
    'Min Daily Sales': `₱${summary.minDailySales}`,
    'Days with Sales': summary.daysWithSales,
    'Total Days': summary.totalDaysInRange,
    'Total Orders': summary.totalOrdersCompleted
  });
}

/**
 * Set loading state for report
 */
function setReportLoading(loading) {
  isLoadingReport = loading;
  const generateBtn = document.querySelector('button[onclick="generateReport()"]');
  
  if (generateBtn) {
    if (loading) {
      generateBtn.disabled = true;
      generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Loading...';
    } else {
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<i class="fas fa-sync" aria-hidden="true"></i> Generate Report';
    }
  }
}

/**
 * Show error message in reports section
 */
function showReportError(message) {
  reportError = message;
  console.error('Report Error:', message);
  
  // Display error in UI
  const chartContainer = document.querySelector('.chart-container');
  if (chartContainer) {
    let errorDiv = chartContainer.querySelector('.report-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'report-error';
      chartContainer.insertBefore(errorDiv, chartContainer.firstChild);
    }
    errorDiv.textContent = `⚠️ ${message}`;
    errorDiv.style.display = 'block';
    errorDiv.style.padding = '15px';
    errorDiv.style.marginBottom = '15px';
    errorDiv.style.backgroundColor = '#fee';
    errorDiv.style.borderLeft = '4px solid #f44';
    errorDiv.style.borderRadius = '4px';
    errorDiv.style.color = '#c33';
  }
}

/**
 * Clear any error messages
 */
function clearReportError() {
  reportError = null;
  const errorDiv = document.querySelector('.report-error');
  if (errorDiv) {
    errorDiv.style.display = 'none';
  }
}

/**
 * Load a quick report (daily, weekly, monthly, yearly)
 */
async function loadQuickReport(reportType) {
  try {
    console.log(`Loading ${reportType} report...`);
    isDisplayingQuickReport = true; // Prevent date input auto-fetch
    setReportLoading(true);
    clearReportError();

    // Show reports tab
    const reportsTab = document.getElementById('reportsTab');
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      if (btn.dataset.tab === 'reportsTab') {
        showTab('reportsTab', btn);
      }
    });

    // Fetch the appropriate report endpoint
    console.log(`Fetching /api/reports/${reportType}`);
    const response = await fetch(`/api/reports/${reportType}`);
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to load ${reportType} report`);
    }

    const reportData = await response.json();
    console.log(`Report data received:`, reportData);

    // Handle daily report (single day, no chart needed)
    if (reportType === 'daily') {
      console.log('Updating daily metrics...');
      updateDailyMetrics(reportData);
      // Hide chart for daily view, show metric cards only
      const chartContainer = document.querySelector('.chart-container');
      if (chartContainer) {
        chartContainer.style.display = 'none';
      }
    } else {
      // For weekly, monthly, yearly - show chart
      const chartContainer = document.querySelector('.chart-container');
      if (chartContainer) {
        chartContainer.style.display = 'block';
      }
      
      // Render chart with report data
      console.log('Rendering quick report chart...');
      renderQuickReportChart(reportData, reportType);
      
      // Update metrics with quick report data format
      updateQuickReportMetrics(reportData, reportType);
    }

    console.log(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report:`, reportData);
    setReportLoading(false);
    isDisplayingQuickReport = false; // Allow date input auto-fetch again

  } catch (error) {
    console.error('Error loading quick report:', error);
    showReportError(error.message || `Failed to load ${reportType} report`);
    setReportLoading(false);
    isDisplayingQuickReport = false; // Allow date input auto-fetch again on error
  }
}

/**
 * Update metrics for daily report
 */
function updateDailyMetrics(data) {
  const metricsMap = {
    'total-sales': `₱${data.totalRevenue.toFixed(2)}`,
    'total-orders': data.totalOrders,
    'average-order': `₱${data.averageOrderValue.toFixed(2)}`
  };

  Object.entries(metricsMap).forEach(([metricKey, value]) => {
    const metric = document.querySelector(`[data-metric="${metricKey}"]`);
    if (metric) {
      const valueElement = metric.querySelector('.metric-value');
      if (valueElement) {
        valueElement.textContent = value;
      }
    }
  });
}

/**
 * Update metrics for quick reports (weekly, monthly, yearly)
 */
function updateQuickReportMetrics(data, reportType) {
  const totalSalesElement = document.querySelector('[data-metric="total-sales"] .metric-value');
  if (totalSalesElement) {
    totalSalesElement.textContent = `₱${data.totalRevenue.toFixed(2)}`;
  }

  const totalOrdersElement = document.querySelector('[data-metric="total-orders"] .metric-value');
  if (totalOrdersElement) {
    totalOrdersElement.textContent = data.totalOrders;
  }

  const averageOrderElement = document.querySelector('[data-metric="average-order"] .metric-value');
  if (averageOrderElement) {
    // For yearly reports, use averageMonthlySales; for others use averageDailySales
    const avgValue = reportType === 'yearly' 
      ? (data.totalRevenue / data.totalOrders).toFixed(2)
      : (data.totalRevenue / data.totalOrders).toFixed(2);
    averageOrderElement.textContent = `₱${avgValue}`;
  }

  console.log(`${reportType.toUpperCase()} Report Metrics:`, {
    'Total Revenue': `₱${data.totalRevenue.toFixed(2)}`,
    'Total Orders': data.totalOrders,
    'Average per Order': `₱${(data.totalRevenue / data.totalOrders).toFixed(2)}`
  });
}

/**
 * Render chart for quick reports
 */
function renderQuickReportChart(data, reportType) {
  const ctx = document.getElementById('salesChart');
  if (!ctx) {
    console.error('Chart container not found');
    return;
  }

  // Determine chart title and X-axis label
  const titles = {
    weekly: 'Weekly Sales',
    monthly: 'Monthly Sales',
    yearly: 'Yearly Sales'
  };

  const chartTitle = titles[reportType] || 'Sales Report';

  // Destroy previous chart if it exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  // Create new chart
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Sales (₱)',
        data: data.data,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        title: {
          display: true,
          text: chartTitle,
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: {
            bottom: 30
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Sales (₱)'
          }
        }
      }
    }
  });
}

// ===== SUPER ADMIN INVENTORY MANAGEMENT =====

/**
 * Handle item editing for Super Admin
 * Opens modal with item data and enables full editing
 */
async function handleEditItem(itemId) {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['x-auth-token'] = token;
    }

    const response = await fetch(`/api/inventory/${itemId}`, {
      headers: headers
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const item = await response.json();

    // Pre-fill modal with item data
    document.getElementById('itemName').value = item.itemName || '';
    document.getElementById('itemCategory').value = item.category || '';
    const priceEl = document.getElementById('itemPrice');
    if (priceEl) priceEl.value = item.price !== undefined ? item.price : '';
    const unitEl = document.getElementById('itemUnit');
    if (unitEl) unitEl.value = item.unit || 'pcs';
    document.getElementById('itemStock').value = item.quantity !== undefined ? item.quantity : 0;
    document.getElementById('itemAlertLevel').value = item.alertLevel !== undefined ? item.alertLevel : 0;
    document.getElementById('itemDescription').value = item.description || '';
    
    // Handle image
    if (item.image) {
      const prev = document.getElementById('itemPreview');
      if (prev) {
        prev.src = item.image;
        prev.style.display = '';
      }
      const hid = document.getElementById('itemImageData');
      if (hid) hid.value = item.image;
    } else {
      const prev = document.getElementById('itemPreview');
      if (prev) prev.style.display = 'none';
      const hid = document.getElementById('itemImageData');
      if (hid) hid.value = '';
    }

    // Store the item ID for form submission
    const idxField = document.getElementById('itemEditIndex');
    if (idxField) idxField.value = item._id;

    // Open modal
    openAddItemModal();
    console.log('[Owner] Edit item opened:', item);
  } catch (error) {
    console.error('Error fetching item for edit:', error);
    alert('Failed to load item for editing. Please try again.');
  }
}

/**
 * Handle item deletion for Super Admin
 * Shows confirmation dialog before deleting
 */
async function handleDeleteItem(itemId) {
  if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['x-auth-token'] = token;
    }

    const response = await fetch(`/api/inventory/${itemId}`, {
      method: 'DELETE',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('[Owner] Item deleted successfully:', result);

    // Re-render inventory after successful deletion
    renderInventoryShared('inventoryRows');
    alert('Item deleted successfully.');
  } catch (error) {
    console.error('Error deleting item:', error);
    alert('Failed to delete item. Please try again.');
  }
}