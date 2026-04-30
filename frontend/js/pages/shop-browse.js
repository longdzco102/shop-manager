/* ======================================
   SHOP BROWSE PAGE (Customer)
   LAYOUT GIỐNG Y NGUYÊN Web_DACN:
   - Header nav ngang
   - Hero section dark
   - Category tabs
   - Product grid 4 cột
   - Stock bar, tags, badges
   - Footer
   ====================================== */
const ShopBrowsePage = {
    products: [],
    currentCategory: '',

    async render() {
        const content = document.getElementById('content-area');
        // Render full-page layout giống Web_DACN
        content.innerHTML = `
            <!-- HERO SECTION -->
            <section class="hero">
                <h1>Chào mừng đến <span class="brand-text">MyShop</span></h1>
                <p>Hệ thống Quản lý Nhà hàng & Cửa hàng Tạp hóa tiện lợi nhất!</p>
                <div class="search-box">
                    <input type="text" id="shop-search-input" placeholder="Tìm kiếm món ăn, đồ uống, nhu yếu phẩm..." oninput="ShopBrowsePage.filterProducts()">
                    <button onclick="ShopBrowsePage.filterProducts()">🔍</button>
                </div>
            </section>

            <!-- MAIN PRODUCT GRID -->
            <section class="shop-content">
                <div class="category-tabs" id="shop-categories">
                    <button class="tab active" onclick="ShopBrowsePage.setCategory(this, '')">Tất cả</button>
                </div>
                <h2 class="section-title" id="shop-section-title">Danh mục sản phẩm & Dịch vụ</h2>
                <div class="product-grid" id="shop-product-grid">
                    <div class="loading"><div class="spinner"></div></div>
                </div>
            </section>
        `;
        await this.loadProducts();
    },

    async loadProducts() {
        try {
            this.products = await App.api('/shop/products');
            this.renderCategories();
            this.renderProducts(this.products);
        } catch (err) {
            document.getElementById('shop-product-grid').innerHTML = '<p style="text-align:center;width:100%;grid-column: 1/-1;padding:50px 0;">Lỗi tải sản phẩm</p>';
        }
    },

    renderCategories() {
        const cats = [...new Set(this.products.filter(p => p.category).map(p => p.category))];
        const container = document.getElementById('shop-categories');
        container.innerHTML = `<button class="tab active" onclick="ShopBrowsePage.setCategory(this, '')">Tất cả</button>` +
            cats.map(c => `<button class="tab" onclick="ShopBrowsePage.setCategory(this, '${c}')">${c}</button>`).join('');
    },

    setCategory(btn, cat) {
        this.currentCategory = cat;
        document.querySelectorAll('.tab').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('shop-section-title').textContent = cat || 'Danh mục sản phẩm & Dịch vụ';
        this.filterProducts();
    },

    filterProducts() {
        const query = (document.getElementById('shop-search-input')?.value || '').toLowerCase().trim();
        let filtered = this.products;
        if (this.currentCategory) filtered = filtered.filter(p => p.category === this.currentCategory);
        if (query) filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || (p.category && p.category.toLowerCase().includes(query)));
        this.renderProducts(filtered);
    },

    _getTag(p) {
        if (p.has_discount && p.discount_percentage >= 15) return '<span class="tag tag-trend">Xu hướng</span>';
        if (p.stock <= 5 && p.stock > 0) return '<span class="tag tag-hot">Sắp hết</span>';
        if (p.has_discount) return '<span class="tag tag-new">Giảm giá</span>';
        return '';
    },

    _stockPercent(p) {
        // Giả lập stock bar dựa trên stock hiện tại
        if (p.stock <= 0) return 100;
        if (p.stock <= 5) return 90;
        if (p.stock <= 10) return 70;
        if (p.stock <= 20) return 50;
        return 30;
    },

    _stockText(p) {
        if (p.stock <= 0) return 'Hết hàng';
        if (p.stock <= 5) return 'Sắp hết';
        return `Còn ${p.stock} sản phẩm`;
    },

    renderProducts(products) {
        const grid = document.getElementById('shop-product-grid');
        if (!products.length) {
            grid.innerHTML = '<div class="empty-state"><p>Không tìm thấy sản phẩm nào</p></div>';
            return;
        }
        grid.innerHTML = products.map(p => `
            <a href="javascript:void(0);" class="product-link" onclick="ShopBrowsePage.viewDetail(${p.id})">
                <div class="product-card ${p.stock <= 0 ? 'out-of-stock' : ''}">
                    <div class="img-container">
                        <img src="${p.image_url || 'https://placehold.co/300x300/f5f5fa/999?text=' + encodeURIComponent(p.name.substring(0, 8))}" alt="${p.name}" loading="lazy">
                        ${p.has_discount ? `<span class="discount-badge-absolute">-${Math.round(p.discount_percentage)}%</span>` : ''}
                    </div>
                    <div class="product-info">
                        <div class="product-title">${this._getTag(p)} ${p.name}</div>
                        <div class="product-price">
                            <span class="current-price">${Number(p.final_price).toLocaleString('vi-VN')} đ</span>
                            ${p.has_discount ? `<span class="discount-percent">-${p.discount_percentage}%</span>` : ''}
                        </div>
                        ${p.has_discount 
                            ? `<div class="original-price">${Number(p.original_price).toLocaleString('vi-VN')} đ</div>` 
                            : '<div class="original-price-placeholder">\u00a0</div>'}
                        <div class="stock-bar">
                            <div class="stock-progress" style="width: ${this._stockPercent(p)}%;"></div>
                            <span class="stock-text">${this._stockText(p)}</span>
                        </div>
                    </div>
                </div>
            </a>
        `).join('');
    },

    async addToCart(productId) {
        try {
            await App.api('/cart/items', {
                method: 'POST',
                body: JSON.stringify({ productId, quantity: 1 })
            });
            App.toast('Đã thêm vào giỏ hàng! 🛒', 'success');
            this.updateCartBadge();
        } catch (err) {
            App.toast('Lỗi: ' + err.message, 'error');
        }
    },

    async updateCartBadge() {
        try {
            const cart = await App.api('/cart');
            const count = cart.itemCount || 0;
            const badge = document.getElementById('cart-nav-badge');
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? '' : 'none';
            }
            const mobileBadge = document.getElementById('cart-mobile-badge');
            if (mobileBadge) {
                mobileBadge.textContent = count;
                mobileBadge.style.display = count > 0 ? '' : 'none';
            }
        } catch (e) { /* ignore */ }
    },

    viewDetail(id) {
        const p = this.products.find(x => x.id === id);
        if (!p) return;
        // Render detail page giống Web_DACN detail.html
        const content = document.getElementById('content-area');
        content.innerHTML = `
            <section class="detail-container" style="margin-top:0;">
                <div class="breadcrumb">
                    <a href="#" onclick="event.preventDefault();App.navigate('shop')">Trang chủ</a> > <span>${p.name}</span>
                </div>
                <div class="detail-card">
                    <div class="detail-image-section">
                        <div class="main-image-box">
                            <img id="detail-main-img" src="${p.image_url || 'https://placehold.co/400x400/f5f5fa/999?text=' + encodeURIComponent(p.name.substring(0, 8))}" alt="${p.name}">
                        </div>
                        <div class="action-buttons-left">
                            <button class="btn-outline-red" onclick="ShopBrowsePage.addToCart(${p.id})" ${p.stock === 0 ? 'disabled' : ''}>🛒 Thêm vào giỏ hàng</button>
                            <button class="btn-solid-red" onclick="ShopBrowsePage.addToCart(${p.id});App.navigate('my-cart');" ${p.stock === 0 ? 'disabled' : ''}>Mua ngay</button>
                        </div>
                    </div>
                    <div class="detail-info-section">
                        <h1 class="detail-title">${p.name}</h1>
                        <div class="detail-meta">
                            <p>Cung cấp bởi: <span style="color:#6366f1;font-weight:600;">MyShop</span></p>
                            <p>Danh mục: <strong>${p.category || 'Chung'}</strong></p>
                        </div>
                        <div class="detail-price-box">
                            <span class="detail-current-price">${Number(p.final_price).toLocaleString('vi-VN')} đ</span>
                            ${p.has_discount ? `
                                <span class="discount-percent" style="font-size:14px;margin-left:12px;">-${p.discount_percentage}%</span>
                                <div style="margin-top:8px;">
                                    <span style="text-decoration:line-through;color:#94a3b8;font-size:16px;">${Number(p.original_price).toLocaleString('vi-VN')} đ</span>
                                </div>
                            ` : ''}
                        </div>
                        <div class="stock-status">
                            ${p.stock > 0 ? '<span style="color:#2563eb;font-weight:500;">✅ Còn hàng</span>' : '<span style="color:#ef4444;font-weight:500;">❌ Hết hàng</span>'}
                            <span style="margin-left:12px;color:#64748b;">Kho: ${p.stock} sản phẩm</span>
                        </div>
                        <div class="product-commitment" style="margin-top: 30px; border-top: 1px dashed #e2e8f0; padding-top: 20px;">
                            <h3 style="margin-bottom: 15px; font-size: 16px; color: #1e293b;">Cam Kết MyShop:</h3>
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; color: #475569;">
                                <span style="font-size: 18px;">✅</span> Nguyên liệu tươi sạch, nguồn gốc rõ ràng.
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; color: #475569;">
                                <span style="font-size: 18px;">🚀</span> Giao hàng siêu tốc trong 30-60 phút.
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px; color: #475569;">
                                <span style="font-size: 18px;">🎁</span> Nhận ngay quà tặng kèm hấp dẫn.
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }
};
