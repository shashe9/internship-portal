document.addEventListener('DOMContentLoaded', async () => {
    const table = document.getElementById('applicationsTable');
    const tableBody = document.getElementById('tableBody');
    const loading = document.getElementById('loading');
    const messageBox = document.getElementById('messageBox');
    
    // Controls
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const sortSelect = document.getElementById('sortSelect');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Modal
    const detailsModal = document.getElementById('detailsModal');
    const closeModal = document.getElementById('closeModal');
    const modalBody = document.getElementById('modalBody');

    let allApplications = [];

    // show message helper
    function showMessage(msg, isSuccess) {
        messageBox.innerHTML = isSuccess ? `<i class="fas fa-check-circle"></i> ${msg}` : `<i class="fas fa-exclamation-circle"></i> ${msg}`;
        messageBox.className = 'message ' + (isSuccess ? 'success' : 'error');
        messageBox.style.display = 'block';
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 4000);
    }

    // check authentication first
    try {
        const authRes = await fetch('/api/check-auth');
        const authData = await authRes.json();
        
        if (!authData.loggedIn) {
            window.location.href = 'admin-login.html';
            return;
        }
    } catch (e) {
        window.location.href = 'admin-login.html';
        return;
    }

    // fetch data
    async function fetchApplications() {
        try {
            const response = await fetch('/api/applications');
            const result = await response.json();
            
            if (response.status === 401) {
                window.location.href = 'admin-login.html';
                return;
            }

            if (result.success) {
                allApplications = result.data;
                updateStats();
                renderTable();
            } else {
                showMessage("Failed to load applications", false);
            }
        } catch (error) {
            console.error("Error fetching applications:", error);
            showMessage("Server error while loading data", false);
        } finally {
            loading.classList.add('hidden');
            table.classList.remove('hidden');
        }
    }

    // update stats
    function updateStats() {
        const total = allApplications.length;
        const pending = allApplications.filter(a => a.status === 'Pending').length;
        const selected = allApplications.filter(a => a.status === 'Selected').length;
        const rejected = allApplications.filter(a => a.status === 'Rejected').length;

        document.getElementById('statTotal').textContent = total;
        document.getElementById('statPending').textContent = pending;
        document.getElementById('statSelected').textContent = selected;
        document.getElementById('statRejected').textContent = rejected;
    }

    // render table with filtering, searching, and sorting
    function renderTable() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterStatus = statusFilter.value;
        const sortValue = sortSelect.value;
        
        tableBody.innerHTML = ''; // clear current rows
        
        // Filter
        let filteredApps = allApplications.filter(app => {
            const matchesSearch = app.name.toLowerCase().includes(searchTerm) || 
                                  app.email.toLowerCase().includes(searchTerm);
            const matchesStatus = filterStatus === 'All' || app.status === filterStatus;
            
            return matchesSearch && matchesStatus;
        });

        // Sort
        filteredApps.sort((a, b) => {
            if (sortValue === 'dateDesc') return new Date(b.dateApplied) - new Date(a.dateApplied);
            if (sortValue === 'dateAsc') return new Date(a.dateApplied) - new Date(b.dateApplied);
            if (sortValue === 'nameAsc') return a.name.localeCompare(b.name);
            if (sortValue === 'nameDesc') return b.name.localeCompare(a.name);
            if (sortValue === 'status') return a.status.localeCompare(b.status);
            return 0;
        });
        
        if (filteredApps.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="6" style="text-align: center; padding: 2rem;">No applications found</td>`;
            tableBody.appendChild(tr);
            return;
        }

        filteredApps.forEach(app => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', app.id);
            
            // map status to lower case class name
            const statusClass = 'status-' + app.status.toLowerCase();
            
            tr.innerHTML = `
                <td><strong>${app.name}</strong></td>
                <td>${app.email}</td>
                <td>${app.college || '-'}</td>
                <td><span class="status-badge ${statusClass}">${app.status}</span></td>
                <td>
                    <!-- open modal when details button is clicked -->
                    <!-- prevent row click when button is used -->
                    <button class="btn btn-small btn-outline details-btn" data-id="${app.id}" onclick="event.stopPropagation()">
                        <i class="fas fa-eye"></i> Details
                    </button>
                    <!-- open resume in new tab -->
                    <!-- prevent row click when button is used -->
                    <a href="/api/resume/${app.resumeFile}" target="_blank" class="btn btn-small" onclick="event.stopPropagation()">
                        <i class="fas fa-file-alt"></i> Resume
                    </a>
                </td>
                <td class="action-cell">
                    <select class="action-select" data-id="${app.id}" onclick="event.stopPropagation()">
                        <option value="Pending" ${app.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Selected" ${app.status === 'Selected' ? 'selected' : ''}>Selected</option>
                        <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                    </select>
                    <button class="btn btn-small btn-success update-btn" data-id="${app.id}" onclick="event.stopPropagation()">Update</button>
                    <button class="btn btn-small btn-danger delete-btn" data-id="${app.id}" onclick="event.stopPropagation()"><i class="fas fa-trash"></i></button>
                </td>
            `;
            
            // click row to view details
            tr.addEventListener('click', () => showDetailsModal(app));
            
            tableBody.appendChild(tr);
        });

        // attach event listeners to details buttons
        document.querySelectorAll('.details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const app = allApplications.find(a => a.id === id);
                if (app) showDetailsModal(app);
            });
        });

        // attach event listeners to update buttons
        document.querySelectorAll('.update-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                const selectEl = e.target.previousElementSibling;
                const newStatus = selectEl.value;
                await updateStatus(id, newStatus);
            });
        });

        // attach event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                // handle target safely (icon click vs button click)
                const id = e.currentTarget.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this application?')) {
                    await deleteApplication(id);
                }
            });
        });
    }

    // show details modal
    function showDetailsModal(app) {
        const date = new Date(app.dateApplied).toLocaleString();
        
        modalBody.innerHTML = `
            <div class="detail-grid">
                <div class="detail-label">Name:</div>
                <div class="detail-value">${app.name}</div>

                <div class="detail-label">Email:</div>
                <div class="detail-value"><a href="mailto:${app.email}" style="color: #3498db;">${app.email}</a></div>

                <div class="detail-label">Phone:</div>
                <div class="detail-value">${app.phone || 'N/A'}</div>

                <div class="detail-label">College:</div>
                <div class="detail-value">${app.college || 'N/A'}</div>

                <div class="detail-label">Year of Study:</div>
                <div class="detail-value">${app.year || 'N/A'}</div>

                <div class="detail-label">Skills:</div>
                <div class="detail-value">${app.skills}</div>

                <div class="detail-label">LinkedIn:</div>
                <div class="detail-value">${app.linkedin ? `<a href="${app.linkedin}" target="_blank" style="color: #3498db;">${app.linkedin}</a>` : 'N/A'}</div>

                <div class="detail-label">Portfolio/GitHub:</div>
                <div class="detail-value">${app.portfolio ? `<a href="${app.portfolio}" target="_blank" style="color: #3498db;">${app.portfolio}</a>` : 'N/A'}</div>

                <div class="detail-label">Applied On:</div>
                <div class="detail-value">${date}</div>

                <div class="detail-label">Current Status:</div>
                <div class="detail-value"><span class="status-badge status-${app.status.toLowerCase()}">${app.status}</span></div>
            </div>
            
            <div style="text-align: center; margin-top: 1.5rem;">
                <a href="/api/resume/${app.resumeFile}" target="_blank" class="btn" style="width: auto; padding: 0.8rem 2rem;">
                    <i class="fas fa-file-pdf"></i> View Resume
                </a>
            </div>
        `;
        
        detailsModal.classList.add('active');
    }

    // close modal
    closeModal.addEventListener('click', () => {
        detailsModal.classList.remove('active');
    });

    // close modal on outside click
    detailsModal.addEventListener('click', (e) => {
        if (e.target === detailsModal) {
            detailsModal.classList.remove('active');
        }
    });

    // update status function
    async function updateStatus(id, newStatus) {
        try {
            const response = await fetch(`/api/applications/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            const result = await response.json();
            
            if (response.status === 401) {
                window.location.href = 'admin-login.html';
                return;
            }

            if (result.success) {
                showMessage("Status updated successfully", true);
                // update local data and re-render
                const appIndex = allApplications.findIndex(a => a.id === id);
                if (appIndex !== -1) {
                    allApplications[appIndex].status = newStatus;
                }
                updateStats();
                renderTable();
            } else {
                showMessage(result.message || "Failed to update status", false);
            }
        } catch (error) {
            console.error("Error updating status:", error);
            showMessage("Server error", false);
        }
    }

    // delete application function
    async function deleteApplication(id) {
        try {
            const response = await fetch(`/api/applications/${id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (response.status === 401) {
                window.location.href = 'admin-login.html';
                return;
            }

            if (result.success) {
                showMessage("Application deleted", true);
                // remove from local data
                allApplications = allApplications.filter(a => a.id !== id);
                updateStats();
                renderTable();
            } else {
                showMessage(result.message || "Failed to delete application", false);
            }
        } catch (error) {
            console.error("Error deleting application:", error);
            showMessage("Server error", false);
        }
    }

    // logout function
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = 'admin-login.html';
        } catch (error) {
            console.error("Error during logout", error);
        }
    });

    // attach event listeners for controls
    searchInput.addEventListener('input', renderTable);
    statusFilter.addEventListener('change', renderTable);
    sortSelect.addEventListener('change', renderTable);

    // initial fetch
    fetchApplications();
});
