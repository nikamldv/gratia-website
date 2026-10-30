
const API_BASE = "https://api.pflegedienstgratia.com/api";
const USER_KEY = "gratia_admin_user";
const TOKEN_KEY = "gratia_admin_token";

function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
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
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        window.location.replace("admin.html");
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

const applicationsMessage =
    document.getElementById("applications-message");

const applicationsTableBody =
    document.getElementById("applications-table-body");

const refreshApplicationsButton =
    document.getElementById("refresh-applications-button");

async function loadApplications() {
    const currentUser = JSON.parse(
        sessionStorage.getItem(USER_KEY) || "null"
    );

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
                createCell(application.status || "Neu")
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
