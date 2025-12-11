// Tab Navigation
async function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  document.getElementById(tabId).classList.add('active');
  event.target.closest('.tab-btn').classList.add('active');
  
  if (tabId === 'inventoryTab') {
    await renderInventory();
    if (categoryManager && typeof categoryManager.init === 'function') {
      await categoryManager.init();
    }
  }
}

/**
 * Dynamically update category filter options based on actual inventory categories
 */
async function updateCategoryFilterOptions() {
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

// Logout
document.getElementById('logoutBtn').addEventListener('click', function() {
  if (confirm('Are you sure you want to log out?')) {
    window.location.href = 'Login.html';
  }
});

/**
 * Global "Add New Item" button handler - works for both Admin and Owner
 */
function handleAddNewItem() {
  console.log('[Admin] handleAddNewItem called');
  openNewItemModal();
}

// Inventory Management (use shared inventory.js helpers)
async function renderInventory() {
  await renderInventoryAdmin('inventoryRows');
  // Update category filter with actual categories from inventory
  await updateCategoryFilterOptions();
}

/**
 * Toggle item availability (Admin only)
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
    console.log('[Admin] Availability toggled for item:', itemId, 'New status:', updatedItem.isAvailable);
    
    // Re-render inventory to show updated status
    renderInventory();
    
    // Optional: Show success toast/notification
    const statusText = updatedItem.isAvailable ? 'Available' : 'Unavailable';
    console.log(`Item marked as ${statusText}`);
  } catch (error) {
    console.error('Error toggling item availability:', error);
    alert('Failed to update item availability. Please try again.');
  }
}

// modal / add-edit flow
let currentEditIdx = null;

function openAddItemModal() {
  document.getElementById('itemModal').classList.add('show');
}

// open modal for creating a new item (clears edit index)
function openNewItemModal() {
  const idxField = document.getElementById('itemEditIndex'); 
  if (idxField) idxField.value = '';
  const form = document.getElementById('addItemForm'); 
  if (form) form.reset();
  const prev = document.getElementById('itemPreview'); 
  if (prev) { prev.style.display = 'none'; prev.src = ''; }
  const hid = document.getElementById('itemImageData'); 
  if (hid) hid.value = '';
  currentEditIdx = null;
  document.getElementById('itemModal').classList.add('show');
}

function closeModal() {
  document.getElementById('itemModal').classList.remove('show');
  currentEditIdx = null;
  const form = document.getElementById('addItemForm');
  if (form) form.reset();
  const prev = document.getElementById('itemPreview');
  if (prev) { prev.style.display = 'none'; prev.src = ''; }
  const hid = document.getElementById('itemImageData');
  if (hid) hid.value = '';
  const idxField = document.getElementById('itemEditIndex'); 
  if (idxField) idxField.value = '';
}

// Note: editInventoryItem is now defined in inventory.js and handles both new and edit operations by ID
// This function has been removed to prevent conflicts

// image file -> dataURL
document.getElementById('itemImage')?.addEventListener('change', function(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    const data = ev.target.result;
    const hid = document.getElementById('itemImageData'); 
    if (hid) hid.value = data;
    const prev = document.getElementById('itemPreview'); 
    if (prev) { prev.src = data; prev.style.display = ''; }
  };
  reader.readAsDataURL(file);
});

// Close modal when clicking outside
document.getElementById('itemModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// Listen for storage changes
window.addEventListener('storage', function(e) {
  if (e.key === 'inventoryItems') renderInventory();
});

// Inventory search (live) and stock filter
document.getElementById('inventorySearch')?.addEventListener('input', function(e) {
  const searchTerm = e.target.value.toLowerCase();
  document.querySelectorAll('#inventoryRows .table-row').forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
});

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

// Orders: update status, cancel, search and filter
function updateOrderStatus(btn, status) {
  const card = btn.closest('.order-card');
  if (!card) return;
  const badge = card.querySelector('.status-badge');
  if (!badge) return;

  badge.className = 'status-badge ' + status;
  badge.textContent = status.charAt(0).toUpperCase() + status.slice(1);

  const actionsDiv = card.querySelector('.order-actions');
  if (!actionsDiv) return;

  if (status === 'preparing') {
    actionsDiv.innerHTML = `
      <button class="action-btn ready" onclick="updateOrderStatus(this, 'ready')">
        <i class="fas fa-check-double"></i>
        Mark as Ready
      </button>
    `;
  } else if (status === 'ready') {
    actionsDiv.innerHTML = `
      <button class="action-btn complete" onclick="updateOrderStatus(this, 'complete')">
        <i class="fas fa-check-double"></i>
        Complete Order
      </button>
    `;
  } else if (status === 'complete') {
    setTimeout(() => {
      card.style.opacity = '0';
      setTimeout(() => card.remove(), 300);
    }, 500);
  }
}

function cancelOrder(btn) {
  if (!confirm('Are you sure you want to cancel this order?')) return;
  const card = btn.closest('.order-card');
  if (!card) return;
  
  // Change status to cancelled instead of removing the card
  const badge = card.querySelector('.status-badge');
  if (badge) {
    badge.className = 'status-badge cancelled';
    badge.textContent = 'Cancelled';
  }
  
  // Update the actions to show only a note that order is cancelled
  const actionsDiv = card.querySelector('.order-actions');
  if (actionsDiv) {
    actionsDiv.innerHTML = `<span class="cancelled-note">Order Cancelled</span>`;
  }
}

// Orders search and status filter
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

  // Initialize inventory
  renderInventory();

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

  // Set up form validation
  const itemForm = document.getElementById('itemForm');
  if (itemForm) {
    itemForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const nameField = document.getElementById('itemName');
      const priceField = document.getElementById('itemPrice');
      const stockField = document.getElementById('itemStock');

      if (!nameField.value.trim()) {
        alert('Please enter an item name');
        nameField.focus();
        return;
      }

      if (isNaN(priceField.value) || parseFloat(priceField.value) <= 0) {
        alert('Please enter a valid price');
        priceField.focus();
        return;
      }

      if (isNaN(stockField.value) || parseInt(stockField.value) < 0) {
        alert('Please enter a valid stock quantity');
        stockField.focus();
        return;
      }

      // If validation passes, save the item
      saveItem();
    });
  }
});

// Tab Navigation
function showTab(tabId, clickedButton) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  document.getElementById(tabId).classList.add('active');
  if (clickedButton) {
    clickedButton.classList.add('active');
  } else {
    // Fallback if clickedButton is not provided (e.g., initial load)
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
  }
  
    if (tabId === 'ordersTab') {
  
      loadOrders(); // Assuming loadOrders is defined globally or imported
  
    } else if (tabId === 'inventoryTab') {
  
      renderInventory();
  
    }
  
  }
  
  
  
  // --- Payment Screenshot Modal ---
  
  const paymentModal = document.getElementById('screenshot-modal');
  
  const modalImage = document.getElementById('screenshot-image');
  
  const closeModalButton = paymentModal ? paymentModal.querySelector('.close-button') : null;
  
  
  
  function openPaymentModal(imageUrl) {
  
      if (paymentModal && modalImage && imageUrl) {
  
          modalImage.src = imageUrl;
  
          paymentModal.style.display = 'flex';
  
      } else {
  
          alert('No payment screenshot available for this order.');
  
      }
  
  }
  
  
  
  function closePaymentModal() {
  
      if (paymentModal) {
  
          paymentModal.style.display = 'none';
  
      }
  
  }
  
  
  
  if (closeModalButton) {
  
      closeModalButton.addEventListener('click', closePaymentModal);
  
  }
  
  
  
  window.addEventListener('click', (event) => {
  
      if (event.target === paymentModal) {
  
          closePaymentModal();
  
      }
  
  });
  
  