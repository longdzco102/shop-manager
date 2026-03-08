/* Products Page */
const ProductsPage = {
    products: [],

    async render() {
        const content = document.getElementById('content-area');
        const isAdmin = App.user.role === 'admin';

        content.innerHTML = `
            <div class="table-toolbar">
                <div class="search-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="product-search" placeholder="Tìm sản phẩm...">
                </div>
                ${isAdmin ? '<button class="btn btn-primary" id="add-product-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Thêm sản phẩm</button>' : ''}
            </div>
            <div class="table-container">
                <table>
                    <thead><tr>
                        <th>ID</th><th>Ảnh</th><th>Tên sản phẩm</th><th>Giá</th><th>Tồn kho</th><th>Danh mục</th><th>Ngày tạo</th>${isAdmin ? '<th>Hành động</th>' : ''}
                    </tr></thead>
                    <tbody id="products-tbody">
                        <tr><td colspan="8"><div class="loading"><div class="spinner"></div></div></td></tr>
                    </tbody>
                </table>
            </div>
        `;

        // Search
        document.getElementById('product-search').addEventListener('input', (e) => {
            this.filterProducts(e.target.value);
        });

        // Add product button
        if (isAdmin) {
            document.getElementById('add-product-btn').addEventListener('click', () => {
                this.showProductForm();
            });
        }

        await this.loadProducts();
    },

    async loadProducts() {
        try {
            this.products = await App.api('/products');
            this.renderTable();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    filterProducts(search) {
        const filtered = this.products.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
        );
        this.renderTable(filtered);
    },

    renderTable(data = null) {
        const products = data || this.products;
        const isAdmin = App.user.role === 'admin';
        const tbody = document.getElementById('products-tbody');
        if (!tbody) return;

        if (products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><p>Không tìm thấy sản phẩm</p></div></td></tr>`;
            return;
        }

        tbody.innerHTML = products.map(p => {
            let stockStatus = 'in-stock';
            let stockLabel = `${p.stock}`;
            if (p.stock === 0) { stockStatus = 'out-of-stock'; stockLabel = 'Hết hàng'; }
            else if (p.stock <= 10) { stockStatus = 'low-stock'; stockLabel = `${p.stock} (Sắp hết)`; }

            return `
                <tr>
                    <td>#${p.id}</td>
                    <td>
                        <div class="product-img-thumb">
                            <img src="${p.image_url || 'https://via.placeholder.com/40?text=No+Img'}" onerror="this.src='https://via.placeholder.com/40?text=Error'">
                        </div>
                    </td>
                    <td style="font-weight:500;color:var(--text-primary)">${p.name}</td>
                    <td style="color:var(--accent-primary);font-weight:600">${App.formatCurrency(p.price)}</td>
                    <td><span class="status-badge ${stockStatus}">${stockLabel}</span></td>
                    <td>${p.category || '-'}</td>
                    <td>${App.formatDate(p.created_at)}</td>
                    ${isAdmin ? `
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-secondary" onclick="ProductsPage.showProductForm(${p.id})">Sửa</button>
                            <button class="btn btn-sm btn-danger" onclick="ProductsPage.deleteProduct(${p.id})">Xóa</button>
                        </div>
                    </td>
                    ` : ''}
                </tr>
            `;
        }).join('');
    },

    showProductForm(productId = null) {
        const product = productId ? this.products.find(p => p.id === productId) : null;
        const title = product ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới';

        App.showModal(title, `
            <form id="product-form" onsubmit="return false;">
                <div class="form-group">
                    <label>Tên sản phẩm *</label>
                    <input type="text" id="pf-name" value="${product ? product.name : ''}" required>
                </div>
                <div class="form-group">
                    <label>Link ảnh (URL)</label>
                    <input type="text" id="pf-image" value="${product ? (product.image_url || '') : ''}" placeholder="https://example.com/image.jpg">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Giá (VND) *</label>
                        <input type="number" id="pf-price" value="${product ? product.price : ''}" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>Tồn kho</label>
                        <input type="number" id="pf-stock" value="${product ? product.stock : 0}" min="0">
                    </div>
                </div>
                <div class="form-group">
                    <label>Danh mục</label>
                    <input type="text" id="pf-category" value="${product ? (product.category || '') : ''}" placeholder="Ví dụ: Thực phẩm, Đồ uống...">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Hủy</button>
                    <button type="submit" class="btn btn-primary" id="pf-submit">${product ? 'Cập nhật' : 'Thêm'}</button>
                </div>
            </form>
        `);

        document.getElementById('product-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('pf-name').value,
                image_url: document.getElementById('pf-image').value,
                price: parseFloat(document.getElementById('pf-price').value),
                stock: parseInt(document.getElementById('pf-stock').value) || 0,
                category: document.getElementById('pf-category').value
            };

            try {
                if (product) {
                    await App.api(`/products/${product.id}`, { method: 'PUT', body: JSON.stringify(data) });
                    App.toast('Cập nhật sản phẩm thành công!', 'success');
                } else {
                    await App.api('/products', { method: 'POST', body: JSON.stringify(data) });
                    App.toast('Thêm sản phẩm thành công!', 'success');
                }
                App.closeModal();
                await this.loadProducts();
            } catch (err) {
                App.toast(err.message, 'error');
            }
        });
    },

    async deleteProduct(id) {
        if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
        try {
            await App.api(`/products/${id}`, { method: 'DELETE' });
            App.toast('Đã xóa sản phẩm!', 'success');
            await this.loadProducts();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    }
};

window.ProductsPage = ProductsPage;
