// Shop Front main logic
let allProducts = [];
let currentCategory = '';

document.addEventListener('DOMContentLoaded', () => {
    AuthManager.updateUI();
    CartManager.updateBadge();
    loadDiscountBanner();
    loadProducts();
});

async function loadDiscountBanner() {
    try {
        const res = await fetch('/api/discounts/active');
        const discounts = await res.json();
        if (discounts.length > 0) {
            const banner = document.getElementById('discountBanner');
            document.getElementById('bannerContent').innerHTML = discounts.map(d =>
                `<div class="banner-item">🏷️ <strong>${d.code}</strong>: ${d.name} — Giảm ${d.type === 'percentage' ? d.value + '%' : Number(d.value).toLocaleString('vi-VN') + 'đ'}${d.min_purchase > 0 ? ' (đơn từ ' + Number(d.min_purchase).toLocaleString('vi-VN') + 'đ)' : ''}</div>`
            ).join('');
            banner.style.display = 'block';
        }
    } catch (e) { /* hide banner on error */ }
}

async function loadProducts() {
    try {
        const res = await fetch('/api/shop/products');
        allProducts = await res.json();
        renderProducts(allProducts);
        renderCategories(allProducts);
    } catch (err) {
        document.getElementById('productGrid').innerHTML = '<p>Lỗi tải sản phẩm</p>';
    }
}

function renderProducts(products) {
    const grid = document.getElementById('productGrid');
    if (products.length === 0) {
        grid.innerHTML = '<p class="no-results">Không tìm thấy sản phẩm nào</p>';
        return;
    }
    grid.innerHTML = products.map(p => `
        <div class="product-card" onclick="viewProduct(${p.id})">
            <div class="card-img">
                <img src="${p.image_url || 'https://placehold.co/300x300/1a1a2e/fff?text=' + encodeURIComponent(p.name.substring(0, 6))}" alt="${p.name}">
                ${p.has_discount ? `<span class="sale-badge">-${p.discount_percentage}%</span>` : ''}
            </div>
            <div class="card-body">
                <h3 class="card-title">${p.name}</h3>
                <p class="card-category">${p.category || 'Chung'}</p>
                <div class="card-price">
                    ${p.has_discount ? `
                        <span class="original-price">${Number(p.original_price).toLocaleString('vi-VN')}đ</span>
                        <span class="sale-price">${Number(p.final_price).toLocaleString('vi-VN')}đ</span>
                    ` : `
                        <span class="current-price">${Number(p.price).toLocaleString('vi-VN')}đ</span>
                    `}
                </div>
                <p class="card-stock">${p.stock > 0 ? `Còn ${p.stock} sản phẩm` : 'Hết hàng'}</p>
                <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart(${p.id})" ${p.stock === 0 ? 'disabled' : ''}>
                    ${p.stock === 0 ? 'Hết hàng' : '🛒 Thêm vào giỏ'}
                </button>
            </div>
        </div>
    `).join('');
}

function renderCategories(products) {
    const cats = [...new Set(products.filter(p => p.category).map(p => p.category))];
    document.getElementById('categoryChips').innerHTML = cats.map(c =>
        `<button class="cat-chip" onclick="filterCategory(this, '${c}')">${c}</button>`
    ).join('');
}

function filterCategory(btn, cat) {
    currentCategory = cat;
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const title = document.getElementById('sectionTitle');
    title.textContent = cat ? cat : 'Tất cả sản phẩm';
    const filtered = cat ? allProducts.filter(p => p.category === cat) : allProducts;
    renderProducts(filtered);
}

function handleSearch(query) {
    query = query.toLowerCase().trim();
    let filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(query) || (p.category && p.category.toLowerCase().includes(query))
    );
    if (currentCategory) filtered = filtered.filter(p => p.category === currentCategory);
    document.getElementById('sectionTitle').textContent = query ? `Kết quả: "${query}"` : (currentCategory || 'Tất cả sản phẩm');
    renderProducts(filtered);
}

async function addToCart(productId) {
    try {
        await CartManager.addItem(productId, 1);
        showToast('Đã thêm vào giỏ hàng! 🛒');
    } catch (err) {
        showToast('Lỗi: ' + err.message, true);
    }
}

function viewProduct(id) {
    // Could navigate to product-detail.html?id=X in the future
}

function showToast(msg, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'shop-toast' + (isError ? ' error' : '');
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 2500);
}
