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
        <div class="table-row" data-id="${item._id}" style="${quantity <= 0 ? 'opacity: 0.6;' : ''}">
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
      const isAvailable = item.isAvailable !== false; // Default to true if not set
      let status = 'In Stock', statusClass = 'in-stock';
      if (quantity <= 0) { status = 'Out of Stock'; statusClass = 'out-stock'; }
      else if (quantity <= alert) { status = 'Low Stock'; statusClass = 'low-stock'; }

      const availabilityBtnClass = isAvailable ? 'available' : 'unavailable';
      const availabilityIcon = isAvailable ? 'fa-check-circle' : 'fa-ban';
      const availabilityTitle = quantity <= 0 ? 'Out of Stock - Increase quantity to enable' : (isAvailable ? 'Click to mark unavailable' : 'Click to mark available');
      const availabilityDisabled = quantity <= 0 ? 'disabled' : '';

      inventoryRows.innerHTML += `
        <div class="table-row" data-id="${item._id}" style="${(!isAvailable || quantity <= 0) ? 'opacity: 0.6;' : ''}">
          <div>${escapeHtml(item.itemName || item.name || '')}${item.description ? `<div style="font-size:0.85rem;color:#64748b;">${escapeHtml(item.description)}</div>` : ''}</div>
          <div>${escapeHtml(item.category || '')}</div>
          <div>₱${price.toFixed(2)}</div>
          <div>${quantity} ${escapeHtml(unit)}</div>
          <div>${alert} ${escapeHtml(unit)}</div>
          <div><span class="stock-status ${statusClass}">${status}</span></div>
          <div class="action-icons">
            <button class="icon-btn ${availabilityBtnClass}" ${availabilityDisabled} onclick="handleToggleAvailability('${item._id}', ${isAvailable})" title="${availabilityTitle}"><i class="fas ${availabilityIcon}"></i></button>
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
      const price = item.price || 0;
      const isAvailable = item.isAvailable !== false; // Default to true if not set
      let status = 'In Stock', statusClass = 'in-stock';
      if (quantity <= 0) { status = 'Out of Stock'; statusClass = 'out-stock'; }
      else if (quantity <= alert) { status = 'Low Stock'; statusClass = 'low-stock'; }

      const availabilityBtnClass = isAvailable ? 'available' : 'unavailable';
      const availabilityIcon = isAvailable ? 'fa-check-circle' : 'fa-ban';
      const availabilityTitle = quantity <= 0 ? 'Out of Stock - Increase quantity to enable' : (isAvailable ? 'Click to mark unavailable' : 'Click to mark available');
      const availabilityDisabled = quantity <= 0 ? 'disabled' : '';

      inventoryRows.innerHTML += `
        <div class="table-row" data-id="${item._id}" style="${(!isAvailable || quantity <= 0) ? 'opacity: 0.6;' : ''}">
          <div>${escapeHtml(item.itemName || item.name || '')}${item.description ? `<div style="font-size:0.85rem;color:#64748b;">${escapeHtml(item.description)}</div>` : ''}</div>
          <div>${escapeHtml(item.category || '')}</div>
          <div>₱${price.toFixed(2)}</div>
          <div>${quantity} ${escapeHtml(unit)}</div>
          <div>${alert} ${escapeHtml(unit)}</div>
          <div><span class="stock-status ${statusClass}">${status}</span></div>
          <div class="action-icons">
            <button class="icon-btn ${availabilityBtnClass}" ${availabilityDisabled} onclick="handleToggleAvailability('${item._id}', ${isAvailable})" title="${availabilityTitle}"><i class="fas ${availabilityIcon}"></i></button>
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
    const customCat = document.getElementById('customCategory'); 
    if (customCat) { customCat.style.display = 'none'; customCat.value = ''; }
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
    const customCat = document.getElementById('customCategory'); if (customCat) { customCat.style.display = 'none'; customCat.value = ''; }
    // Note: variationsData is NOT cleared here because it will be reloaded when editing a new item
    // or cleared when opening a new item modal via the wrapped openNewItemModal function
  }

  async function editInventoryItem(id) {
    try {
      const token = localStorage.getItem('token');
      console.log('[Edit] Token from localStorage:', token ? 'Present' : 'Missing');
      
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        window.location.href = 'Login.html';
        return;
      }

      const headers = {
        'x-auth-token': token,
        'Content-Type': 'application/json'
      };

      console.log('[Edit] Fetching item:', id);
      const response = await fetch(`/api/inventory/${id}`, {
        headers: headers
      });
      
      console.log('[Edit] Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const item = await response.json();
      console.log('[Edit] Item loaded successfully with variations:', item.variations);

      document.getElementById('itemName').value = item.itemName || '';
      
      // Handle category display
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
      
      // Load variations if they exist
      variationsData = item.variations || [];
      console.log('[Edit] Loaded variations into variationsData:', variationsData);
      console.log('[Edit] variationsData.length:', variationsData.length);
      renderVariationsList();
      console.log('[Edit] After renderVariationsList, container innerHTML:', document.getElementById('variationsList')?.innerHTML);
      
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
      console.log('[Delete] Token from localStorage:', token ? 'Present' : 'Missing');
      
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        window.location.href = 'Login.html';
        return;
      }

      const headers = {
        'x-auth-token': token,
        'Content-Type': 'application/json'
      };

      console.log('[Delete] Sending DELETE request to /api/inventory/' + id);
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
        headers: headers,
      });

      console.log('[Delete] Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('[Delete] Error response:', errorData);
        throw new Error(`HTTP error! status: ${response.status}. ${errorData}`);
      }
      
      const result = await response.json();
      console.log('[Delete] Item deleted successfully:', result);
      
      // Log activity
      const page = document.body.id === 'adminPage' ? 'ADMIN' : 'OWNER';
      await logActivity('DELETE_ITEM', page, `Deleted item: ${id}`, { itemId: id });
      
      // Re-render inventory after successful deletion
      await renderInventoryShared('inventoryRows');
      alert('Item deleted successfully.');
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      alert(`Failed to delete inventory item: ${error.message}`);
    }
  }

  // image file -> dataURL (global handler if an input exists)
  document.addEventListener('change', function(e) {
    const target = e.target;
    if (!target) return;
    
    // Handle category dropdown change
    if (target.id === 'itemCategory') {
      const customInput = document.getElementById('customCategory');
      if (customInput) {
        if (target.value === 'custom') {
          customInput.style.display = 'block';
          customInput.focus();
          customInput.value = '';
        } else {
          customInput.style.display = 'none';
          customInput.value = '';
        }
      }
      return;
    }
    
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

  // ===== VARIATIONS MANAGEMENT =====
  let variationsData = [];  // Store variations being created/edited

  // Get variations data from form
  function getVariationsFromForm() {
    return variationsData;
  }

  // Render variations list UI
  function renderVariationsList() {
    const container = document.getElementById('variationsList');
    if (!container) {
      console.log('[RenderVariations] Container not found');
      return;
    }

    console.log('[RenderVariations] Called. variationsData =', variationsData);
    // Ensure variationsData is an array
    if (!Array.isArray(variationsData)) {
      console.warn('[RenderVariations] variationsData is not an array, converting to empty array');
      variationsData = [];
    }
    
    console.log('[RenderVariations] variationsData.length =', variationsData.length);
    
    if (variationsData.length === 0) {
      container.innerHTML = '<p style="color: #999; font-size: 0.9rem; margin: 8px 0;">No variations added yet</p>';
      console.log('[RenderVariations] No variations, showing empty message');
      return;
    }

    console.log('[RenderVariations] Rendering', variationsData.length, 'variations');
      <div class="variation-group-card">
        <div class="variation-group-header">
          <h4>${variation.variationName || 'Unknown'}</h4>
          <button type="button" class="btn-small btn-danger" data-delete-variation="${varIndex}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <div class="variation-options">
          ${(variation.options || []).map((option, optIndex) => `
            <div class="variation-option-item">
              <span class="option-name">${option.optionName || 'Unknown'}</span>
              <span class="option-price">${option.priceModifier >= 0 ? '+' : ''}₱${(option.priceModifier || 0).toFixed(2)}</span>
              <button type="button" class="btn-small btn-danger" data-delete-option="${varIndex}-${optIndex}">
                <i class="fas fa-times"></i>
              </button>
            </div>
          `).join('')}
          <button type="button" class="btn-small btn-secondary" data-add-option="${varIndex}">
            + Add Option
          </button>
        </div>
      </div>
    `).join('');

    // Attach event listeners
    container.querySelectorAll('[data-delete-variation]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const idx = parseInt(btn.getAttribute('data-delete-variation'));
        variationsData.splice(idx, 1);
        renderVariationsList();
      });
    });

    container.querySelectorAll('[data-delete-option]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const [varIdx, optIdx] = btn.getAttribute('data-delete-option').split('-').map(Number);
        variationsData[varIdx].options.splice(optIdx, 1);
        renderVariationsList();
      });
    });

    container.querySelectorAll('[data-add-option]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const varIdx = parseInt(btn.getAttribute('data-add-option'));
        const optionName = prompt('Enter option name (e.g., "Small", "Medium", "Large"):');
        if (!optionName) return;
        
        const priceModifier = parseFloat(prompt('Price modifier (₱) [e.g., 0, 15, 30]:') || '0');
        const quantity = parseInt(prompt('Stock quantity:') || '0');
        
        variationsData[varIdx].options.push({
          optionName: optionName.trim(),
          priceModifier: priceModifier,
          quantity: quantity,
          isAvailable: true
        });
        renderVariationsList();
      });
    });
  }

  // Add variation button
  document.addEventListener('click', function(e) {
    if (e.target.closest('#addVariationBtn')) {
      e.preventDefault();
      const variationName = prompt('Enter variation name (e.g., "Size", "Flavor", "Portion"):');
      if (!variationName) return;

      const optionName = prompt('Enter first option name (e.g., "Small"):');
      if (!optionName) return;

      const priceModifier = parseFloat(prompt('Price modifier for this option (₱) [e.g., 0]:') || '0');
      const quantity = parseInt(prompt('Stock quantity for this option:') || '0');

      variationsData.push({
        variationName: variationName.trim(),
        options: [{
          optionName: optionName.trim(),
          priceModifier: priceModifier,
          quantity: quantity,
          isAvailable: true
        }]
      });

      renderVariationsList();
    }
  });

  // Initialize on modal open
  const originalOpenNewItemModal = window.openNewItemModal;
  window.openNewItemModal = function() {
    variationsData = [];  // Reset variations
    renderVariationsList();
    if (originalOpenNewItemModal) originalOpenNewItemModal();
  };

  // Add/edit submit handler (works if a form with id addItemForm exists)
  document.addEventListener('submit', async function(e) {
    const form = e.target;
    if (!form || form.id !== 'addItemForm') return;
    e.preventDefault();

    const name = document.getElementById('itemName').value.trim();
    let category = document.getElementById('itemCategory').value;
    
    // Handle custom category
    if (category === 'custom') {
      const customCat = document.getElementById('customCategory').value.trim();
      if (!customCat) {
        alert('Please enter a custom category name');
        document.getElementById('customCategory').focus();
        return;
      }
      category = customCat.toLowerCase().replace(/\s+/g, '-'); // Convert to lowercase and replace spaces with hyphens
    }
    
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
        // Convert base64 to Blob
        const parts = imageData.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const binaryString = atob(parts[1]);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });

        // Create FormData and append the blob
        const formData = new FormData();
        formData.append('paymentScreenshot', blob, 'item-image.jpg');

        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
          headers['x-auth-token'] = token;
        }

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: headers,
          body: formData,
        });
        const result = await uploadResponse.json();
        if (uploadResponse.ok) {
          imageUrl = result.fileUrl;
        } else {
          console.error('Image upload failed:', result.error);
          alert('Failed to upload image: ' + (result.error || 'Unknown error'));
          return;
        }
      } catch (error) {
        console.error('Error during image upload:', error);
        alert('Error uploading image: ' + error.message);
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
      image: imageUrl,
      variations: getVariationsFromForm()  // NEW: Get variations from form
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
        console.log('[Inventory] Item saved successfully:', result);
        
        // Log activity
        const action = editId ? 'UPDATE_ITEM' : 'CREATE_ITEM';
        const page = document.body.id === 'adminPage' ? 'ADMIN' : 'OWNER';
        await logActivity(action, page, `${action === 'CREATE_ITEM' ? 'Created' : 'Updated'} item: ${name}`, {
          itemId: result._id,
          itemName: name,
          category: category,
          price: price
        });
        
        // Clear edit index for next operation
        const idxField = document.getElementById('itemEditIndex');
        if (idxField) idxField.value = '';
        // Re-render inventory after successful operation
        await renderInventoryShared('inventoryRows');
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