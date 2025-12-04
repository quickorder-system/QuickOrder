// Category Management Component

const categoryManager = {
    categories: [],
    editingId: null,

    // Initialize category manager
    async init() {
        this.categories = await categoryService.getAllCategories();
        this.render();
        this.attachEventListeners();
    },

    // Render category list
    render() {
        const container = document.getElementById('categoryListContainer');
        if (!container) return;

        let html = `
            <div class="category-management">
                <div class="category-header">
                    <h3>Category Management</h3>
                    <button class="btn btn-primary" onclick="categoryManager.openCreateModal()">
                        <i class="fas fa-plus"></i> Add Category
                    </button>
                </div>

                <div class="category-list">
                    ${this.categories.map((cat, index) => `
                        <div class="category-item ${!cat.isActive ? 'inactive' : ''}" draggable="true" data-category-id="${cat._id}">
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
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-sm btn-delete" onclick="categoryManager.deleteCategory('${cat._id}')">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.setupDragAndDrop();
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
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    },

    // Setup drag and drop
    setupDragAndDrop() {
        const items = document.querySelectorAll('.category-item');
        let draggedItem = null;

        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                item.style.opacity = '0.5';
            });

            item.addEventListener('dragend', (e) => {
                item.style.opacity = '1';
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (draggedItem !== item) {
                    item.style.borderTop = '3px solid #667eea';
                }
            });

            item.addEventListener('dragleave', (e) => {
                item.style.borderTop = 'none';
            });

            item.addEventListener('drop', async (e) => {
                e.preventDefault();
                item.style.borderTop = 'none';

                if (draggedItem === item) return;

                const draggedIndex = Array.from(items).indexOf(draggedItem);
                const targetIndex = Array.from(items).indexOf(item);

                // Swap in array
                [this.categories[draggedIndex], this.categories[targetIndex]] = 
                [this.categories[targetIndex], this.categories[draggedIndex]];

                // Update order in database
                const orderedCategories = this.categories.map((cat, idx) => ({
                    _id: cat._id,
                    order: idx
                }));

                try {
                    await categoryService.reorderCategories(orderedCategories);
                    this.render();
                } catch (error) {
                    alert(`Error reordering: ${error.message}`);
                    await this.init();
                }
            });
        });
    },

    // Attach event listeners
    attachEventListeners() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('categoryModal');
            if (modal && e.target === modal) {
                this.closeModal();
            }
        });
    }
};
