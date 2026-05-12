// --- SHA-256 helper using Web Crypto API (no external libs needed) ---
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Modal management ---
function createPasswordModal() {
    const modal = document.createElement('div');
    modal.id = 'password-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-box">
            <div class="modal-icon"><i data-lucide="lock"></i></div>
            <h2 class="modal-title">Báo cáo riêng tư</h2>
            <p class="modal-desc">Nhập mật khẩu để xem báo cáo này.</p>
            <div class="modal-input-wrap">
                <input id="modal-password-input" type="password" placeholder="Nhập mật khẩu..." autocomplete="current-password">
                <button id="modal-toggle-pw" type="button" class="toggle-pw-btn">
                    <i data-lucide="eye"></i>
                </button>
            </div>
            <p id="modal-error" class="modal-error" style="display:none;">❌ Mật khẩu không đúng, vui lòng thử lại.</p>
            <div class="modal-actions">
                <button id="modal-cancel-btn" class="modal-btn modal-btn-cancel">Hủy</button>
                <button id="modal-submit-btn" class="modal-btn modal-btn-submit">
                    <i data-lucide="unlock"></i> Xác nhận
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return modal;
}

function showPasswordModal(report, onSuccess) {
    const modal = document.getElementById('password-modal') || createPasswordModal();
    const input = document.getElementById('modal-password-input');
    const errorEl = document.getElementById('modal-error');
    const submitBtn = document.getElementById('modal-submit-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const toggleBtn = document.getElementById('modal-toggle-pw');

    // Reset state
    input.value = '';
    errorEl.style.display = 'none';
    modal.classList.add('active');
    submitBtn.disabled = false;
    setTimeout(() => input.focus(), 100);

    async function handleSubmit() {
        const pw = input.value.trim();
        if (!pw) return;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader"></i> Đang kiểm tra...';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const hash = await sha256(pw);
        if (hash === report.passwordHash) {
            // Cache in sessionStorage
            sessionStorage.setItem('unlocked_' + report.path, '1');
            closeModal();
            onSuccess();
        } else {
            errorEl.style.display = 'block';
            input.value = '';
            input.focus();
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-lucide="unlock"></i> Xác nhận';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }

    function closeModal() {
        modal.classList.remove('active');
        input.value = '';
        errorEl.style.display = 'none';
        submitBtn.removeEventListener('click', handleSubmit);
        cancelBtn.removeEventListener('click', closeModal);
        input.removeEventListener('keydown', onKeyDown);
        modal.removeEventListener('click', onOverlayClick);
        toggleBtn.removeEventListener('click', onToggle);
    }

    function onKeyDown(e) {
        if (e.key === 'Enter') handleSubmit();
        if (e.key === 'Escape') closeModal();
    }

    function onOverlayClick(e) {
        if (e.target === modal) closeModal();
    }

    function onToggle() {
        input.type = input.type === 'password' ? 'text' : 'password';
        const icon = toggleBtn.querySelector('i');
        icon.setAttribute('data-lucide', input.type === 'password' ? 'eye' : 'eye-off');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    submitBtn.addEventListener('click', handleSubmit);
    cancelBtn.addEventListener('click', closeModal);
    input.addEventListener('keydown', onKeyDown);
    modal.addEventListener('click', onOverlayClick);
    toggleBtn.addEventListener('click', onToggle);
}

// --- Main app ---
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
            if (report.private) card.classList.add('is-private');
            card.style.animationDelay = `${0.1 * index}s`;
            
            const dateStr = new Date(report.modified).toLocaleDateString('vi-VN');
            const sizeStr = formatBytes(report.size);
            const category = report.category || 'General';
            const isPrivate = report.private && report.passwordHash;
            const isUnlocked = sessionStorage.getItem('unlocked_' + report.path) === '1';

            const privateBadgeHtml = isPrivate
                ? `<span class="private-badge"><i data-lucide="lock"></i> Riêng tư</span>`
                : '';

            const viewBtnHtml = (isPrivate && !isUnlocked)
                ? `<button class="view-btn view-btn-locked"><i data-lucide="lock"></i> Nhập mật khẩu</button>`
                : `<a href="${report.path}" target="_blank" class="view-btn">Xem báo cáo</a>`;

            card.innerHTML = `
                <div class="report-icon">
                    <i data-lucide="${isPrivate && !isUnlocked ? 'file-lock-2' : 'file-text'}"></i>
                    <span class="category-badge">${category}</span>
                </div>
                ${privateBadgeHtml}
                <div class="report-info">
                    <h3>${report.name.replace('.html', '').replace(/_/g, ' ')}</h3>
                    <div class="report-meta">
                        <span><i data-lucide="calendar"></i> ${dateStr}</span>
                        <span><i data-lucide="hard-drive"></i> ${sizeStr}</span>
                    </div>
                </div>
                ${viewBtnHtml}
            `;

            function openReport() {
                window.open(report.path, '_blank');
            }

            card.addEventListener('click', (e) => {
                // Avoid double-trigger if clicking the <a> link directly
                if (e.target.tagName === 'A') return;
                if (isPrivate && !isUnlocked) {
                    if (sessionStorage.getItem('unlocked_' + report.path) === '1') {
                        openReport();
                    } else {
                        showPasswordModal(report, () => {
                            // Re-render this card as unlocked
                            card.querySelector('.view-btn-locked').outerHTML = `<a href="${report.path}" target="_blank" class="view-btn">Xem báo cáo</a>`;
                            openReport();
                        });
                    }
                } else {
                    openReport();
                }
            });

            // Also handle the locked button click specifically
            card.addEventListener('click', (e) => {
                if (e.target.closest('.view-btn-locked')) {
                    e.stopPropagation();
                    showPasswordModal(report, openReport);
                }
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
