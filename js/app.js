/**
 * Fabric Asset Manager - Frontend Application
 */

const API_BASE = '/api';

// ===================================
// State Management
// ===================================
let assets = [];
let editingAssetId = null;
let deletingAssetId = null;

// ===================================
// DOM Elements
// ===================================
const elements = {
    // Grid
    assetsGrid: document.getElementById('assets-grid'),
    assetCount: document.getElementById('asset-count'),
    searchInput: document.getElementById('search-input'),

    // Buttons
    btnCreate: document.getElementById('btn-create'),
    btnInit: document.getElementById('btn-init'),
    btnRefresh: document.getElementById('btn-refresh'),

    // Connection
    statusIndicator: document.getElementById('status-indicator'),
    connectionText: document.getElementById('connection-text'),

    // Asset Modal
    assetModal: document.getElementById('asset-modal'),
    assetForm: document.getElementById('asset-form'),
    modalTitle: document.getElementById('modal-title'),
    modalClose: document.getElementById('modal-close'),
    btnCancel: document.getElementById('btn-cancel'),
    btnSubmit: document.getElementById('btn-submit'),
    assetId: document.getElementById('asset-id'),
    assetColor: document.getElementById('asset-color'),
    assetOwner: document.getElementById('asset-owner'),
    colorPreview: document.getElementById('color-preview'),

    // Transfer Modal
    transferModal: document.getElementById('transfer-modal'),
    transferForm: document.getElementById('transfer-form'),
    transferAssetId: document.getElementById('transfer-asset-id'),
    transferOwner: document.getElementById('transfer-owner'),
    transferClose: document.getElementById('transfer-close'),
    transferCancel: document.getElementById('transfer-cancel'),

    // History Modal
    historyModal: document.getElementById('history-modal'),
    historyContent: document.getElementById('history-content'),
    historyClose: document.getElementById('history-close'),

    // Delete Modal
    deleteModal: document.getElementById('delete-modal'),
    deleteAssetId: document.getElementById('delete-asset-id'),
    deleteClose: document.getElementById('delete-close'),
    deleteCancel: document.getElementById('delete-cancel'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),

    // Toast
    toastContainer: document.getElementById('toast-container')
};

// ===================================
// Toast Notifications
// ===================================
function showToast(message, type = 'info') {
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
    `;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ===================================
// Color Utilities
// ===================================
const colorMap = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#10b981',
    yellow: '#f59e0b',
    purple: '#8b5cf6',
    pink: '#ec4899',
    orange: '#f97316',
    cyan: '#06b6d4',
    indigo: '#6366f1',
    teal: '#14b8a6',
    gray: '#6b7280',
    white: '#ffffff',
    black: '#1f2937'
};

function getColorValue(colorName) {
    const name = colorName.toLowerCase();
    return colorMap[name] || colorName;
}

// ===================================
// API Functions
// ===================================
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function checkConnection() {
    try {
        const data = await apiRequest('/status');
        updateConnectionStatus(data.connected);
        return data.connected;
    } catch (error) {
        updateConnectionStatus(false);
        return false;
    }
}

function updateConnectionStatus(connected) {
    elements.statusIndicator.className = `status-indicator ${connected ? 'connected' : 'disconnected'}`;
    elements.connectionText.textContent = connected ? 'Connected' : 'Disconnected';
}

async function loadAssets() {
    try {
        elements.assetsGrid.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading assets...</p>
            </div>
        `;

        const data = await apiRequest('/assets');
        assets = data.data || [];
        renderAssets(assets);
    } catch (error) {
        elements.assetsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p>${error.message}</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">Make sure Fabric network is connected.</p>
            </div>
        `;
        showToast(error.message, 'error');
    }
}

async function initLedger() {
    try {
        await apiRequest('/assets/init', { method: 'POST' });
        showToast('Ledger initialized with sample assets!', 'success');
        await loadAssets();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function createAsset(id, color, owner) {
    const data = await apiRequest('/assets', {
        method: 'POST',
        body: JSON.stringify({ id, color, owner })
    });
    return data;
}

async function updateAsset(id, color, owner) {
    const data = await apiRequest(`/assets/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ color, owner })
    });
    return data;
}

async function deleteAsset(id) {
    const data = await apiRequest(`/assets/${id}`, {
        method: 'DELETE'
    });
    return data;
}

async function transferAsset(id, newOwner) {
    const data = await apiRequest(`/assets/${id}/transfer`, {
        method: 'POST',
        body: JSON.stringify({ newOwner })
    });
    return data;
}

async function getAssetHistory(id) {
    const data = await apiRequest(`/assets/${id}/history`);
    return data;
}

// ===================================
// Rendering
// ===================================
function renderAssets(assetList) {
    if (!assetList || assetList.length === 0) {
        elements.assetsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <p>No assets found</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">Create your first asset or initialize the ledger.</p>
            </div>
        `;
        elements.assetCount.textContent = '0 assets';
        return;
    }

    elements.assetCount.textContent = `${assetList.length} asset${assetList.length !== 1 ? 's' : ''}`;

    elements.assetsGrid.innerHTML = assetList.map(asset => {
        const colorValue = getColorValue(asset.Color);
        return `
            <div class="asset-card" style="--asset-color: ${colorValue}">
                <div class="asset-card-header">
                    <span class="asset-id">${escapeHtml(asset.ID)}</span>
                    <span class="asset-color-badge">
                        <span class="color-dot" style="background: ${colorValue}"></span>
                        ${escapeHtml(asset.Color)}
                    </span>
                </div>
                <div class="asset-details">
                    <div class="asset-detail">
                        <span class="asset-detail-label">Owner</span>
                        <span class="asset-detail-value">${escapeHtml(asset.Owner)}</span>
                    </div>
                    <div class="asset-detail">
                        <span class="asset-detail-label">Created</span>
                        <span class="asset-detail-value">${formatDate(asset.CreatedAt)}</span>
                    </div>
                    <div class="asset-detail">
                        <span class="asset-detail-label">Updated</span>
                        <span class="asset-detail-value">${formatDate(asset.UpdatedAt)}</span>
                    </div>
                </div>
                <div class="asset-actions">
                    <button class="btn btn-sm btn-ghost" onclick="openEditModal('${escapeHtml(asset.ID)}')">Edit</button>
                    <button class="btn btn-sm btn-ghost" onclick="openTransferModal('${escapeHtml(asset.ID)}')">Transfer</button>
                    <button class="btn btn-sm btn-ghost" onclick="openHistoryModal('${escapeHtml(asset.ID)}')">History</button>
                    <button class="btn btn-sm btn-danger" onclick="openDeleteModal('${escapeHtml(asset.ID)}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================================
// Modal Handlers
// ===================================
function openModal(modal) {
    modal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

function openCreateModal() {
    editingAssetId = null;
    elements.modalTitle.textContent = 'Create New Asset';
    elements.btnSubmit.textContent = 'Create Asset';
    elements.assetId.value = '';
    elements.assetId.readOnly = false;
    elements.assetColor.value = '';
    elements.assetOwner.value = '';
    elements.colorPreview.style.background = 'var(--text-muted)';
    openModal(elements.assetModal);
}

function openEditModal(id) {
    const asset = assets.find(a => a.ID === id);
    if (!asset) return;

    editingAssetId = id;
    elements.modalTitle.textContent = 'Edit Asset';
    elements.btnSubmit.textContent = 'Update Asset';
    elements.assetId.value = asset.ID;
    elements.assetId.readOnly = true;
    elements.assetColor.value = asset.Color;
    elements.assetOwner.value = asset.Owner;
    elements.colorPreview.style.background = getColorValue(asset.Color);
    openModal(elements.assetModal);
}

function openTransferModal(id) {
    elements.transferAssetId.value = id;
    elements.transferOwner.value = '';
    openModal(elements.transferModal);
}

async function openHistoryModal(id) {
    elements.historyContent.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading history...</p>
        </div>
    `;
    openModal(elements.historyModal);

    try {
        const data = await getAssetHistory(id);
        const history = data.data || [];

        if (history.length === 0) {
            elements.historyContent.innerHTML = '<p>No history available.</p>';
            return;
        }

        elements.historyContent.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-item-header">
                    <span class="history-txid">${item.txId ? item.txId.substring(0, 20) + '...' : 'N/A'}</span>
                    ${item.isDelete ? '<span class="history-badge delete">Deleted</span>' : '<span class="history-badge update">Updated</span>'}
                </div>
                <div class="history-timestamp">${item.timestamp ? formatDate(item.timestamp.seconds * 1000) : 'N/A'}</div>
                ${!item.isDelete && item.value ? `<div class="history-value">${JSON.stringify(item.value, null, 2)}</div>` : ''}
            </div>
        `).join('');
    } catch (error) {
        elements.historyContent.innerHTML = `<p style="color: var(--danger)">${error.message}</p>`;
        showToast(error.message, 'error');
    }
}

function openDeleteModal(id) {
    deletingAssetId = id;
    elements.deleteAssetId.textContent = id;
    openModal(elements.deleteModal);
}

// ===================================
// Form Handlers
// ===================================
async function handleAssetSubmit(e) {
    e.preventDefault();

    const id = elements.assetId.value.trim();
    const color = elements.assetColor.value.trim();
    const owner = elements.assetOwner.value.trim();

    if (!id || !color || !owner) {
        showToast('Please fill in all fields', 'warning');
        return;
    }

    try {
        if (editingAssetId) {
            await updateAsset(id, color, owner);
            showToast(`Asset ${id} updated successfully!`, 'success');
        } else {
            await createAsset(id, color, owner);
            showToast(`Asset ${id} created successfully!`, 'success');
        }

        closeModal(elements.assetModal);
        await loadAssets();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleTransferSubmit(e) {
    e.preventDefault();

    const id = elements.transferAssetId.value;
    const newOwner = elements.transferOwner.value.trim();

    if (!newOwner) {
        showToast('Please enter the new owner name', 'warning');
        return;
    }

    try {
        await transferAsset(id, newOwner);
        showToast(`Asset ${id} transferred to ${newOwner}!`, 'success');
        closeModal(elements.transferModal);
        await loadAssets();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleDeleteConfirm() {
    if (!deletingAssetId) return;

    try {
        await deleteAsset(deletingAssetId);
        showToast(`Asset ${deletingAssetId} deleted!`, 'success');
        closeModal(elements.deleteModal);
        deletingAssetId = null;
        await loadAssets();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ===================================
// Search
// ===================================
function handleSearch() {
    const query = elements.searchInput.value.toLowerCase().trim();

    if (!query) {
        renderAssets(assets);
        return;
    }

    const filtered = assets.filter(asset =>
        asset.ID.toLowerCase().includes(query) ||
        asset.Owner.toLowerCase().includes(query) ||
        asset.Color.toLowerCase().includes(query)
    );

    renderAssets(filtered);
}

// ===================================
// Event Listeners
// ===================================
function setupEventListeners() {
    // Buttons
    elements.btnCreate.addEventListener('click', openCreateModal);
    elements.btnInit.addEventListener('click', initLedger);
    elements.btnRefresh.addEventListener('click', loadAssets);

    // Asset Modal
    elements.modalClose.addEventListener('click', () => closeModal(elements.assetModal));
    elements.btnCancel.addEventListener('click', () => closeModal(elements.assetModal));
    elements.assetForm.addEventListener('submit', handleAssetSubmit);

    // Color preview update
    elements.assetColor.addEventListener('input', (e) => {
        elements.colorPreview.style.background = getColorValue(e.target.value);
    });

    // Transfer Modal
    elements.transferClose.addEventListener('click', () => closeModal(elements.transferModal));
    elements.transferCancel.addEventListener('click', () => closeModal(elements.transferModal));
    elements.transferForm.addEventListener('submit', handleTransferSubmit);

    // History Modal
    elements.historyClose.addEventListener('click', () => closeModal(elements.historyModal));

    // Delete Modal
    elements.deleteClose.addEventListener('click', () => closeModal(elements.deleteModal));
    elements.deleteCancel.addEventListener('click', () => closeModal(elements.deleteModal));
    elements.btnConfirmDelete.addEventListener('click', handleDeleteConfirm);

    // Search
    elements.searchInput.addEventListener('input', handleSearch);

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
            }
        });
    });

    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                closeModal(modal);
            });
        }
    });
}

// ===================================
// Initialization
// ===================================
async function init() {
    setupEventListeners();
    await checkConnection();
    await loadAssets();

    // Periodically check connection status
    setInterval(checkConnection, 30000);
}

// Start the app
init();
