/* Reports Page */
const ReportsPage = {
    charts: {},

    async render() {
        const content = document.getElementById('content-area');
        content.innerHTML = `
            <div class="stat-grid" style="margin-bottom:24px">
                <div class="stat-card" id="report-revenue-card">
                    <div class="stat-icon revenue">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                    </div>
                    <div class="stat-value" id="report-total-revenue">--</div>
                    <div class="stat-label">Tổng doanh thu</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon expenses">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/></svg>
                    </div>
                    <div class="stat-value" id="report-total-expenses">--</div>
                    <div class="stat-label">Tổng chi phí</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon profit">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
                    </div>
                    <div class="stat-value" id="report-profit">--</div>
                    <div class="stat-label">Lợi nhuận</div>
                </div>
            </div>

            <div class="chart-grid" style="margin-bottom:24px">
                <div class="chart-card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">Doanh thu & Chi phí theo tháng</div>
                            <div class="card-subtitle">So sánh doanh thu và chi phí 12 tháng</div>
                        </div>
                    </div>
                    <canvas id="profit-chart" height="300"></canvas>
                </div>
                <div class="chart-card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">Chi phí theo danh mục</div>
                            <div class="card-subtitle">Cơ cấu chi phí</div>
                        </div>
                    </div>
                    <canvas id="report-expense-chart" height="300"></canvas>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Doanh thu theo tháng</div>
                    <button class="btn btn-sm btn-primary" onclick="ReportsPage.exportToExcel()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        Xuất Excel
                    </button>
                </div>
                <div class="table-container" id="monthly-revenue-table"></div>
            </div>
        `;

        await this.loadData();
    },

    async loadData() {
        this.rawData = {};
        // Destroy old charts
        Object.values(this.charts).forEach(c => c.destroy && c.destroy());

        try {
            // Summary
            const summary = await App.api('/dashboard/summary');
            this.rawData.summary = summary;
            document.getElementById('report-total-revenue').textContent = App.formatCurrency(summary.total_revenue);
            document.getElementById('report-total-expenses').textContent = App.formatCurrency(summary.total_expenses);
            document.getElementById('report-profit').textContent = App.formatCurrency(summary.profit);

            // Profit chart
            const profitData = await App.api('/dashboard/profit-chart');
            const months = new Set([
                ...profitData.revenue.map(r => r.month),
                ...profitData.expenses.map(e => e.month)
            ]);
            const sortedMonths = [...months].sort();

            const ctx1 = document.getElementById('profit-chart');
            if (ctx1) {
                this.charts.profit = new Chart(ctx1, {
                    type: 'bar',
                    data: {
                        labels: sortedMonths.map(m => {
                            const [y, mo] = m.split('-');
                            return `T${mo}/${y}`;
                        }),
                        datasets: [
                            {
                                label: 'Doanh thu',
                                data: sortedMonths.map(m => {
                                    const r = profitData.revenue.find(x => x.month === m);
                                    return r ? r.amount : 0;
                                }),
                                backgroundColor: 'rgba(99, 102, 241, 0.6)',
                                borderColor: '#6366f1',
                                borderWidth: 1,
                                borderRadius: 6
                            },
                            {
                                label: 'Chi phí',
                                data: sortedMonths.map(m => {
                                    const e = profitData.expenses.find(x => x.month === m);
                                    return e ? e.amount : 0;
                                }),
                                backgroundColor: 'rgba(239, 68, 68, 0.6)',
                                borderColor: '#ef4444',
                                borderWidth: 1,
                                borderRadius: 6
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { labels: { color: '#9d9db5' } },
                            tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${App.formatCurrency(ctx.raw)}` } }
                        },
                        scales: {
                            x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#6b6b85' } },
                            y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#6b6b85', callback: v => App.formatCurrency(v) } }
                        }
                    }
                });
            }

            // Expense category chart
            const expenseData = await App.api('/dashboard/expense-chart');
            this.rawData.expenseData = expenseData;
            const ctx2 = document.getElementById('report-expense-chart');
            if (ctx2 && expenseData.length > 0) {
                const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#ef4444', '#14b8a6'];
                this.charts.expCat = new Chart(ctx2, {
                    type: 'pie',
                    data: {
                        labels: expenseData.map(d => d.category || 'Khác'),
                        datasets: [{
                            data: expenseData.map(d => d.total),
                            backgroundColor: colors.slice(0, expenseData.length),
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { color: '#9d9db5', padding: 12, usePointStyle: true } },
                            tooltip: { callbacks: { label: ctx => `${ctx.label}: ${App.formatCurrency(ctx.raw)}` } }
                        }
                    }
                });
            }

            // Monthly revenue table
            const monthlyData = await App.api('/dashboard/monthly-revenue');
            this.rawData.monthlyData = monthlyData;
            const tableEl = document.getElementById('monthly-revenue-table');
            if (tableEl) {
                if (monthlyData.length === 0) {
                    tableEl.innerHTML = '<div class="empty-state"><p>Chưa có dữ liệu</p></div>';
                } else {
                    tableEl.innerHTML = `
                        <table>
                            <thead><tr><th>Tháng</th><th>Doanh thu</th><th>Số đơn hàng</th></tr></thead>
                            <tbody>
                                ${monthlyData.map(m => `
                                    <tr>
                                        <td style="font-weight:500">${m.month}</td>
                                        <td style="color:var(--success);font-weight:600">${App.formatCurrency(m.revenue)}</td>
                                        <td>${m.sale_count}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;
                }
            }
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    exportToExcel() {
        if (!window.XLSX) {
            App.toast('Không tải được thư viện xuất Excel. Thử tải lại trang!', 'error');
            return;
        }

        try {
            const wb = window.XLSX.utils.book_new();

            // 1. Tóm tắt
            const summaryData = [
                ['BÁO CÁO TỔNG QUAN', ''],
                ['Ngày xuất:', new Date().toLocaleString('vi-VN')],
                [''],
                ['Chỉ số', 'Giá trị (VNĐ)'],
                ['Tổng Doanh Thu', this.rawData.summary.total_revenue || 0],
                ['Tổng Chi Phí', this.rawData.summary.total_expenses || 0],
                ['Lợi Nhuận', this.rawData.summary.profit || 0],
            ];
            const wsSummary = window.XLSX.utils.aoa_to_sheet(summaryData);
            window.XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng Quan');

            // 2. Doanh thu theo tháng
            if (this.rawData.monthlyData && this.rawData.monthlyData.length > 0) {
                const monthlyFormatted = this.rawData.monthlyData.map(m => ({
                    'Tháng': m.month,
                    'Doanh thu (VNĐ)': Number(m.revenue),
                    'Số đơn hàng': Number(m.sale_count)
                }));
                const wsMonthly = window.XLSX.utils.json_to_sheet(monthlyFormatted);
                window.XLSX.utils.book_append_sheet(wb, wsMonthly, 'Doanh Thu Tháng');
            }

            // 3. Chi phí theo danh mục
            if (this.rawData.expenseData && this.rawData.expenseData.length > 0) {
                const expenseFormatted = this.rawData.expenseData.map(e => ({
                    'Danh mục': e.category || 'Khác',
                    'Tổng chi phí (VNĐ)': Number(e.total)
                }));
                const wsExpense = window.XLSX.utils.json_to_sheet(expenseFormatted);
                window.XLSX.utils.book_append_sheet(wb, wsExpense, 'Chi Phí Mục');
            }

            // Export
            window.XLSX.writeFile(wb, `Bao_Cao_Thong_Ke_${new Date().toISOString().slice(0, 10)}.xlsx`);
            App.toast('Xuất Excel thành công!', 'success');
        } catch (err) {
            console.error('Export error:', err);
            App.toast('Có lỗi khi xuất thư viện Excel.', 'error');
        }
    }
};

window.ReportsPage = ReportsPage;
