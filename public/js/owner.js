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

  // Set up order search and filter listeners
  document.getElementById('orderSearch')?.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    document.querySelectorAll('.order-card').forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  });

  document.getElementById('statusFilter')?.addEventListener('change', function(e) {
    const status = e.target.value;
    document.querySelectorAll('.order-card').forEach(card => {
      if (status === 'all') {
        card.style.display = '';
        return;
      }
      const badge = card.querySelector('.status-badge');
      card.style.display = badge && badge.classList.contains(status) ? '' : 'none';
    });
  });

  // Inventory search (live)
  document.getElementById('inventorySearch')?.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    document.querySelectorAll('#inventoryRows .table-row').forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  });

  // Inventory stock filter
  document.getElementById('stockFilter')?.addEventListener('change', function(e) {
    const status = e.target.value;
    document.querySelectorAll('#inventoryRows .table-row').forEach(row => {
      if (status === 'all') {
        row.style.display = '';
      } else {
        const stockBadge = row.querySelector('.stock-status');
        row.style.display = stockBadge && stockBadge.classList.contains(status) ? '' : 'none';
      }
    });
  });

  // Inventory category filter
  document.getElementById('categoryFilter')?.addEventListener('change', function(e) {
    const selectedCategory = e.target.value;
    document.querySelectorAll('#inventoryRows .table-row').forEach(row => {
      const categoryCell = row.querySelector('div:nth-child(2)');
      const categoryText = categoryCell ? categoryCell.textContent.toLowerCase().trim() : '';
      
      if (selectedCategory === 'all') {
        row.style.display = '';
      } else {
        row.style.display = categoryText === selectedCategory ? '' : 'none';
      }
    });
  });

  // Orders date filter
  document.getElementById('orderDate')?.addEventListener('change', function(e) {
    const selectedDate = e.target.value;
    if (!selectedDate) {
      // If no date selected, show all cards
      document.querySelectorAll('.order-card').forEach(card => {
        card.style.display = '';
      });
      return;
    }

    const filterDate = new Date(selectedDate).toDateString();
    
    document.querySelectorAll('.order-card').forEach(card => {
      const orderTimeElement = card.querySelector('.order-time');
      if (orderTimeElement) {
        const orderDateText = orderTimeElement.textContent.trim();
        // Parse the order date from the displayed date/time string
        const orderDate = new Date(orderDateText).toDateString();
        card.style.display = orderDate === filterDate ? '' : 'none';
      } else {
        card.style.display = '';
      }
    });
  });

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
    // Update category filter with actual categories from inventory
    updateCategoryFilterOptionsOwner();
    if (categoryManager && typeof categoryManager.init === 'function') {
      categoryManager.init();
    }
  } else if (tabId === 'discountsTab') {
    // Initialize discount manager for the discounts tab
    if (typeof DiscountManager !== 'undefined') {
      if (!window.discountManager) {
        window.discountManager = new DiscountManager();
      }
      window.discountManager.init();
    }
  } else if (tabId === 'eligibilityTab') {
    // Initialize eligibility manager for SC/PWD management
    if (typeof EligibilityManager !== 'undefined') {
      if (!window.eligibilityManager) {
        window.eligibilityManager = new EligibilityManager('owner');
      }
      window.eligibilityManager.loadStatistics();
    }
  }
}

/**
 * Dynamically update category filter options based on actual inventory categories
 */
async function updateCategoryFilterOptionsOwner() {
  try {
    const response = await fetch('/api/inventory');
    if (!response.ok) return;
    
    const items = await response.json();
    const categorySelect = document.getElementById('categoryFilter');
    if (!categorySelect) return;

    // Get all unique categories from inventory
    const predefinedCategories = ['burger', 'pizza', 'others', 'drinks', 'rice', 'pasta', 'coffee', 'bundle'];
    const categoryLabels = {
      burger: 'Burgers',
      pizza: 'Pizza',
      others: 'Snacks',
      drinks: 'Drinks',
      rice: 'Rice Meals',
      pasta: 'Pasta',
      coffee: 'Coffee',
      bundle: 'Bundle Meals'
    };

    // Extract all unique categories from inventory
    const categoriesFromInventory = new Set();
    items.forEach(item => {
      if (item.category) {
        categoriesFromInventory.add(item.category.toLowerCase().trim());
      }
    });

    // Clear existing options except "All Categories"
    const allCategoriesOption = categorySelect.querySelector('option[value="all"]');
    categorySelect.innerHTML = '';
    if (allCategoriesOption) {
      categorySelect.appendChild(allCategoriesOption);
    }

    // Add predefined categories that exist in inventory
    predefinedCategories.forEach(cat => {
      if (categoriesFromInventory.has(cat)) {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = categoryLabels[cat] || cat;
        categorySelect.appendChild(option);
      }
    });

    // Add custom categories that aren't predefined
    const customCategories = Array.from(categoriesFromInventory).filter(cat => !predefinedCategories.includes(cat));
    customCategories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      // Format custom category name: capitalize words
      option.textContent = cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      categorySelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error updating category filter:', error);
  }
}



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
 * Export current report data to Excel
 */
function exportReportToExcel() {
  try {
    if (!reportChartData) {
      alert('Please generate a report first before exporting.');
      return;
    }

    // Prepare data for export
    const data = reportChartData;
    const summary = data.summary;
    
    if (!summary) {
      alert('Report data is incomplete. Please generate a report first.');
      return;
    }
    
    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Add title
    csvContent += 'Sales Report\n\n';
    
    // Add summary section
    csvContent += 'Summary Metrics\n';
    csvContent += `Total Revenue,₱${summary.totalRevenue.toFixed(2)}\n`;
    csvContent += `Total Orders,${summary.totalOrdersCompleted}\n`;
    csvContent += `Average Order Value,₱${(summary.totalRevenue / (summary.totalOrdersCompleted || 1)).toFixed(2)}\n`;
    csvContent += `Average Daily Sales,₱${summary.averageDailySales.toFixed(2)}\n`;
    csvContent += `Max Daily Sales,₱${summary.maxDailySales.toFixed(2)}\n`;
    csvContent += `Min Daily Sales,₱${summary.minDailySales.toFixed(2)}\n`;
    csvContent += `Days with Sales,${summary.daysWithSales}\n`;
    csvContent += `Total Days in Range,${summary.totalDaysInRange}\n\n`;
    
    // Add daily breakdown
    csvContent += 'Daily Sales Breakdown\n';
    csvContent += 'Date,Sales Amount (₱)\n';
    
    // Handle both old and new data formats
    let chartData = data;
    
    // If using new datasets format, extract the first dataset
    if (data.datasets && data.datasets[0]) {
      chartData = {
        labels: data.labels,
        data: data.datasets[0].data
      };
    }
    
    if (chartData.labels && chartData.data) {
      chartData.labels.forEach((label, index) => {
        const amount = chartData.data[index];
        csvContent += `${label},${amount.toFixed(2)}\n`;
      });
    }
    
    // Add Most Ordered Items section
    const mostOrderedBody = document.getElementById('mostOrderedItemsBody');
    if (mostOrderedBody && mostOrderedBody.rows.length > 0 && mostOrderedBody.rows[0].cells.length > 1) {
      csvContent += '\n\nMost Ordered Items\n';
      csvContent += 'Rank,Item Name,Total Orders\n';
      Array.from(mostOrderedBody.rows).forEach(row => {
        const rank = row.cells[0]?.textContent.trim() || '';
        const itemName = row.cells[1]?.textContent.trim() || '';
        const orderCount = row.cells[2]?.textContent.trim() || '';
        
        // Skip header/empty rows
        if (rank && itemName !== 'No data available') {
          csvContent += `${rank},"${itemName}",${orderCount}\n`;
        }
      });
    }
    
    // Create downloadable link
    const link = document.createElement('a');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    
    // Generate filename with date
    const today = new Date();
    const filename = `Sales_Report_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.csv`;
    link.setAttribute('download', filename);
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('[Export] Report exported successfully:', filename);
    
    // Show success message
    const exportBtn = document.querySelector('button[onclick="exportReportToExcel()"]');
    if (exportBtn) {
      const originalHTML = exportBtn.innerHTML;
      exportBtn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Downloaded!';
      exportBtn.disabled = true;
      
      setTimeout(() => {
        exportBtn.innerHTML = originalHTML;
        exportBtn.disabled = false;
      }, 2000);
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    alert('Failed to export report. Please try again.');
  }
}

/**
 * Export current report data to PDF
 */
function exportReportToPDF() {
  try {
    const startDate = document.getElementById('reportStartDate')?.value;
    const endDate = document.getElementById('reportEndDate')?.value;
    const paymentMethod = document.getElementById('paymentMethodFilter')?.value || '';

    if (!startDate || !endDate) {
      alert('Please select both start and end dates before exporting.');
      return;
    }

    if (!reportChartData) {
      alert('Please generate a report first before exporting.');
      return;
    }

    // Get username from state service (will be available after login)
    let username = 'System Administrator';
    try {
      // Try to get from stateService if available (ES module context)
      if (typeof stateService !== 'undefined' && stateService.user) {
        username = stateService.user.username || username;
      }
    } catch (e) {
      console.log('stateService not available in this context, using default');
    }

    // Show loading state
    const pdfBtn = document.querySelector('button[onclick="exportReportToPDF()"]');
    if (pdfBtn) {
      const originalHTML = pdfBtn.innerHTML;
      pdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
      pdfBtn.disabled = true;

      // Build URL with query parameters
      let url = `/api/reports/export-pdf?startDate=${startDate}&endDate=${endDate}&username=${encodeURIComponent(username)}`;
      if (paymentMethod) {
        url += `&paymentMethod=${paymentMethod}`;
      }

      // Fetch PDF from backend
      fetch(url)
        .then(response => {
          if (!response.ok) throw new Error('PDF generation failed');
          return response.blob();
        })
        .then(blob => {
          // Create download link
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `Sales_Report_${startDate}_to_${endDate}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);

          // Show success message
          pdfBtn.innerHTML = '<i class="fas fa-check"></i> Downloaded!';
          setTimeout(() => {
            pdfBtn.innerHTML = originalHTML;
            pdfBtn.disabled = false;
          }, 2000);
        })
        .catch(error => {
          console.error('Error exporting PDF:', error);
          alert('Failed to export PDF. Please try again.');
          pdfBtn.innerHTML = originalHTML;
          pdfBtn.disabled = false;
        });
    }
  } catch (error) {
    console.error('Error exporting report to PDF:', error);
    alert('Failed to export report. Please try again.');
  }
}

/**
 * Fetch payment method breakdown and render on page
 */
async function fetchAndRenderPaymentBreakdown() {
  try {
    const startDate = document.getElementById('reportStartDate')?.value;
    const endDate = document.getElementById('reportEndDate')?.value;

    if (!startDate || !endDate) {
      return;
    }

    const response = await fetch(`/api/reports/payment-breakdown?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) throw new Error('Failed to fetch payment breakdown');

    const breakdownData = await response.json();
    renderPaymentBreakdown(breakdownData);
    renderPaymentChart(breakdownData);

  } catch (error) {
    console.error('Error fetching payment breakdown:', error);
  }
}

/**
 * Render payment method breakdown cards
 */
function renderPaymentBreakdown(data) {
  const container = document.getElementById('paymentBreakdownContainer');
  if (!container) return;

  const paymentMethods = data.paymentMethods;
  const cards = container.querySelectorAll('.payment-method-card');

  cards.forEach(card => {
    const icon = card.querySelector('.payment-method-icon');
    const methodName = card.querySelector('h4').textContent;
    const amount = card.querySelector('.amount');
    const percentage = card.querySelector('.percentage');
    const orderCount = card.querySelector('.order-count');

    const methodData = paymentMethods[methodName];
    if (methodData) {
      amount.textContent = `₱${methodData.sales.toFixed(2)}`;
      percentage.textContent = `${methodData.percentage.toFixed(2)}%`;
      orderCount.textContent = `${methodData.orders} orders`;
    } else {
      // Fallback if method data not found
      amount.textContent = '₱0.00';
      percentage.textContent = '0%';
      orderCount.textContent = '0 orders';
    }
  });

  console.log('Payment breakdown cards updated');
}

/**
 * Render payment method pie chart
 */
function renderPaymentChart(data) {
  const canvas = document.getElementById('paymentChart');
  if (!canvas) {
    console.warn('Payment chart canvas not found');
    return;
  }

  const paymentMethods = data.paymentMethods;
  
  // Only include methods with actual sales data (non-zero)
  const labels = [];
  const chartData = [];
  const colors = [];
  const borderColors = [];
  
  const colorMap = {
    'GCash': { bg: '#667eea', border: '#667eea' },
    'Maya': { bg: '#f5576c', border: '#f5576c' },
    'Cash': { bg: '#00f2fe', border: '#00f2fe' }
  };

  for (const method of Object.keys(paymentMethods)) {
    const methodData = paymentMethods[method];
    if (methodData.sales > 0) {
      labels.push(method);
      chartData.push(methodData.sales);
      colors.push(colorMap[method]?.bg || '#667eea');
      borderColors.push(colorMap[method]?.border || '#667eea');
    }
  }

  // If no data, don't render chart
  if (chartData.length === 0) {
    console.log('No payment data available for chart');
    return;
  }

  // Destroy previous chart if exists
  if (window.paymentChartInstance) {
    window.paymentChartInstance.destroy();
    window.paymentChartInstance = null;
  }

  try {
    // Get 2D context
    const ctx = canvas.getContext('2d');
    
    // Set canvas max height for compact display
    const canvasContainer = canvas.parentElement;
    canvas.style.maxHeight = '250px';
    
    window.paymentChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: chartData,
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 12,
              font: { size: 11 },
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const percentage = ((value / chartData.reduce((a, b) => a + b, 0)) * 100).toFixed(2);
                return `${label}: ₱${value.toFixed(2)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
    
    console.log('Payment chart rendered successfully');
  } catch (error) {
    console.error('Error rendering payment chart:', error);
  }
}

/**
 * Fetch most ordered items from API with optional date filtering
 */
async function fetchAndRenderMostOrderedItems() {
  try {
    const startDate = document.getElementById('reportStartDate')?.value;
    const endDate = document.getElementById('reportEndDate')?.value;
    
    // Build URL with date filters if available
    let url = '/api/reports/popular-items';
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch popular items');
    
    const data = await response.json();
    renderMostOrderedItems(data.items || []);
  } catch (error) {
    console.error('Error fetching most ordered items:', error);
  }
}

/**
 * Render most ordered items in the table
 */
function renderMostOrderedItems(items) {
  const tableBody = document.getElementById('mostOrderedItemsBody');
  if (!tableBody) return;
  
  if (!items || items.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #999;">No items data available</td></tr>';
    return;
  }
  
  tableBody.innerHTML = items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.itemName || 'Unknown Item'}</td>
      <td><strong>${item.orderCount}</strong></td>
    </tr>
  `).join('');
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

    // Fetch and render payment breakdown
    fetchAndRenderPaymentBreakdown();
    
    // Fetch and render most ordered items
    fetchAndRenderMostOrderedItems();

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

    // Update date range inputs based on report type
    const today = new Date();
    const startDateInput = document.getElementById('reportStartDate');
    const endDateInput = document.getElementById('reportEndDate');

    if (reportType === 'daily') {
      // Today only
      const todayStr = today.toISOString().split('T')[0];
      if (startDateInput) startDateInput.value = todayStr;
      if (endDateInput) endDateInput.value = todayStr;
    } else if (reportType === 'weekly') {
      // This week (Monday to today)
      const firstDay = new Date(today);
      firstDay.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Monday
      if (startDateInput) startDateInput.value = firstDay.toISOString().split('T')[0];
      if (endDateInput) endDateInput.value = today.toISOString().split('T')[0];
    } else if (reportType === 'monthly') {
      // This month (1st to today)
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      if (startDateInput) startDateInput.value = firstDay.toISOString().split('T')[0];
      if (endDateInput) endDateInput.value = today.toISOString().split('T')[0];
    } else if (reportType === 'yearly') {
      // This year (1st Jan to today)
      const firstDay = new Date(today.getFullYear(), 0, 1);
      if (startDateInput) startDateInput.value = firstDay.toISOString().split('T')[0];
      if (endDateInput) endDateInput.value = today.toISOString().split('T')[0];
    }

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
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to load ${reportType} report`);
    }

    const reportData = await response.json();
    console.log(`Report data received:`, reportData);

    // Store the data for export
    reportChartData = reportData;

    // All reports now have consistent format with labels and data
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
      chartContainer.style.display = 'block';
    }
    
    // Render chart with report data
    console.log(`Rendering ${reportType} report chart...`);
    renderQuickReportChart(reportData, reportType);
    
    // Update metrics with quick report data
    updateQuickReportMetrics(reportData, reportType);

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
 * Update metrics for quick reports (daily, weekly, monthly, yearly)
 */
function updateQuickReportMetrics(data, reportType) {
  // Extract summary from data - it can be nested in summary or at root level
  const summary = data.summary || data;
  
  const totalSalesElement = document.querySelector('[data-metric="total-sales"] .metric-value');
  if (totalSalesElement) {
    totalSalesElement.textContent = `₱${summary.totalRevenue.toFixed(2)}`;
  }

  // Use totalOrdersCompleted from summary, or fall back to totalOrders
  const totalOrders = summary.totalOrdersCompleted || summary.totalOrders || 0;
  const totalOrdersElement = document.querySelector('[data-metric="total-orders"] .metric-value');
  if (totalOrdersElement) {
    totalOrdersElement.textContent = totalOrders;
  }

  const averageOrderElement = document.querySelector('[data-metric="average-order"] .metric-value');
  if (averageOrderElement) {
    let avgValue = 0;
    if (totalOrders > 0) {
      avgValue = (summary.totalRevenue / totalOrders).toFixed(2);
    }
    averageOrderElement.textContent = `₱${avgValue}`;
  }

  console.log(`${reportType.toUpperCase()} Report Metrics:`, {
    'Total Revenue': `₱${summary.totalRevenue.toFixed(2)}`,
    'Total Orders': totalOrders,
    'Average per Order': `₱${(totalOrders > 0 ? summary.totalRevenue / totalOrders : 0).toFixed(2)}`
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

  // Determine chart title based on report type
  const titles = {
    daily: 'Daily Sales Report',
    weekly: 'Weekly Sales Report',
    monthly: 'Monthly Sales Report',
    yearly: 'Yearly Sales Report'
  };

  const chartTitle = titles[reportType] || 'Sales Report';

  // Destroy previous chart if it exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  // Extract chart data - handle both old and new formats
  let chartData = data.data;
  if (data.datasets && data.datasets[0]) {
    chartData = data.datasets[0].data;
  }

  // Create new chart
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Sales (₱)',
        data: chartData,
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgba(102, 126, 234, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
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
    
    // Handle category display (same as in inventory.js)
    const categorySelect = document.getElementById('itemCategory');
    const customInput = document.getElementById('customCategory');
    const predefinedCategories = ['burger', 'pizza', 'others', 'drinks', 'rice', 'pasta', 'coffee', 'bundle'];
    
    if (predefinedCategories.includes(item.category)) {
      categorySelect.value = item.category;
      if (customInput) { customInput.style.display = 'none'; customInput.value = ''; }
    } else if (item.category) {
      // Custom category
      categorySelect.value = 'custom';
      if (customInput) { customInput.style.display = 'block'; customInput.value = item.category; }
    } else {
      categorySelect.value = '';
      if (customInput) { customInput.style.display = 'none'; customInput.value = ''; }
    }
    
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

    // Load variations if they exist
    variationsData = item.variations || [];
    console.log('[Owner] Loaded variations into variationsData:', variationsData);
    console.log('[Owner] variationsData.length:', variationsData.length);
    renderVariationsList();
    console.log('[Owner] After renderVariationsList');

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
    console.log('[Owner Delete] Token from localStorage:', token ? 'Present' : 'Missing');
    
    if (!token) {
      alert('Authentication token not found. Please log in again.');
      window.location.href = 'Login.html';
      return;
    }

    const headers = {
      'x-auth-token': token,
      'Content-Type': 'application/json'
    };

    console.log('[Owner Delete] Sending DELETE request to /api/inventory/' + itemId);
    const response = await fetch(`/api/inventory/${itemId}`, {
      method: 'DELETE',
      headers: headers
    });

    console.log('[Owner Delete] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[Owner Delete] Error response:', errorData);
      throw new Error(`HTTP error! status: ${response.status}. ${errorData}`);
    }

    const result = await response.json();
    console.log('[Owner] Item deleted successfully:', result);

    // Re-render inventory after successful deletion
    await renderInventoryOwner('inventoryRows');
    alert('Item deleted successfully.');
  } catch (error) {
    console.error('Error deleting item:', error);
    alert(`Failed to delete item: ${error.message}`);
  }
}

/**
 * Handle toggle item availability for Owner
 * Calls PATCH /api/inventory/:id with { isAvailable: !currentStatus }
 */
async function handleToggleAvailability(itemId, currentStatus) {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['x-auth-token'] = token;
    }

    const response = await fetch(`/api/inventory/${itemId}`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify({ isAvailable: !currentStatus })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const updatedItem = await response.json();
    console.log('[Owner] Availability toggled for item:', itemId, 'New status:', updatedItem.isAvailable);
    
    // Re-render inventory to show updated status
    renderInventoryOwner();
    
    // Optional: Show success toast/notification
    const statusText = updatedItem.isAvailable ? 'Available' : 'Unavailable';
    console.log(`Item marked as ${statusText}`);
  } catch (error) {
    console.error('Error toggling item availability:', error);
    alert('Failed to update item availability. Please try again.');
  }
}