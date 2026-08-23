// This SPA is served (as static files) from the same Express app it talks to,
// so API calls are same-origin and the express-session cookie just works.
var API_BASE = '/v1/api';

var state = {
    username: null,
    page: 1,
    size: 10,
    editingUsername: null, // null while creating; set while editing
};

var els = {
    loginView: document.getElementById('login-view'),
    dashboardView: document.getElementById('dashboard-view'),
    loginForm: document.getElementById('login-form'),
    loginUsername: document.getElementById('login-username'),
    loginPassword: document.getElementById('login-password'),
    loginError: document.getElementById('login-error'),
    loginSubmit: document.getElementById('login-submit'),
    whoami: document.getElementById('whoami'),
    filterStatus: document.getElementById('filter-status'),
    filterGroup: document.getElementById('filter-group'),
    filterSize: document.getElementById('filter-size'),
    prevPage: document.getElementById('prev-page'),
    nextPage: document.getElementById('next-page'),
    pageIndicator: document.getElementById('page-indicator'),
    newUserBtn: document.getElementById('new-user-btn'),
    tableWrap: document.getElementById('user-table-wrap'),
    modalOverlay: document.getElementById('user-modal-overlay'),
    modalTitle: document.getElementById('user-modal-title'),
    userForm: document.getElementById('user-form'),
    userFormError: document.getElementById('user-form-error'),
    passwordHint: document.getElementById('password-hint'),
    modalCancel: document.getElementById('user-modal-cancel'),
    formUsername: document.getElementById('form-username'),
    formFirstName: document.getElementById('form-firstName'),
    formLastName: document.getElementById('form-lastName'),
    formJobTitle: document.getElementById('form-jobTitle'),
    formCity: document.getElementById('form-city'),
    formState: document.getElementById('form-state'),
    formPassword: document.getElementById('form-password'),
    formActive: document.getElementById('form-active'),
    toastContainer: document.getElementById('toast-container'),
};

function showToast(message, type) {
    var toast = document.createElement('div');
    toast.className = 'toast' + (type ? ' ' + type : '');
    toast.textContent = message;
    els.toastContainer.appendChild(toast);
    setTimeout(function () {
        toast.remove();
    }, 4000);
}

// Thin wrapper: same-origin fetch + JSON handling + shared 401 handling.
function apiFetch(path, options) {
    options = options || {};
    options.credentials = 'same-origin';
    if (options.body) {
        options.headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers);
    }
    return fetch(API_BASE + path, options).then(function (res) {
        if (res.status === 401) {
            showLogin('Session expired. Please log in again.');
            throw new Error('Not authenticated');
        }
        return res
            .json()
            .catch(function () {
                return {};
            })
            .then(function (data) {
                if (!res.ok) {
                    throw new Error(data.message || 'Request failed (' + res.status + ')');
                }
                return data;
            });
    });
}

function showLogin(errorMessage) {
    els.dashboardView.classList.add('hidden');
    els.loginView.classList.remove('hidden');
    els.loginError.textContent = errorMessage || '';
    state.username = null;
}

function showDashboard(username) {
    state.username = username;
    els.loginView.classList.add('hidden');
    els.dashboardView.classList.remove('hidden');
    els.whoami.textContent = 'Signed in as ' + username;
    state.page = 1;
    loadUsers();
}

// On load, probe auth by trying a real endpoint — there's no dedicated
// "who am I" route, and the session cookie (if any) is httpOnly.
function checkExistingSession() {
    apiFetch('/users?page=1&size=1')
        .then(function () {
            showDashboard(els.loginUsername.value || 'existing session');
        })
        .catch(function () {
            showLogin();
        });
}

els.loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var username = els.loginUsername.value.trim();
    var password = els.loginPassword.value;
    els.loginError.textContent = '';
    els.loginSubmit.disabled = true;

    apiFetch('/auth', {
        method: 'POST',
        body: JSON.stringify({ username: username, password: password }),
    })
        .then(function () {
            els.loginPassword.value = '';
            showDashboard(username);
        })
        .catch(function (err) {
            els.loginError.textContent = err.message || 'Login failed';
        })
        .finally(function () {
            els.loginSubmit.disabled = false;
        });
});

function buildQuery() {
    var params = new URLSearchParams();
    if (els.filterStatus.value) {
        params.set('status', els.filterStatus.value);
    }
    if (els.filterGroup.value) {
        params.set('group', els.filterGroup.value);
    }
    params.set('page', String(state.page));
    params.set('size', els.filterSize.value);
    return params.toString();
}

function loadUsers() {
    els.tableWrap.innerHTML = '<div class="empty-state">Loading users&hellip;</div>';
    apiFetch('/users?' + buildQuery())
        .then(renderUsers)
        .catch(function (err) {
            els.tableWrap.innerHTML =
                '<div class="empty-state">' + escapeHtml(err.message) + '</div>';
        });
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = String(str == null ? '' : str);
    return div.innerHTML;
}

function userRowHtml(user) {
    return (
        '<tr>' +
        '<td>' +
        escapeHtml(user.username) +
        '</td>' +
        '<td>' +
        escapeHtml(user.firstName) +
        ' ' +
        escapeHtml(user.lastName) +
        '</td>' +
        '<td>' +
        escapeHtml(user.jobTitle) +
        '</td>' +
        '<td>' +
        escapeHtml(user.city) +
        ', ' +
        escapeHtml(user.state) +
        '</td>' +
        '<td><span class="badge ' +
        (user.active ? 'active' : 'inactive') +
        '">' +
        (user.active ? 'Active' : 'Inactive') +
        '</span></td>' +
        '<td>' +
        '<div class="row-actions">' +
        '<button type="button" class="secondary" data-edit="' +
        escapeHtml(user.username) +
        '">Edit</button>' +
        '<button type="button" class="danger" data-delete="' +
        escapeHtml(user.username) +
        '">Delete</button>' +
        '</div>' +
        '</td>' +
        '</tr>'
    );
}

function tableHeadHtml() {
    return (
        '<thead><tr>' +
        '<th>Username</th><th>Name</th><th>Job title</th><th>Location</th>' +
        '<th>Status</th><th></th>' +
        '</tr></thead>'
    );
}

function renderUsers(data) {
    els.pageIndicator.textContent = 'Page ' + state.page;

    if (Array.isArray(data)) {
        if (data.length === 0) {
            els.tableWrap.innerHTML = '<div class="empty-state">No users found.</div>';
            return;
        }
        var rows = data.map(userRowHtml).join('');
        els.tableWrap.innerHTML =
            '<table>' + tableHeadHtml() + '<tbody>' + rows + '</tbody></table>';
        attachRowHandlers();
        return;
    }

    // Non-array shapes: either a status-filter "no users" message,
    // or a { groupKey: [users...] } object from ?group=.
    if (data && typeof data.message === 'string' && Object.keys(data).length === 1) {
        els.tableWrap.innerHTML = '<div class="empty-state">' + escapeHtml(data.message) + '</div>';
        return;
    }

    var groupKeys = Object.keys(data || {});
    if (groupKeys.length === 0) {
        els.tableWrap.innerHTML = '<div class="empty-state">No users found.</div>';
        return;
    }

    var html = '<table>' + tableHeadHtml() + '<tbody>';
    groupKeys.forEach(function (key) {
        html +=
            '<tr><td colspan="6" class="group-header">' +
            escapeHtml(key || '(none)') +
            '</td></tr>';
        html += data[key].map(userRowHtml).join('');
    });
    html += '</tbody></table>';
    els.tableWrap.innerHTML = html;
    attachRowHandlers();
}

function attachRowHandlers() {
    els.tableWrap.querySelectorAll('[data-edit]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            openEditModal(btn.getAttribute('data-edit'));
        });
    });
    els.tableWrap.querySelectorAll('[data-delete]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            confirmDelete(btn.getAttribute('data-delete'));
        });
    });
}

els.filterStatus.addEventListener('change', function () {
    state.page = 1;
    loadUsers();
});
els.filterGroup.addEventListener('change', function () {
    state.page = 1;
    loadUsers();
});
els.filterSize.addEventListener('change', function () {
    state.page = 1;
    loadUsers();
});
els.prevPage.addEventListener('click', function () {
    if (state.page > 1) {
        state.page -= 1;
        loadUsers();
    }
});
els.nextPage.addEventListener('click', function () {
    state.page += 1;
    loadUsers();
});

// ---------- Create / edit modal ----------

function openCreateModal() {
    state.editingUsername = null;
    els.modalTitle.textContent = 'New user';
    els.userForm.reset();
    els.formUsername.disabled = false;
    els.formActive.checked = true;
    els.formPassword.required = true;
    els.passwordHint.textContent = 'Required when creating a user.';
    els.userFormError.textContent = '';
    els.modalOverlay.classList.remove('hidden');
    els.formUsername.focus();
}

function openEditModal(username) {
    apiFetch('/users?page=1&size=1000')
        .then(function (data) {
            var list = Array.isArray(data) ? data : [];
            var user = list.find(function (u) {
                return u.username === username;
            });
            if (!user) {
                showToast('Could not load user "' + username + '"', 'error');
                return;
            }
            state.editingUsername = username;
            els.modalTitle.textContent = 'Edit ' + username;
            els.formUsername.value = user.username;
            els.formUsername.disabled = true; // username is the immutable lookup key
            els.formFirstName.value = user.firstName || '';
            els.formLastName.value = user.lastName || '';
            els.formJobTitle.value = user.jobTitle || '';
            els.formCity.value = user.city || '';
            els.formState.value = user.state || '';
            els.formPassword.value = '';
            els.formPassword.required = false;
            els.passwordHint.textContent = 'Leave blank to keep the current password.';
            els.formActive.checked = !!user.active;
            els.userFormError.textContent = '';
            els.modalOverlay.classList.remove('hidden');
            els.formFirstName.focus();
        })
        .catch(function (err) {
            showToast(err.message, 'error');
        });
}

function closeModal() {
    els.modalOverlay.classList.add('hidden');
}

els.newUserBtn.addEventListener('click', openCreateModal);
els.modalCancel.addEventListener('click', closeModal);
els.modalOverlay.addEventListener('click', function (e) {
    if (e.target === els.modalOverlay) {
        closeModal();
    }
});

els.userForm.addEventListener('submit', function (e) {
    e.preventDefault();
    els.userFormError.textContent = '';

    var isEdit = !!state.editingUsername;
    var payload = {
        firstName: els.formFirstName.value.trim(),
        lastName: els.formLastName.value.trim(),
        jobTitle: els.formJobTitle.value.trim(),
        city: els.formCity.value.trim(),
        state: els.formState.value.trim(),
        active: els.formActive.checked,
    };

    // Only include password when set — the API treats an explicit
    // (even empty) password field on PUT as "set the password".
    if (els.formPassword.value) {
        payload.password = els.formPassword.value;
    }

    var request;
    if (isEdit) {
        request = apiFetch('/user/' + encodeURIComponent(state.editingUsername), {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    } else {
        payload.username = els.formUsername.value.trim();
        if (!els.formPassword.value) {
            els.userFormError.textContent = 'Password is required.';
            return;
        }
        request = apiFetch('/user', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    request
        .then(function (res) {
            closeModal();
            showToast(res.message || 'Saved', 'success');
            loadUsers();
        })
        .catch(function (err) {
            els.userFormError.textContent = err.message || 'Save failed';
        });
});

function confirmDelete(username) {
    if (!window.confirm('Delete user "' + username + '"? This cannot be undone.')) {
        return;
    }
    apiFetch('/user/delete/' + encodeURIComponent(username), { method: 'DELETE' })
        .then(function (res) {
            showToast(res.message || 'Deleted', 'success');
            loadUsers();
        })
        .catch(function (err) {
            showToast(err.message, 'error');
        });
}

checkExistingSession();
