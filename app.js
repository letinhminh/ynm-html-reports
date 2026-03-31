document.addEventListener('DOMContentLoaded', () => {
    const reportGrid = document.getElementById('report-grid');
    const totalReportsEl = document.getElementById('total-reports');
    const lastUpdateEl = document.getElementById('last-update');

    async function loadReports() {
        try {
            const response = await fetch('manifest.json');
            if (!response.ok) {
                throw new Error('Manifest not found');
            }
            const data = await response.json();
            renderReports(data.reports);
            
            // Update stats
            totalReportsEl.textContent = data.reports.length;
            const lastUpdated = new Date(data.lastUpdated);
            lastUpdateEl.textContent = lastUpdated.toLocaleDateString() + ' ' + lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            console.error('Error loading reports:', error);
            renderEmptyState('No reports found. Add some HTML files to the reports/ directory.');
        }
    }

    function renderReports(reports) {
        if (!reports || reports.length === 0) {
            renderEmptyState('No reports found. Add some HTML files to the reports/ directory.');
            return;
        }

        reportGrid.innerHTML = '';
        reports.forEach((report, index) => {
            const card = document.createElement('div');
            card.className = 'report-card';
            card.style.animationDelay = `${0.1 * index}s`; // Staggered animation
            
            const dateStr = new Date(report.modified).toLocaleDateString();
            const sizeStr = formatBytes(report.size);

            card.innerHTML = `
                <div class="report-icon">
                    <i data-lucide="file-text"></i>
                </div>
                <div class="report-info">
                    <h3>${report.name}</h3>
                    <div class="report-meta">
                        <span><i data-lucide="calendar"></i> ${dateStr}</span>
                        <span><i data-lucide="hard-drive"></i> ${sizeStr}</span>
                    </div>
                </div>
                <a href="${report.path}" target="_blank" class="view-btn">View Report</a>
            `;

            card.addEventListener('click', () => {
                window.open(report.path, '_blank');
            });

            reportGrid.appendChild(card);
        });

        // Re-initialize icons for new elements
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function renderEmptyState(message) {
        reportGrid.innerHTML = `
            <div class="empty-state">
                <div class="report-icon" style="margin: 0 auto 1.5rem;">
                    <i data-lucide="alert-circle" style="width: 32px; height: 32px;"></i>
                </div>
                <p>${message}</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    loadReports();
});
