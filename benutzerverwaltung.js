
const API_BASE = "http://localhost:3000/api";

const TOKEN_KEY = "gratia_admin_token";
const USER_KEY = "gratia_admin_user";

function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
}

async function apiRequest(path, options = {}) {
    const token = getToken();

    if (!token) {
        window.location.href = "admin.html";
        throw new Error("Bitte melden Sie sich zuerst an.");
    }

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`
        }
    });

    const contentType = response.headers.get("content-type") || "";
    let data;

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        throw new Error(
            `Keine JSON-Antwort vom Server (HTTP ${response.status}).`
        );
    }

    if (response.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        window.location.href = "admin.html";
        throw new Error("Sitzung abgelaufen. Bitte erneut anmelden.");
    }

    if (!response.ok) {
        throw new Error(data.message || "Die Anfrage ist fehlgeschlagen.");
    }

    return data;
}

function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value ?? "";
    return cell;
}

function canManageUsers(user) {
    const permissions = user?.permissions || {};

    return (
        user?.role === "super_admin" ||
        permissions.all === true ||
        permissions["users.manage"] === true ||
        permissions.users?.manage === true
    );
}

function showMessage(message, isError = false) {
    const element = document.getElementById("users-message");

    if (!element) return;

    element.textContent = message;
    element.classList.toggle("error", isError);
}

async function loadUsers() {
    const currentUser = JSON.parse(
        sessionStorage.getItem(USER_KEY) || "null"
    );

    if (!canManageUsers(currentUser)) {
        showMessage("Sie haben keine Berechtigung zur Benutzerverwaltung.", true);
        return;
    }

    showMessage("Benutzer werden geladen …");

    try {
        const data = await apiRequest("/users");
        const users = Array.isArray(data) ? data : data.users;

        if (!Array.isArray(users)) {
            throw new Error("Die Benutzerliste hat ein unerwartetes Format.");
        }

        renderUsers(users, currentUser);
    } catch (error) {
        showMessage(error.message, true);
    }
}

function renderUsers(users, currentUser) {
    const message = document.getElementById("users-message");
    const container = document.getElementById("users-table-container");

    if (!container) {
        showMessage("Der Tabellenbereich wurde nicht gefunden.", true);
        return;
    }

    container.replaceChildren();

    if (!users.length) {
        showMessage("Keine Benutzer gefunden.");
        return;
    }

    const table = document.createElement("table");
    table.id = "users-table";
    table.className = "data-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");

    [
        "ID",
        "Benutzer",
        "E-Mail",
        "Rolle",
        "Status",
        "Berechtigungen",
        "Aktionen"
    ].forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        headRow.appendChild(th);
    });

    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    users.forEach(user => {
        const row = document.createElement("tr");

        row.appendChild(createCell(user.id));
        row.appendChild(createCell(user.full_name || user.username));
        row.appendChild(createCell(user.email || "–"));
        row.appendChild(createCell(user.role));

        const statusCell = createCell(
            user.is_active ? "Aktiv" : "Deaktiviert"
        );
        row.appendChild(statusCell);

        const permissionCell = document.createElement("td");
        permissionCell.style.minWidth = "190px";

        function hasPermission(key, section, action) {
            const permissions = user.permissions || {};

            return (
                user.role === "super_admin" ||
                permissions.all === true ||
                permissions[key] === true ||
                permissions[section]?.[action] === true
            );
        }

        function createPermission(key, section, action, labelText) {
            const label = document.createElement("label");
            label.className = "permission-check";
            label.style.display = "block";
            label.style.marginBottom = "6px";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = hasPermission(key, section, action);
            checkbox.disabled = user.role === "super_admin";

            label.append(
                checkbox,
                document.createTextNode(" " + labelText)
            );

            permissionCell.appendChild(label);

            return checkbox;
        }

        const contactBox = createPermission(
            "contact_messages.read",
            "contact_messages",
            "read",
            "Kontaktanfragen"
        );

        const applicationBox = createPermission(
            "applications.read",
            "applications",
            "read",
            "Bewerbungen"
        );

        const jobsBox = createPermission(
            "jobs.manage",
            "jobs",
            "manage",
            "Stellenverwaltung"
        );

        const newsBox = createPermission(
            "news.manage",
            "news",
            "manage",
            "Newsverwaltung"
        );

        row.appendChild(permissionCell);

       
const actionCell = document.createElement("td");

if (user.role !== "super_admin") {
    // Button to activate or deactivate a user
    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "save-button";
    toggleButton.textContent = user.is_active
        ? "Deaktivieren"
        : "Aktivieren";

    toggleButton.style.display = "block";
    toggleButton.style.marginBottom = "8px";

    toggleButton.addEventListener("click", async () => {
        const nextStatus = !user.is_active;

        const confirmed = window.confirm(
            nextStatus
                ? "Diesen Benutzer aktivieren?"
                : "Diesen Benutzer deaktivieren?"
        );

        if (!confirmed) return;

        toggleButton.disabled = true;

        try {
            const result = await apiRequest(
                `/users/${encodeURIComponent(user.id)}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        is_active: nextStatus
                    })
                }
            );

            showMessage(result.message || "Status geändert.");
            await loadUsers();
        } catch (error) {
            showMessage(error.message, true);
            toggleButton.disabled = false;
        }
    });

    actionCell.appendChild(toggleButton);

    // Existing permissions button
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "save-button";
    saveButton.textContent = "Rechte speichern";

    saveButton.addEventListener("click", async () => {
        saveButton.disabled = true;

        try {
            const result = await apiRequest(
                `/users/${encodeURIComponent(user.id)}/permissions`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        permissions: {
                            "contact_messages.read": contactBox.checked,
                            "applications.read": applicationBox.checked,
                            "jobs.manage": jobsBox.checked,
                            "news.manage": newsBox.checked
                        }
                    })
                }
            );

            showMessage(
                result.message || "Berechtigungen gespeichert."
            );
        } catch (error) {
            showMessage(error.message, true);
        } finally {
            saveButton.disabled = false;
        }
    });

    actionCell.appendChild(saveButton);
} else {
    actionCell.textContent = "Vollzugriff";
}


        row.appendChild(actionCell);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);

    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper users-table-wrapper";
    wrapper.style.overflowX = "auto";
    wrapper.appendChild(table);

    container.appendChild(wrapper);

    if (message) {
        message.textContent = `${users.length} Benutzer geladen.`;
        message.classList.remove("error");
    }
}


document.addEventListener("DOMContentLoaded", () => {
    const refreshButton = document.getElementById("refresh-users-button");

    if (refreshButton) {
        refreshButton.addEventListener("click", loadUsers);
    }

    const form = document.getElementById("create-user-form");

    if (form) {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const button = document.getElementById("create-user-button");
            const message = document.getElementById("create-user-message");

            const currentUser = JSON.parse(
                sessionStorage.getItem(USER_KEY) || "null"
            );

            if (!canManageUsers(currentUser)) {
                message.textContent = "Keine Berechtigung.";
                return;
            }

            const formData = new FormData(form);

            const payload = {
                full_name: formData.get("full_name"),
                username: formData.get("username"),
                email: formData.get("email"),
                role: formData.get("role")
            };

            try {
                button.disabled = true;
                message.textContent = "Benutzer wird vorbereitet …";

                await apiRequest("/users", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                message.textContent = "Benutzer wurde erstellt.";
                form.reset();
                await loadUsers();
            } catch (error) {
                message.textContent = error.message;
            } finally {
                button.disabled = false;
            }
        });
    }

    loadUsers();
});
