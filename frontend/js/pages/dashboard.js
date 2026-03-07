/* Dashboard Page */
const DashboardPage = {
    charts: {},

    async render() {
        const content = document.getElementById('content-area');
        try {
            const summary = await App.api('/dashboard/summary');
            content.innerHTML = `
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-icon revenue">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                        </div>
                        <div class="stat-value">${App.formatCurrency(summary.total_revenue)}</div>
                        <div class="stat-label">Tổng doanh thu</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon expenses">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg>
                        </div>
                        <div class="stat-value">${App.formatCurrency(summary.total_expenses)}</div>
                        <div class="stat-label">Tổng chi phí</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon profit">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
                        </div>
                        <div class="stat-value">${App.formatCurrency(summary.profit)}</div>
                        <div class="stat-label">Lợi nhuận</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon today">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                        </div>
                        <div class="stat-value">${App.formatCurrency(summary.today_revenue)}</div>
                        <div class="stat-label">Doanh thu hôm nay</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon products">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                        </div>
                        <div class="stat-value">${summary.product_count}</div>
                        <div class="stat-label">Sản phẩm</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon sales">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
                        </div>
                        <div class="stat-value">${summary.sale_count}</div>
                        <div class="stat-label">Đơn bán hàng</div>
                    </div>
                </div>
                <div class="chart-grid">
                    <div class="chart-card">
                        <div class="card-header">
                            <div>
                                <div class="card-title">Doanh thu 30 ngày gần nhất</div>
                                <div class="card-subtitle">Biểu đồ doanh thu theo ngày</div>
                            </div>
                        </div>
                        <canvas id="revenue-chart"></canvas>
                    </div>
                    <div class="chart-card">
                        <div class="card-header">
                            <div>
                                <div class="card-title">Chi phí theo danh mục</div>
                                <div class="card-subtitle">Phân bổ chi phí</div>
                            </div>
                        </div>
                        <canvas id="expense-chart"></canvas>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Đơn bán hàng gần đây</div>
                    </div>
                    <div id="recent-sales-table"></div>
                </div>
            `;
            this.loadCharts();
            this.loadRecentSales();
        } catch (err) {
            content.innerHTML = `<div class="form-error">${err.message}</div>`;
        }
    },

    async loadCharts() {
        // Destroy existing charts
        Object.values(this.charts).forEach(c => c.destroy && c.destroy());

        // Revenue chart
        try {
            const revenueData = await App.api('/dashboard/revenue-chart');
            const ctx1 = document.getElementById('revenue-chart');
            if (ctx1) {
                this.charts.revenue = new Chart(ctx1, {
                    type: 'line',
                    data: {
                        labels: revenueData.map(d => {
                            const date = new Date(d.date);
                            return `${date.getDate()}/${date.getMonth() + 1}`;
                        }),
                        datasets: [{
                            label: 'Doanh thu',
                            data: revenueData.map(d => d.revenue),
                            borderColor: '#6366f1',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2,
                            pointRadius: 3,
                            pointBackgroundColor: '#6366f1'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: (ctx) => App.formatCurrency(ctx.raw)
                                }
                            }
                        },
                        scales: {
                            x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#6b6b85' } },
                            y: {
                                grid: { color: 'rgba(255,255,255,0.03)' },
                                ticks: { color: '#6b6b85', callback: v => App.formatCurrency(v) }
                            }
                        }
                    }
                });
            }
        } catch (e) { console.log('Revenue chart error:', e); }

        // Expense pie chart
        try {
            const expenseData = await App.api('/dashboard/expense-chart');
            const ctx2 = document.getElementById('expense-chart');
            if (ctx2 && expenseData.length > 0) {
                const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#ef4444', '#14b8a6'];
                this.charts.expense = new Chart(ctx2, {
                    type: 'doughnut',
                    data: {
                        labels: expenseData.map(d => d.category || 'Khác'),
                        datasets: [{
                            data: expenseData.map(d => d.total),
                            backgroundColor: colors.slice(0, expenseData.length),
                            borderWidth: 0,
                            hoverOffset: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: { color: '#9d9db5', padding: 12, usePointStyle: true }
                            },
                            tooltip: {
                                callbacks: {
                                    label: (ctx) => `${ctx.label}: ${App.formatCurrency(ctx.raw)}`
                                }
                            }
                        }
                    }
                });
            }
        } catch (e) { console.log('Expense chart error:', e); }
    },

    async loadRecentSales() {
        try {
            const sales = await App.api('/dashboard/recent-sales');
            const el = document.getElementById('recent-sales-table');
            if (!el) return;
            if (sales.length === 0) {
                el.innerHTML = '<div class="empty-state"><p>Chưa có đơn bán hàng nào</p></div>';
                return;
            }
            el.innerHTML = `
                <div class="table-container">
                    <table>
                        <thead><tr>
                            <th>ID</th><th>Nhân viên</th><th>Tổng tiền</th><th>Thời gian</th>
                        </tr></thead>
                        <tbody>
                            ${sales.map(s => `
                                <tr>
                                    <td>#${s.id}</td>
                                    <td>${s.full_name || s.username}</td>
                                    <td style="color:var(--success);font-weight:600">${App.formatCurrency(s.total)}</td>
                                    <td>${App.formatDateTime(s.created_at)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (e) { console.log('Recent sales error:', e); }
    }
};
