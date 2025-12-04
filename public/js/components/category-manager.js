// Category Management - Integrated into Inventory Tab

const categoryManager = {
    categories: [],
    editingId: null,
    showingCategorySection: false,

    // Initialize category manager
    async init() {
        this.categories = await categoryService.getAllCategories();
        this.renderToggleButton();
    },

    // Render toggle button in inventory header
    renderToggleButton() {
        const headerContainer = document.querySelector('.section-header');
        if (!headerContainer || document.getElementById('categoryToggleBtn')) return;

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'categoryToggleBtn';
        toggleBtn.className = 'btn-secondary';
        toggleBtn.innerHTML = '<i class="fas fa-cog"></i> Manage Categories';
        toggleBtn.onclick = () => this.toggleCategorySection();
        headerContainer.appendChild(toggleBtn);
    },

    // Toggle category management section
    toggleCategorySection() {
        this.showingCategorySection = !this.showingCategorySection;
        if (this.showingCategorySection) {
            this.render();
        } else {
            const container = document.getElementById('categoryManagementSection');
            if (container) container.style.display = 'none';
        }
    },

    // Render category management section
    render() {
        let container = document.getElementById('categoryManagementSection');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'categoryManagementSection';
            const inventoryTab = document.getElementById('inventoryTab');
            inventoryTab.insertBefore(container, document.getElementById('inventoryRows').parentElement);
        }

        let html = `
            <div class="category-management-section">
                <div class="category-section-header">
                    <h3><i class="fas fa-tags"></i> Category Management</h3>
                    <button class="btn btn-primary btn-sm" onclick="categoryManager.openCreateModal()">
                        <i class="fas fa-plus"></i> Add Category
                    </button>
                </div>

                <div class="category-list">
                    ${this.categories.map((cat, index) => `
                        <div class="category-item ${!cat.isActive ? 'inactive' : ''}" data-category-id="${cat._id}">
                            <div class="category-icon" style="background-color: ${cat.color}">
                                <i class="fas ${cat.icon}"></i>
                            </div>
                            <div class="category-info">
                                <h4>${cat.displayName}</h4>
                                <p class="category-name">${cat.name}</p>
                                ${cat.description ? `<p class="category-description">${cat.description}</p>` : ''}
                            </div>
                            <div class="category-actions">
                                <button class="btn btn-sm btn-edit" onclick="categoryManager.openEditModal('${cat._id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-delete" onclick="categoryManager.deleteCategory('${cat._id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;
        container.style.display = 'block';
    },

    // Open create modal
    openCreateModal() {
        this.editingId = null;
        this.showModal({
            name: '',
            displayName: '',
            description: '',
            icon: 'fa-folder',
            color: '#667eea',
            isActive: true
        });
    },

    // Open edit modal
    openEditModal(categoryId) {
        const category = this.categories.find(c => c._id === categoryId);
        if (!category) return;

        this.editingId = categoryId;
        this.showModal(category);
    },

    // Show modal with form
    showModal(category) {
        const modalHtml = `
            <div class="modal-overlay" id="categoryModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${this.editingId ? 'Edit Category' : 'Create Category'}</h3>
                        <button class="modal-close" onclick="categoryManager.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <form id="categoryForm" onsubmit="categoryManager.handleFormSubmit(event)">
                        <div class="form-group">
                            <label for="categoryName">Category Name (unique, lowercase)</label>
                            <input type="text" id="categoryName" name="name" value="${category.name}" 
                                   ${this.editingId ? 'disabled' : 'required'} placeholder="e.g., burger">
                        </div>

                        <div class="form-group">
                            <label for="categoryDisplayName">Display Name</label>
                            <input type="text" id="categoryDisplayName" name="displayName" value="${category.displayName}" 
                                   required placeholder="e.g., Burgers">
                        </div>

                        <div class="form-group">
                            <label for="categoryDescription">Description (optional)</label>
                            <textarea id="categoryDescription" name="description" rows="2"
                                      placeholder="Brief description">${category.description || ''}</textarea>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="categoryIcon">Icon Class</label>
                                <input type="text" id="categoryIcon" name="icon" value="${category.icon}" 
                                       required placeholder="e.g., fa-hamburger">
                                <small>FontAwesome icon class</small>
                            </div>

                            <div class="form-group">
                                <label for="categoryColor">Color</label>
                                <input type="color" id="categoryColor" name="color" value="${category.color}" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" name="isActive" ${category.isActive ? 'checked' : ''}>
                                Active
                            </label>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="categoryManager.closeModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary">
                                ${this.editingId ? 'Update Category' : 'Create Category'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.getElementById('categoryModal').style.display = 'flex';
    },

    // Close modal
    closeModal() {
        const modal = document.getElementById('categoryModal');
        if (modal) modal.remove();
        this.editingId = null;
    },

    // Handle form submission
    async handleFormSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = {
            name: formData.get('name'),
            displayName: formData.get('displayName'),
            description: formData.get('description'),
            icon: formData.get('icon'),
            color: formData.get('color'),
            isActive: formData.get('isActive') === 'on'
        };

        try {
            if (this.editingId) {
                // Update
                await categoryService.updateCategory(this.editingId, data);
                alert('Category updated successfully');
            } else {
                // Create
                await categoryService.createCategory(data);
                alert('Category created successfully');
            }
            this.closeModal();
            await this.init();
            this.render();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    },

    // Delete category
    async deleteCategory(categoryId) {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            await categoryService.deleteCategory(categoryId);
            alert('Category deleted successfully');
            await this.init();
            this.render();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }
};
