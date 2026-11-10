
const API_BASE = "https://api.pflegedienstgratia.com/api";
const USER_KEY = "gratia_admin_user";
const TOKEN_KEY = "gratia_admin_token";
const EMPLOYEE_USER_KEY = "gratiaEmployeeUser";
const EMPLOYEE_TOKEN_KEY = "gratiaEmployeeToken";

function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) ||
        sessionStorage.getItem(EMPLOYEE_TOKEN_KEY);
}

function getCurrentUser() {
    return JSON.parse(
        sessionStorage.getItem(USER_KEY) ||
        sessionStorage.getItem(EMPLOYEE_USER_KEY) ||
        "null"
    );
}

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${getToken()}`
        }
    });

    const contentType = response.headers.get("content-type") || "";
    let data;

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        throw new Error("Keine gültige JSON-Antwort vom Server.");
    }

    if (response.status === 401) {
        if (getToken() === sessionStorage.getItem(TOKEN_KEY)) {
            sessionStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(USER_KEY);
        } else {
            sessionStorage.removeItem(EMPLOYEE_TOKEN_KEY);
            sessionStorage.removeItem(EMPLOYEE_USER_KEY);
        }
        window.location.replace("login.html");
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

function formatDate(value) {
    if (!value) return "–";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "–";

    return date.toLocaleDateString("de-DE");
}

function hasPermission(user, key, section, action) {
    if (user?.role === "super_admin") return true;

    const permissions = user?.permissions || {};

    return (
        permissions[key] === true ||
        permissions[section]?.[action] === true
    );
}

function applicationStatusLabel(status) {
    return ({
        neu: "Neu",
        in_bearbeitung: "In Bearbeitung",
        abgeschlossen: "Abgeschlossen",
        abgelehnt: "Abgelehnt"
    })[status] || status || "Neu";
}

const applicationsMessage =
    document.getElementById("applications-message");

const applicationsTableBody =
    document.getElementById("applications-table-body");

const refreshApplicationsButton =
    document.getElementById("refresh-applications-button");

function createApplicationStatusCell(application, currentUser) {
    const cell = document.createElement("td");
    const canUpdate = hasPermission(
        currentUser,
        "applications.manage",
        "applications",
        "manage"
    );

    if (!canUpdate) {
        cell.textContent = applicationStatusLabel(application.status);
        return cell;
    }

    const controls = document.createElement("div");
    controls.className = "application-status-controls";
    const select = document.createElement("select");
    select.setAttribute("aria-label", `Status für Bewerbung ${application.id}`);
    const statuses = [
        ["neu", applicationStatusLabel("neu")],
        ["in_bearbeitung", applicationStatusLabel("in_bearbeitung")],
        ["abgeschlossen", applicationStatusLabel("abgeschlossen")],
        ["abgelehnt", applicationStatusLabel("abgelehnt")]
    ];

    if (application.status && !statuses.some(([value]) => value === application.status)) {
        statuses.unshift([application.status, application.status]);
    }
    statuses.forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        option.selected = value === (application.status || "neu");
        select.appendChild(option);
    });

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "details-button";
    saveButton.textContent = "Status speichern";
    saveButton.addEventListener("click", async () => {
        saveButton.disabled = true;
        try {
            const result = await apiRequest(
                `/applications/${encodeURIComponent(application.id)}/status`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: select.value })
                }
            );
            application.status = select.value;
            applicationsMessage.className = "message";
            applicationsMessage.textContent = result.message || "Bewerbungsstatus gespeichert.";
        } catch (error) {
            applicationsMessage.className = "message error";
            applicationsMessage.textContent = error.message;
        } finally {
            saveButton.disabled = false;
        }
    });

    controls.append(select, saveButton);
    cell.appendChild(controls);
    return cell;
}

async function loadApplications() {
    const currentUser = getCurrentUser();

    if (
        !currentUser ||
        !hasPermission(
            currentUser,
            "applications.read",
            "applications",
            "read"
        )
    ) {
        applicationsMessage.className = "message error";
        applicationsMessage.textContent =
            "Sie haben keine Berechtigung, Bewerbungen anzusehen.";
        applicationsTableBody.replaceChildren();
        return;
    }

    refreshApplicationsButton.disabled = true;
    applicationsMessage.className = "message";
    applicationsMessage.textContent = "Bewerbungen werden geladen …";
    applicationsTableBody.replaceChildren();

    try {
        const data = await apiRequest("/applications");

        if (
            data.status !== "OK" ||
            !Array.isArray(data.applications)
        ) {
            throw new Error(
                "Bewerbungen konnten nicht geladen werden."
            );
        }

        if (data.applications.length === 0) {
            applicationsMessage.textContent =
                "Es liegen noch keine Bewerbungen vor.";

            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 6;
            cell.textContent = "Keine Bewerbungen vorhanden.";
            row.appendChild(cell);
            applicationsTableBody.appendChild(row);
            return;
        }

        applicationsMessage.textContent =
            `${data.applications.length} Bewerbung(en) gefunden.`;

        const currentUser = getCurrentUser();

        data.applications.forEach(application => {
            const row = document.createElement("tr");

            const fullName = [
                application.first_name,
                application.last_name
            ].filter(Boolean).join(" ") || "–";

            row.append(
                createCell(fullName),
                createCell(application.position || "–"),
                createCell(application.email || "–"),
                createCell(formatDate(application.created_at)),
                createApplicationStatusCell(application, currentUser)
            );

            const actionsCell = document.createElement("td");
            actionsCell.className = "application-actions";

            if (application.cv_file_name && application.id) {
                const downloadButton =
                    document.createElement("button");

                downloadButton.type = "button";
                downloadButton.textContent =
                    "Lebenslauf herunterladen";
                downloadButton.className = "details-button";

                downloadButton.addEventListener("click", async () => {
                    downloadButton.disabled = true;
                    downloadButton.textContent = "Wird geladen ...";

                    try {
                        const response = await fetch(
                            `${API_BASE}/applications/${encodeURIComponent(application.id)}/cv`,
                            {
                                headers: {
                                    Authorization: `Bearer ${getToken()}`
                                }
                            }
                        );

                        if (!response.ok) {
                            throw new Error(
                                "Lebenslauf konnte nicht geladen werden."
                            );
                        }

                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");

                        link.href = url;
                        link.download =
                            application.cv_file_name || "Lebenslauf";

                        document.body.appendChild(link);
                        link.click();
                        link.remove();

                        setTimeout(
                            () => URL.revokeObjectURL(url),
                            1000
                        );
                    } catch (error) {
                        alert(error.message);
                    } finally {
                        downloadButton.disabled = false;
                        downloadButton.textContent =
                            "Lebenslauf herunterladen";
                    }
                });

                actionsCell.appendChild(downloadButton);
            } else {
                actionsCell.textContent =
                    "Kein Lebenslauf vorhanden";
            }

            row.appendChild(actionsCell);
            applicationsTableBody.appendChild(row);
        });
    } catch (error) {
        applicationsMessage.className = "message error";
        applicationsMessage.textContent = error.message;
    } finally {
        refreshApplicationsButton.disabled = false;
    }
}

refreshApplicationsButton.addEventListener(
    "click",
    loadApplications
);

loadApplications();
