// Shared inventory helper functions and renderer
  // Provides: getInventory(), saveInventory(items), renderInventoryShared(containerId)

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function getInventory() {
    try {
      const response = await fetch('/api/inventory');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (e) {
      console.error('Error fetching inventory:', e);
      return [];
    }
  }

  // saveInventory(inv) is no longer needed as items are managed via API

  function normalizeInventory(items) {
    let migrated = false;
    const normalized = (items || []).map(it => {
      const copy = Object.assign({}, it);
      if (!('itemName' in copy) && ('name' in copy)) { copy.itemName = copy.name; migrated = true; }
      if (!('quantity' in copy) && ('stock' in copy)) { copy.quantity = copy.stock; migrated = true; }
      if (!('unit' in copy)) { copy.unit = copy.unit || 'pcs'; }
      if (!('alertLevel' in copy)) { copy.alertLevel = copy.alertLevel || 0; }
      return copy;
    });
    return { items: normalized, migrated };
  }

  async function renderInventoryShared(containerId = 'inventoryRows') {
    const inventoryRows = document.getElementById(containerId);
    if (!inventoryRows) return;

    inventoryRows.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <h3>Loading inventory...</h3>
      </div>
    `;

    let items = await getInventory();
    const norm = normalizeInventory(items);
    items = norm.items;
    // No need to saveInventory(items) as it's now backend-managed

    if (!items || items.length === 0) {
      inventoryRows.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-boxes"></i>
          <h3>No items in inventory</h3>
          <p>Add your first item to get started</p>
        </div>
      `;
      return;
    }

    inventoryRows.innerHTML = '';
    items.forEach((item, idx) => {
      const quantity = Number(item.quantity !== undefined ? item.quantity : (item.stock !== undefined ? item.stock : 0)) || 0;
      const alert = Number(item.alertLevel !== undefined ? item.alertLevel : 0) || 0;
      const unit = item.unit || 'pcs';
      let status = 'In Stock', statusClass = 'in-stock';
      if (quantity <= 0) { status = 'Out of Stock'; statusClass = 'out-stock'; }
      else if (quantity <= alert) { status = 'Low Stock'; statusClass = 'low-stock'; }

      inventoryRows.innerHTML += `
        <div class="table-row" data-id="${item._id}">
          <div>${escapeHtml(item.itemName || item.name || '')}${item.description ? `<div style="font-size:0.85rem;color:#64748b;">${escapeHtml(item.description)}</div>` : ''}</div>
          <div>${escapeHtml(item.category || '')}</div>
          <div>${quantity} ${escapeHtml(unit)}</div>
          <div>${alert} ${escapeHtml(unit)}</div>
          <div><span class="stock-status ${statusClass}">${status}</span></div>
          <div class="action-icons">
            <button class="icon-btn" onclick="editInventoryItem('${item._id}')" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="icon-btn delete" onclick="deleteInventoryItem('${item._id}')" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;
    });
  }

  /**
   * Render inventory for Owner (Super Admin) with full CRUD actions
   */
  async function renderInventoryOwner(containerId = 'inventoryRows') {
    const inventoryRows = document.getElementById(containerId);
    if (!inventoryRows) return;

    inventoryRows.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <h3>Loading inventory...</h3>
      </div>
    `;

    let items = await getInventory();
    const norm = normalizeInventory(items);
    items = norm.items;

    if (!items || items.length === 0) {
      inventoryRows.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-boxes"></i>
          <h3>No items in inventory</h3>
          <p>Add your first item to get started</p>
        </div>
      `;
      return;
    }

    inventoryRows.innerHTML = '';
    items.forEach((item, idx) => {
      const quantity = Number(item.quantity !== undefined ? item.quantity : (item.stock !== undefined ? item.stock : 0)) || 0;
      const alert = Number(item.alertLevel !== undefined ? item.alertLevel : 0) || 0;
      const unit = item.unit || 'pcs';
      const price = item.price || 0;
      let status = 'In Stock', statusClass = 'in-stock';
      if (quantity <= 0) { status = 'Out of Stock'; statusClass = 'out-stock'; }
      else if (quantity <= alert) { status = 'Low Stock'; statusClass = 'low-stock'; }

      inventoryRows.innerHTML += `
        <div class="table-row" data-id="${item._id}">
          <div>${escapeHtml(item.itemName || item.name || '')}${item.description ? `<div style="font-size:0.85rem;color:#64748b;">${escapeHtml(item.description)}</div>` : ''}</div>
          <div>${escapeHtml(item.category || '')}</div>
          <div>₱${price.toFixed(2)}</div>
          <div>${quantity} ${escapeHtml(unit)}</div>
          <div><span class="stock-status ${statusClass}">${status}</span></div>
          <div class="action-icons">
            <button class="icon-btn" onclick="handleEditItem('${item._id}')" title="Edit item"><i class="fas fa-edit"></i></button>
            <button class="icon-btn delete" onclick="handleDeleteItem('${item._id}')" title="Delete item"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;
    });
  }

  /**
   * Render inventory for Admin with availability toggle button
   */
  async function renderInventoryAdmin(containerId = 'inventoryRows') {
    const inventoryRows = document.getElementById(containerId);
    if (!inventoryRows) return;

    inventoryRows.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <h3>Loading inventory...</h3>
      </div>
    `;

    let items = await getInventory();
    const norm = normalizeInventory(items);
    items = norm.items;

    if (!items || items.length === 0) {
      inventoryRows.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-boxes"></i>
          <h3>No items in inventory</h3>
          <p>Add your first item to get started</p>
        </div>
      `;
      return;
    }

    inventoryRows.innerHTML = '';
    items.forEach((item, idx) => {
      const quantity = Number(item.quantity !== undefined ? item.quantity : (item.stock !== undefined ? item.stock : 0)) || 0;
      const alert = Number(item.alertLevel !== undefined ? item.alertLevel : 0) || 0;
      const unit = item.unit || 'pcs';
      const isAvailable = item.isAvailable !== false; // Default to true if not set
      let status = 'In Stock', statusClass = 'in-stock';
      if (quantity <= 0) { status = 'Out of Stock'; statusClass = 'out-stock'; }
      else if (quantity <= alert) { status = 'Low Stock'; statusClass = 'low-stock'; }

      const availabilityBtnClass = isAvailable ? 'available' : 'unavailable';
      const availabilityIcon = isAvailable ? 'fa-check-circle' : 'fa-ban';
      const availabilityTitle = isAvailable ? 'Click to mark unavailable' : 'Click to mark available';

      inventoryRows.innerHTML += `
        <div class="table-row" data-id="${item._id}" style="${!isAvailable ? 'opacity: 0.6;' : ''}">
          <div>${escapeHtml(item.itemName || item.name || '')}${item.description ? `<div style="font-size:0.85rem;color:#64748b;">${escapeHtml(item.description)}</div>` : ''}</div>
          <div>${escapeHtml(item.category || '')}</div>
          <div>${quantity} ${escapeHtml(unit)}</div>
          <div>${alert} ${escapeHtml(unit)}</div>
          <div><span class="stock-status ${statusClass}">${status}</span></div>
          <div class="action-icons">
            <button class="icon-btn ${availabilityBtnClass}" onclick="handleToggleAvailability('${item._id}', ${isAvailable})" title="${availabilityTitle}"><i class="fas ${availabilityIcon}"></i></button>
            <button class="icon-btn" onclick="editInventoryItem('${item._id}')" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="icon-btn delete" onclick="deleteInventoryItem('${item._id}')" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;
    });
  }

  // Re-render when other tabs change inventory (no longer needed with backend management)
  // window.addEventListener('storage', function(e) {
  //   if (e.key === 'inventoryItems') {
  //     renderInventoryShared('inventoryRows');
  //   }
  // });

  // initialize on DOM load if element exists
  document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('inventoryRows')) renderInventoryShared('inventoryRows');
  });

  // Shared modal and item add/edit/delete handlers
  function openAddItemModal() {
    const modal = document.getElementById('itemModal');
    if (modal) modal.classList.add('show');
  }

  function openNewItemModal() {
    const idxField = document.getElementById('itemEditIndex'); 
    if (idxField) idxField.value = '';
    const form = document.getElementById('addItemForm'); 
    if (form) form.reset();
    const prev = document.getElementById('itemPreview'); 
    if (prev) { prev.style.display = 'none'; prev.src = ''; }
    const hid = document.getElementById('itemImageData'); 
    if (hid) hid.value = '';
    if (document.getElementById('itemModal')) {
      document.getElementById('itemModal').classList.add('show');
    }
  }

  /**
   * Global "Add New Item" button handler - works for both Admin and Owner
   */
  function handleAddNewItem() {
    openNewItemModal();
  }

  function closeModal() {
    const modal = document.getElementById('itemModal'); if (modal) modal.classList.remove('show');
    const form = document.getElementById('addItemForm'); if (form) form.reset();
    const prev = document.getElementById('itemPreview'); if (prev) { prev.style.display = 'none'; prev.src = ''; }
    const hid = document.getElementById('itemImageData'); if (hid) hid.value = '';
    const idxField = document.getElementById('itemEditIndex'); if (idxField) idxField.value = '';
  }

  async function editInventoryItem(id) {
    try {
      const response = await fetch(`/api/inventory/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const item = await response.json();

      document.getElementById('itemName').value = item.itemName || '';
      document.getElementById('itemCategory').value = item.category || '';
      const priceEl = document.getElementById('itemPrice'); if (priceEl) priceEl.value = item.price !== undefined ? item.price : '';
      const unitEl = document.getElementById('itemUnit'); if (unitEl) unitEl.value = item.unit || 'pcs';
      document.getElementById('itemStock').value = item.quantity !== undefined ? item.quantity : 0;
      document.getElementById('itemAlertLevel').value = item.alertLevel !== undefined ? item.alertLevel : 0;
      document.getElementById('itemDescription').value = item.description || '';
      if (item.image) {
        const prev = document.getElementById('itemPreview'); if (prev) { prev.src = item.image; prev.style.display = ''; }
        const hid = document.getElementById('itemImageData'); if (hid) hid.value = item.image;
      } else {
        const prev = document.getElementById('itemPreview'); if (prev) prev.style.display = 'none';
        const hid = document.getElementById('itemImageData'); if (hid) hid.value = '';
      }
      const idxField = document.getElementById('itemEditIndex'); if (idxField) idxField.value = item._id;
      openAddItemModal();
    } catch (error) {
      console.error('Error fetching item for edit:', error);
      alert('Failed to load item for editing.');
    }
  }

  async function deleteInventoryItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['x-auth-token'] = token;
      }

      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Re-render inventory after successful deletion
      renderInventoryShared('inventoryRows');
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      alert('Failed to delete inventory item. Please try again later.');
    }
  }

  // image file -> dataURL (global handler if an input exists)
  document.addEventListener('change', function(e) {
    const target = e.target;
    if (!target) return;
    if (target.id === 'itemImage') {
      const file = target.files && target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(ev) {
        const data = ev.target.result;
        const hid = document.getElementById('itemImageData'); if (hid) hid.value = data;
        const prev = document.getElementById('itemPreview'); if (prev) { prev.src = data; prev.style.display = ''; }
      };
      reader.readAsDataURL(file);
    }
  });

  // Add/edit submit handler (works if a form with id addItemForm exists)
  document.addEventListener('submit', async function(e) {
    const form = e.target;
    if (!form || form.id !== 'addItemForm') return;
    e.preventDefault();

    const name = document.getElementById('itemName').value.trim();
    const category = document.getElementById('itemCategory').value;
    const price = parseFloat(document.getElementById('itemPrice').value) || 0;
    const unit = document.getElementById('itemUnit')?.value || 'pcs';
    const stock = parseInt(document.getElementById('itemStock').value) || 0;
    const alertLevel = parseInt(document.getElementById('itemAlertLevel').value) || Math.max(1, Math.floor(stock * 0.2));
    const description = document.getElementById('itemDescription').value.trim();
    const imageData = document.getElementById('itemImageData')?.value || '';
    const editId = document.getElementById('itemEditIndex')?.value;

    if (!name || !category) {
      const missingEl = !name ? document.getElementById('itemName') : document.getElementById('itemCategory');
      if (missingEl) missingEl.focus();
      return;
    }

    let imageUrl = imageData;
    // If imageData is a base64 string, it means a new image was selected or an existing one was re-selected
    if (imageData && imageData.startsWith('data:image')) {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['x-auth-token'] = token;
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ image: imageData, filename: `${name}-${Date.now()}.png` }),
        });
        const result = await response.json();
        if (response.ok) {
          imageUrl = result.fileUrl;
        } else {
          console.error('Image upload failed:', result.error);
          alert('Failed to upload image.');
          return;
        }
      } catch (error) {
        console.error('Error during image upload:', error);
        alert('Error uploading image.');
        return;
      }
    }

    const itemData = {
      itemName: name,
      category: category,
      price: price,
      unit: unit,
      quantity: stock,
      alertLevel: alertLevel,
      description: description,
      image: imageUrl
    };

    try {
      let response;
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['x-auth-token'] = token;
      }

      if (editId) {
        // Update existing item
        response = await fetch(`/api/inventory/${editId}`, {
          method: 'PUT',
          headers: headers,
          body: JSON.stringify(itemData),
        });
      } else {
        // Add new item
        response = await fetch('/api/inventory', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(itemData),
        });
      }

      const result = await response.json();
      if (response.ok) {
        // Re-render inventory after successful operation
        renderInventoryShared('inventoryRows');
        closeModal();
      } else {
        console.error('Inventory operation failed:', result.error);
        alert(`Failed to save item: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving inventory item:', error);
      alert('Error saving inventory item.');
    }
  });