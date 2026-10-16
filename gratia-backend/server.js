const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const multer = require("multer");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;


// بدون JWT_SECRET سرور نباید اجرا شود.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error(
        "Fehler: JWT_SECRET fehlt oder ist zu kurz. Bitte .env prüfen."
    );
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_APP_PASSWORD
    }
});


async function sendInvitationEmail(email, fullName, token) {
    const path = require("path");

    const logoPath =path.join(__dirname, "..", "images", "gratia-logo.png");

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
        throw new Error("FRONTEND_URL fehlt in der .env-Datei.");
    }

    const setupUrl =
        `${frontendUrl.replace(/\/$/, "")}/setup-password.html?token=${encodeURIComponent(token)}`;

    const safeName = String(fullName || "Mitarbeiter")
        .replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);

    return transporter.sendMail({
        from: `"GRATIA Pflegedienst" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Einladung zum GRATIA Mitarbeiterportal",

        text: `Hallo ${fullName},

Sie wurden zum Mitarbeiterportal der GRATIA Pflegedienst GmbH eingeladen.

Bitte richten Sie Ihr Passwort über diesen Link ein:
${setupUrl}

Der Link ist 24 Stunden gültig.

Viele Grüße
Ihr GRATIA Team`,

        html: `
        <div style="margin:0;padding:30px 12px;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
          <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;">

            <div style="background:#872020;padding:24px;text-align:center;">
              <img src="cid:gratiaLogo"
                   alt="GRATIA Pflegedienst GmbH"
                   style="display:block;width:190px;max-width:100%;height:auto;margin:0 auto;">
            </div>

            <div style="padding:32px 26px;color:#333333;line-height:1.7;">
              <h1 style="font-size:25px;color:#872020;margin:0 0 22px;">
                Willkommen bei GRATIA!
              </h1>

              <p>Hallo ${safeName},</p>

              <p>
                Sie wurden zum Mitarbeiterportal der
                <strong>GRATIA Pflegedienst GmbH</strong> eingeladen.
              </p>

              <p>
                Bitte richten Sie Ihr persönliches Passwort ein,
                um Ihr Mitarbeiterkonto zu aktivieren.
              </p>

              <div style="text-align:center;margin:32px 0;">
                <a href="${setupUrl}"
                   style="display:inline-block;background:#872020;color:#ffffff;text-decoration:none;padding:15px 28px;border-radius:6px;font-weight:bold;">
                  Passwort festlegen
                </a>
              </div>

              <p style="font-size:14px;color:#666666;">
                Der Einladungslink ist 24 Stunden gültig.
              </p>

              <p style="font-size:14px;">
                Falls der Button nicht funktioniert, öffnen Sie bitte diesen Link
                direkt in Ihrem Browser:
              </p>

              <p style="font-size:13px;word-break:break-all;">
                <a href="${setupUrl}" style="color:#872020;">${setupUrl}</a>
              </p>

              <hr style="border:none;border-top:1px solid #eeeeee;margin:28px 0;">

              <p style="margin-bottom:0;">
                Mit freundlichen Grüßen<br>
                <strong>Ihr GRATIA Team</strong><br>
                <span style="font-size:13px;color:#777777;">Pflegedienst GRATIA GmbH</span>
              </p>
            </div>
          </div>
        </div>`,

        attachments: [
            {
                filename: "gratia-logo.png",
                path: logoPath,
                cid: "gratiaLogo"
            }
        ]
    });
}


app.use(cors());
app.use(express.json({ limit: "1mb" }));

const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "gratia_db",
    waitForConnections: true,
    connectionLimit: 10
});


const CV_UPLOAD_DIR = path.join(__dirname, "private_uploads");

if (!fs.existsSync(CV_UPLOAD_DIR)) {
    fs.mkdirSync(CV_UPLOAD_DIR, { recursive: true });
}

const cvStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, CV_UPLOAD_DIR);
    },
    
filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const uniqueName =
        `${Date.now()}-${crypto.randomUUID()}${extension}`;

    cb(null, uniqueName);
}

});

const uploadCV = multer({
    storage: cvStorage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedExtensions = /\.(pdf|doc|docx)$/i;
        const extensionIsValid = allowedExtensions.test(file.originalname);

        if (!extensionIsValid) {
            return cb(new Error("Nur PDF-, DOC- und DOCX-Dateien sind erlaubt."));
        }

        cb(null, true);
    }
});


// JSON-Berechtigungen aus MySQL vereinheitlichen
function parsePermissions(value) {
    if (!value) return {};

    if (typeof value === "object") {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch {
        return {};
    }
}

// Prüfen, ob ein Benutzer eine Berechtigung besitzt
function hasPermission(user, permission) {
    if (user.role === "super_admin") {
        return true;
    }

    const permissions = user.permissions || {};

    // Unterstützt z. B.:
    // { "contact_messages": { "read": true } }
    // und { "contact_messages.read": true }
    const [section, action] = permission.split(".");

    return (
        permissions.all === true ||
        permissions[permission] === true ||
        permissions[section]?.[action] === true
    );
}

// Login-Token prüfen und aktuellen Benutzer aus der Datenbank laden
async function authenticateToken(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            status: "ERROR",
            message: "Bitte melden Sie sich zuerst an."
        });
    }

    const token = authorization.slice(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [rows] = await db.execute(
            `SELECT
                id,
                username,
                email,
                full_name,
                role,
                is_active,
                must_change_password,
                permissions
             FROM users
             WHERE id = ?
             LIMIT 1`,
            [decoded.sub]
        );

        if (rows.length === 0 || !rows[0].is_active) {
            return res.status(401).json({
                status: "ERROR",
                message: "Dieses Benutzerkonto ist nicht aktiv."
            });
        }

        const user = rows[0];

        user.permissions = parsePermissions(user.permissions);
        req.user = user;

        next();
    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                status: "ERROR",
                message: "Ihre Sitzung ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an."
            });
        }

        console.error("Authentifizierungsfehler:", error.message);

        return res.status(500).json({
            status: "ERROR",
            message: "Die Anmeldung konnte nicht überprüft werden."
        });
    }
}

// Berechtigung für eine bestimmte Aktion prüfen

function requirePermission(permission) {
    return (req, res, next) => {
        if (!hasPermission(req.user, permission)) {
            return res.status(403).json({
                status: "ERROR",
                message: "Sie haben keine Berechtigung für diese Aktion."
            });
        }

        next();
    };
}

// Startseite
app.get("/", (req, res) => {
    res.json({
        message: "Willkommen beim GRATIA Backend!",
        status: "Server läuft"
    });
});

// Server testen
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "GRATIA Backend ist erreichbar"
    });
});

// Datenbankverbindung testen
app.get("/api/db-test", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT DATABASE() AS database_name"
        );

        res.json({
            status: "OK",
            message: "MySQL-Verbindung erfolgreich",
            database: rows[0].database_name
        });
    } catch (error) {
        console.error("Datenbankfehler:", error.message);

        res.status(500).json({
            status: "ERROR",
            message: "Datenbankverbindung fehlgeschlagen"
        });
    }
});

// Anmeldung
app.post("/api/auth/login", async (req, res) => {
    try {
        const { username, password } = req.body || {};

        if (
            typeof username !== "string" ||
            typeof password !== "string" ||
            !username.trim() ||
            !password
        ) {
            return res.status(400).json({
                status: "ERROR",
                message: "Bitte Benutzername und Passwort eingeben."
            });
        }

        const [rows] = await db.execute(
            `SELECT
                id,
                username,
                password_hash,
                email,
                full_name,
                role,
                is_active,
                must_change_password,
                permissions
             FROM users
             WHERE username = ?
             LIMIT 1`,
            [username.trim()]
        );

        if (
            rows.length === 0 ||
            !rows[0].is_active ||
            !(await bcrypt.compare(password, rows[0].password_hash))
        ) {
            return res.status(401).json({
                status: "ERROR",
                message: "Benutzername oder Passwort ist falsch."
            });
        }

        const user = rows[0];

        if (user.must_change_password) {
    return res.status(403).json({
        status: "ERROR",
        message: "Bitte richten Sie zuerst Ihr Passwort ein."
    });
}
        const token = jwt.sign(
            { sub: String(user.id) },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            status: "OK",
            message: "Anmeldung erfolgreich.",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                permissions: parsePermissions(user.permissions),
                must_change_password: Boolean(user.must_change_password)
            }
        });
    } catch (error) {
        console.error("Login-Fehler:", error.message);

        res.status(500).json({
            status: "ERROR",
            message: "Die Anmeldung ist momentan nicht möglich."
        });
    }
});

// Passwort mit sicherem Einladungstoken einrichten
app.post("/api/auth/setup-password", async (req, res) => {
    try {
        const { token, password } = req.body || {};

        if (
            typeof token !== "string" ||
            !token.trim() ||
            typeof password !== "string" ||
            password.length < 12 ||
            password.length > 128
        ) {
            return res.status(400).json({
                status: "ERROR",
                message: "Bitte einen gültigen Einladungstoken und ein Passwort mit 12 bis 128 Zeichen eingeben."
            });
        }

        const crypto = require("crypto");

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const [users] = await db.execute(
            `SELECT id
             FROM users
             WHERE invitation_token_hash = ?
               AND invitation_expires_at > NOW()
               AND must_change_password = TRUE
             LIMIT 1`,
            [tokenHash]
        );

        if (users.length === 0) {
            return res.status(400).json({
                status: "ERROR",
                message: "Der Einladungstoken ist ungültig oder abgelaufen."
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const [result] = await db.execute(
            `UPDATE users
             SET password_hash = ?,
                 must_change_password = FALSE,
                 invitation_token_hash = NULL,
                 invitation_expires_at = NULL,
                 updated_at = NOW()
             WHERE id = ?
               AND invitation_token_hash = ?
               AND invitation_expires_at > NOW()
               AND must_change_password = TRUE`,
            [passwordHash, users[0].id, tokenHash]
        );

        if (result.affectedRows !== 1) {
            return res.status(400).json({
                status: "ERROR",
                message: "Der Token wurde bereits verwendet oder ist abgelaufen."
            });
        }

        return res.json({
            status: "OK",
            message: "Passwort erfolgreich eingerichtet. Sie können sich jetzt anmelden."
        });

    } catch (error) {
        console.error("Fehler bei der Passworteinrichtung:", error.message);

        return res.status(500).json({
            status: "ERROR",
            message: "Das Passwort konnte nicht eingerichtet werden."
        });
    }
});


// Aktuell angemeldeten Benutzer anzeigen
app.get(
    "/api/auth/me",
    authenticateToken,
    (req, res) => {
        const user = req.user;

        res.json({
            status: "OK",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                permissions: user.permissions,
                must_change_password: Boolean(user.must_change_password)
            }
        });
    }
);

// Öffentliches Kontaktformular: Nachricht speichern
// Diese Route bleibt öffentlich, damit Besucher Kontakt aufnehmen können.
app.post("/api/contact-messages", async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body || {};

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof message !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !message.trim()
        ) {
            return res.status(400).json({
                status: "ERROR",
                message: "Bitte füllen Sie alle Pflichtfelder aus."
            });
        }

        const sql = `
            INSERT INTO contact_messages
                (name, email, phone, subject, message)
            VALUES (?, ?, ?, ?, ?)
        `;

        const [result] = await db.execute(sql, [
            name.trim(),
            email.trim(),
            typeof phone === "string" ? phone.trim() || null : null,
            typeof subject === "string" ? subject.trim() || null : null,
            message.trim()
        ]);

        res.status(201).json({
            status: "OK",
            message: "Ihre Nachricht wurde erfolgreich gespeichert.",
            id: result.insertId
        });
    } catch (error) {
        console.error(
            "Fehler beim Speichern der Nachricht:",
            error.message
        );

        res.status(500).json({
            status: "ERROR",
            message: "Ihre Nachricht konnte nicht gespeichert werden."
        });
    }
});
async function initializeEmployeePage() {
    if (!token) {
        logout();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json"
            }
        });

        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Mitarbeiterdaten konnten nicht geladen werden.");
        }

        const data = await response.json();

        if (data.status !== "OK" || !data.user) {
            throw new Error("Ungültige Serverantwort.");
        }

        const user = data.user;

        if (user.must_change_password) {
            window.location.replace("setup-password.html");
            return;
        }

        sessionStorage.setItem(
            "gratiaEmployeeUser",
            JSON.stringify(user)
        );

        showProfile(user);

        const modules = document.getElementById("modules");
        const emptyMessage = document.getElementById("emptyMessage");

        modules.replaceChildren();
        emptyMessage.hidden = true;

        const permissions = user.permissions || {};
        const isAdmin = user.role === "super_admin";
        let visibleModules = 0;

        function createCard(title) {
            const card = document.createElement("article");
            card.className = "module";

            const heading = document.createElement("h3");
            heading.textContent = title;

            card.appendChild(heading);
            modules.appendChild(card);
            visibleModules++;

            return card;
        }

        function addText(parent, text, className = "") {
            const element = document.createElement("p");
            element.textContent = text;
            if (className) element.className = className;
            parent.appendChild(element);
            return element;
        }

        async function fetchAuthorizedData(endpoint) {
            const result = await fetch(`${API_BASE}${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json"
                }
            });

            if (result.status === 401) {
                logout();
                throw new Error("Ihre Sitzung ist abgelaufen.");
            }

            if (!result.ok) {
                throw new Error(
                    `Daten konnten nicht geladen werden (${result.status}).`
                );
            }

            return result.json();
        }

        // Kontaktanfragen
        const canReadMessages =
            isAdmin ||
            hasPermission(permissions, "contact_messages.read");

        if (canReadMessages) {
            const card = createCard("Kontaktanfragen");

            try {
                const result = await fetchAuthorizedData(
                    "/contact-messages"
                );

                if (result.status !== "OK") {
                    throw new Error("Ungültige Serverantwort.");
                }

                const messages = result.messages || [];

                addText(card, `Gesamt: ${messages.length}`, "muted");

                if (messages.length === 0) {
                    addText(card, "Noch keine Kontaktanfragen vorhanden.", "muted");
                }

                messages.forEach(message => {
                    const item = document.createElement("div");
                    item.style.borderTop = "1px solid #eee";
                    item.style.padding = "12px 0";

                    const name = document.createElement("strong");
                    name.textContent = message.name || "Unbekannt";

                    item.appendChild(name);

                    addText(item, `E-Mail: ${message.email || "Keine E-Mail"}`);
                    addText(item, `Telefon: ${message.phone || "Keine Angabe"}`);
                    addText(item, `Betreff: ${message.subject || "Kein Betreff"}`);
                    addText(item, `Nachricht: ${message.message || ""}`);

                    if (message.created_at) {
                        addText(
                            item,
                            `Datum: ${new Date(message.created_at).toLocaleString("de-DE")}`,
                            "muted"
                        );
                    }

                    card.appendChild(item);
                });
            } catch (error) {
                addText(card, error.message, "muted");
            }
        }

        // Bewerbungen
        const canReadApplications =
            isAdmin ||
            hasPermission(permissions, "applications.read");

        if (canReadApplications) {
            const card = createCard("Bewerbungen");

            try {
                const result = await fetchAuthorizedData("/applications");

                if (result.status !== "OK") {
                    throw new Error("Ungültige Serverantwort.");
                }

                const applications = result.applications || [];

                addText(card, `Gesamt: ${applications.length}`, "muted");

                if (applications.length === 0) {
                    addText(card, "Noch keine Bewerbungen vorhanden.", "muted");
                }

                applications.forEach(application => {
                    const item = document.createElement("div");
                    item.style.borderTop = "1px solid #eee";
                    item.style.padding = "12px 0";

                    const name = document.createElement("strong");
                    name.textContent =
                        `${application.first_name || ""} ${application.last_name || ""}`.trim()
                        || "Unbekannter Bewerber";

                    item.appendChild(name);

                    addText(item, `Stelle: ${application.position || "Keine Angabe"}`);
                    addText(item, `E-Mail: ${application.email || "Keine E-Mail"}`);
                    addText(item, `Telefon: ${application.phone || "Keine Angabe"}`);
                    addText(item, `Ort: ${application.city || "Keine Angabe"}`);
                    addText(item, `Status: ${application.status || "neu"}`);

                    if (application.message) {
                        addText(item, `Nachricht: ${application.message}`);
                    }

                    if (application.cv_file_path) {
                        const cvButton = document.createElement("button");
                        cvButton.type = "button";
                        cvButton.textContent = "Lebenslauf herunterladen";

                        cvButton.addEventListener("click", async () => {
                            cvButton.disabled = true;

                            try {
                                const cvResponse = await fetch(
                                    `${API_BASE}/applications/${application.id}/cv`,
                                    {
                                        headers: {
                                            Authorization: `Bearer ${token}`
                                        }
                                    }
                                );

                                if (cvResponse.status === 401) {
                                    logout();
                                    return;
                                }

                                if (!cvResponse.ok) {
                                    throw new Error(
                                        "Lebenslauf konnte nicht heruntergeladen werden."
                                    );
                                }

                                const blob = await cvResponse.blob();
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement("a");

                                link.href = url;
                                link.download =
                                    application.cv_file_name || "Lebenslauf";

                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                                URL.revokeObjectURL(url);
                            } catch (error) {
                                alert(error.message);
                            } finally {
                                cvButton.disabled = false;
                            }
                        });

                        item.appendChild(cvButton);
                    }

                    card.appendChild(item);
                });
            } catch (error) {
                addText(card, error.message, "muted");
            }
        }

        if (visibleModules === 0) {
            emptyMessage.hidden = false;
            emptyMessage.textContent =
                "Für Ihr Konto wurden noch keine Module freigegeben.";
        }

    } catch (error) {
        console.error("Fehler beim Laden des Mitarbeiterbereichs:", error);

        document.getElementById("welcomeTitle").textContent =
            "Daten konnten nicht geladen werden";

        const message = document.getElementById("emptyMessage");
        message.hidden = false;
        message.textContent =
            error.message || "Bitte prüfen Sie die Backend-Verbindung.";
    }
}

/* Lebenslauf sicher herunterladen */
app.get(
    "/api/applications/:id/cv",
    authenticateToken,
    requirePermission("applications.read"),
    async (req, res) => {
        try {
            const applicationId = Number(req.params.id);

            if (!Number.isInteger(applicationId) || applicationId <= 0) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Ungültige Bewerbungs-ID."
                });
            }

            const [rows] = await db.query(
                `SELECT cv_file_path, cv_file_name
                 FROM applications
                 WHERE id = ?
                 LIMIT 1`,
                [applicationId]
            );

            if (rows.length === 0 || !rows[0].cv_file_path) {
                return res.status(404).json({
                    status: "ERROR",
                    message: "Kein Lebenslauf gefunden."
                });
            }

            const filePath = path.basename(rows[0].cv_file_path);
            const fullPath = path.join(CV_UPLOAD_DIR, filePath);

            if (!fs.existsSync(fullPath)) {
                return res.status(404).json({
                    status: "ERROR",
                    message: "Die Lebenslauf-Datei ist nicht verfügbar."
                });
            }

            res.download(
                fullPath,
                path.basename(rows[0].cv_file_name || filePath),
                (error) => {
                    if (error && !res.headersSent) {
                        console.error("Fehler beim Herunterladen des Lebenslaufs:", error);
                        res.status(500).json({
                            status: "ERROR",
                            message: "Der Lebenslauf konnte nicht heruntergeladen werden."
                        });
                    }
                }
            );
        } catch (error) {
            console.error("Fehler beim Laden des Lebenslaufs:", error.message);

            if (!res.headersSent) {
                res.status(500).json({
                    status: "ERROR",
                    message: "Der Lebenslauf konnte nicht geladen werden."
                });
            }
        }
    }
);


// Bewerbungen: nur für berechtigte Benutzer
app.get(
    "/api/applications",
    authenticateToken,
    requirePermission("applications.read"),
    async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT
                    id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    city,
                    position,
                    message,
                    cv_file_name,
                    cv_file_path,
                    status,
                    created_at
                FROM applications
                ORDER BY created_at DESC
            `);

            res.json({
                status: "OK",
                count: rows.length,
                applications: rows
            });
        } catch (error) {
            console.error(
                "Fehler beim Laden der Bewerbungen:",
                error.message
            );

            res.status(500).json({
                status: "ERROR",
                message: "Bewerbungen konnten nicht geladen werden."
            });
        }
    }
);



/* Neue Bewerbung empfangen und speichern */
app.post(
    "/api/applications",
    uploadCV.single("lebenslauf"),
    async (req, res) => {
        try {
            const {
                vorname,
                nachname,
                email,
                telefon,
                wohnort,
                stelle,
                nachricht
            } = req.body;

            if (
                !vorname?.trim() ||
                !nachname?.trim() ||
                !email?.trim() ||
                !telefon?.trim() ||
                !stelle?.trim()
            ) {
                if (req.file) {
                    fs.unlink(req.file.path, () => {});
                }

                return res.status(400).json({
                    status: "ERROR",
                    message: "Bitte füllen Sie alle Pflichtfelder aus."
                });
            }

            const cvFileName = req.file
                ? req.file.originalname
                : null;

            const cvFilePath = req.file
                ? req.file.filename
                : null;

            await db.query(
                `INSERT INTO applications
                (
                    first_name,
                    last_name,
                    email,
                    phone,
                    city,
                    position,
                    message,
                    cv_file_name,
                    cv_file_path,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    vorname.trim(),
                    nachname.trim(),
                    email.trim(),
                    telefon.trim(),
                    wohnort?.trim() || null,
                    stelle.trim(),
                    nachricht?.trim() || null,
                    cvFileName,
                    cvFilePath,
                    "neu"
                ]
            );

            return res.status(201).json({
                status: "OK",
                message: "Ihre Bewerbung wurde erfolgreich gesendet."
            });
        } catch (error) {
            console.error(
                "Fehler beim Speichern der Bewerbung:",
                error.message
            );

            if (req.file) {
                fs.unlink(req.file.path, () => {});
            }

            return res.status(500).json({
                status: "ERROR",
                message: "Die Bewerbung konnte nicht gespeichert werden."
            });
        }
    }
);


/* ================================
   Alle Benutzer anzeigen
// Nur Super-Admins dürfen Benutzer verwalten.
================================ */
app.get(
    "/api/users",
    authenticateToken,
    requirePermission("users.manage"),
    async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT
                    id,
                    username,
                    email,
                    full_name,
                    role,
                    is_active,
                    must_change_password,
                    permissions,
                    created_at,
                    updated_at
                FROM users
                ORDER BY id DESC
            `);

            const users = rows.map(user => ({
                ...user,
                is_active: Boolean(user.is_active),
                must_change_password: Boolean(
                    user.must_change_password
                ),
                permissions: parsePermissions(user.permissions)
            }));

            res.json({
                status: "OK",
                count: users.length,
                users
            });
        } catch (error) {
            console.error(
                "Fehler beim Laden der Benutzer:",
                error.message
            );

            res.status(500).json({
                status: "ERROR",
                message: "Benutzer konnten nicht geladen werden."
            });
        }
    }
);




/* Benutzer erstellen */
app.post(
    "/api/users",
    authenticateToken,
    requirePermission("users.manage"),
    async (req, res) => {
        try {
            const {
                username,
                email,
                full_name,
                role,
                permissions = {}
            } = req.body || {};

            // Pflichtfelder prüfen
            if (
                typeof username !== "string" ||
                !username.trim() ||
                typeof email !== "string" ||
                !email.trim() ||
                typeof full_name !== "string" ||
                !full_name.trim()
            ) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Bitte alle Pflichtfelder ausfüllen."
                });
            }

            const cleanUsername = username.trim();
            const cleanEmail = email.trim().toLowerCase();
            const cleanFullName = full_name.trim();

            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
            ) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Bitte eine gültige E-Mail-Adresse eingeben."
                });
            }

            // Nur erlaubte Rollen akzeptieren
            if (!["admin", "employee"].includes(role)) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Ungültige Benutzerrolle."
                });
            }


            // Berechtigungen sicher prüfen
            if (
                !permissions ||
                typeof permissions !== "object" ||
                Array.isArray(permissions) ||
                permissions.all === true
            ) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Ungültige Einzelberechtigungen."
                });
            }

            const cleanPermissions = {
                "contact_messages.read":
                    permissions["contact_messages.read"] === true ||
                    permissions.contact_messages?.read === true,

                "applications.read":
                    permissions["applications.read"] === true ||
                    permissions.applications?.read === true
            };

            // Doppelte Benutzernamen oder E-Mail-Adressen verhindern
            const [existing] = await db.execute(
                `SELECT id
                 FROM users
                 WHERE username = ? OR email = ?
                 LIMIT 1`,
                [cleanUsername, cleanEmail]
            );

            if (existing.length > 0) {
                return res.status(409).json({
                    status: "ERROR",
                    message:
                        "Benutzername oder E-Mail-Adresse ist bereits vergeben."
                });
            }

            // Sicheres Einladungstoken erzeugen
            const crypto = require("crypto");

            const invitationToken = crypto
                .randomBytes(32)
                .toString("hex");

            // Nur den SHA-256-Hash in der Datenbank speichern
            const invitationTokenHash = crypto
                .createHash("sha256")
                .update(invitationToken)
                .digest("hex");

            // Zufälliges Startpasswort, das niemandem bekannt ist
            const temporaryPassword = crypto
                .randomBytes(32)
                .toString("hex");

            const passwordHash = await bcrypt.hash(
                temporaryPassword,
                12
            );

            // Benutzer erstellen und Einladung 24 Stunden gültig machen
            const [result] = await db.execute(
                `INSERT INTO users (
                    username,
                    password_hash,
                    role,
                    email,
                    full_name,
                    is_active,
                    must_change_password,
                    permissions,
                    invitation_token_hash,
                    invitation_expires_at,
                    updated_at
                ) VALUES (
                    ?, ?, ?, ?, ?, TRUE, TRUE, ?, ?,
                    DATE_ADD(NOW(), INTERVAL 24 HOUR),
                    NOW()
                )`,
                [
                    cleanUsername,
                    passwordHash,
                    role,
                    cleanEmail,
                    cleanFullName,
                    JSON.stringify(cleanPermissions),
                    invitationTokenHash
                ]
            );

let invitationEmailSent = false;

try {
    await sendInvitationEmail(
        cleanEmail,
        cleanFullName,
        invitationToken
    );

    invitationEmailSent = true;
} catch (emailError) {
    console.error(
        "Einladungs-E-Mail konnte nicht gesendet werden:",
        emailError.message
    );
}

            const response = {
                status: "OK",
               message: invitationEmailSent
    ? "Benutzer erstellt. Die Einladung wurde per E-Mail versendet."
    : "Benutzer erstellt, aber die E-Mail konnte nicht gesendet werden.",
invitationEmailSent,
                user: {
                    id: result.insertId,
                    username: cleanUsername,
                    email: cleanEmail,
                    full_name: cleanFullName,
                    role,
                    is_active: true,
                    must_change_password: true,
                    permissions: cleanPermissions
                }
            };

            // Den Token ausschließlich beim lokalen Test zurückgeben
            if (process.env.NODE_ENV !== "production") {
                response.setupToken = invitationToken;
            }

            return res.status(201).json(response);

        } catch (error) {
            console.error(
                "Fehler beim Erstellen des Benutzers:",
                error.message
            );

            return res.status(500).json({
                status: "ERROR",
                message: "Benutzer konnte nicht erstellt werden."
            });
        }
    }
);


/* Neuen Einladungstoken für bestehenden Benutzer erstellen */
app.post(
    "/api/users/:id/resend-invitation",
    authenticateToken,
    requirePermission("users.manage"),
    async (req, res) => {
        try {
            const userId = Number(req.params.id);

            if (!Number.isInteger(userId) || userId <= 0) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Ungültige Benutzer-ID."
                });
            }

            const [users] = await db.execute(
                `SELECT id, username, email, is_active,
                        must_change_password
                 FROM users
                 WHERE id = ?
                 LIMIT 1`,
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    status: "ERROR",
                    message: "Benutzer nicht gefunden."
                });
            }

            const user = users[0];

            if (!user.is_active || !user.must_change_password) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Für diesen Benutzer kann keine Einladung erstellt werden."
                });
            }

            const crypto = require("crypto");

            const invitationToken = crypto
                .randomBytes(32)
                .toString("hex");

            const invitationTokenHash = crypto
                .createHash("sha256")
                .update(invitationToken)
                .digest("hex");

            const [result] = await db.execute(
                `UPDATE users
                 SET invitation_token_hash = ?,
                     invitation_expires_at =
                         DATE_ADD(NOW(), INTERVAL 24 HOUR),
                     updated_at = NOW()
                 WHERE id = ?
                   AND is_active = TRUE
                   AND must_change_password = TRUE`,
                [invitationTokenHash, userId]
            );

            if (result.affectedRows !== 1) {
                return res.status(409).json({
                    status: "ERROR",
                    message: "Die Einladung konnte nicht erneuert werden."
                });
            }

            const response = {
                status: "OK",
                message: "Neue Einladung wurde erstellt.",
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            };

            // Token nur für lokale Tests zurückgeben.
            if (process.env.NODE_ENV !== "production") {
                response.setupToken = invitationToken;
            }

            return res.json(response);

        } catch (error) {
            console.error(
                "Fehler beim Erneuern der Einladung:",
                error.message
            );

            return res.status(500).json({
                status: "ERROR",
                message: "Die Einladung konnte nicht erneuert werden."
            });
        }
    }
);



/* Benutzer aktivieren oder deaktivieren */

/* Benutzer sicher löschen */
app.delete(
    "/api/users/:id",
    authenticateToken,
    requirePermission("users.manage"),
    async (req, res) => {
        try {
            const userId = Number(req.params.id);

            if (!Number.isInteger(userId) || userId <= 0) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Ungültige Benutzer-ID."
                });
            }

            if (userId === Number(req.user.id)) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Sie können Ihr eigenes Konto nicht löschen."
                });
            }

            const [users] = await db.execute(
                "SELECT id, role FROM users WHERE id = ? LIMIT 1",
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    status: "ERROR",
                    message: "Benutzer wurde nicht gefunden."
                });
            }

            if (users[0].role === "super_admin") {
                return res.status(403).json({
                    status: "ERROR",
                    message: "Ein Super-Admin-Konto kann nicht gelöscht werden."
                });
            }

            const [result] = await db.execute(
                "DELETE FROM users WHERE id = ?",
                [userId]
            );

            if (result.affectedRows !== 1) {
                return res.status(404).json({
                    status: "ERROR",
                    message: "Benutzer wurde nicht gefunden."
                });
            }

            return res.json({
                status: "OK",
                message: "Benutzer wurde gelöscht."
            });

        } catch (error) {
            console.error(
                "Fehler beim Löschen des Benutzers:",
                error.message
            );

            if (error.code === "ER_ROW_IS_REFERENCED_2") {
                return res.status(409).json({
                    status: "ERROR",
                    message:
                        "Der Benutzer ist mit anderen Daten verknüpft und kann nicht direkt gelöscht werden. Bitte deaktivieren Sie das Konto."
                });
            }

            return res.status(500).json({
                status: "ERROR",
                message: "Benutzer konnte nicht gelöscht werden."
            });
        }
    }
);


/* Berechtigungen eines Benutzers ändern */
app.patch(
    "/api/users/:id/permissions",
    authenticateToken,
    requirePermission("users.manage"),
    async (req, res) => {
        try {
            const userId = Number(req.params.id);
            const { permissions, role } = req.body || {};

            if (!Number.isInteger(userId) || userId <= 0) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Ungültige Benutzer-ID."
                });
            }

            if (
                !permissions ||
                typeof permissions !== "object" ||
                Array.isArray(permissions)
            ) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Ungültige Berechtigungen."
                });
            }

            const [users] = await db.execute(
                "SELECT id, role FROM users WHERE id = ? LIMIT 1",
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    status: "ERROR",
                    message: "Benutzer wurde nicht gefunden."
                });
            }

            if (users[0].role === "super_admin") {
                return res.status(403).json({
                    status: "ERROR",
                    message: "Die Berechtigungen eines Super-Admins können hier nicht geändert werden."
                });
            }

            if (
                role !== undefined &&
                !["admin", "employee"].includes(role)
            ) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Ungültige Benutzerrolle."
                });
            }

            const contactRead =
                permissions["contact_messages.read"] === true ||
                permissions.contact_messages?.read === true;

            const applicationsRead =
                permissions["applications.read"] === true ||
                permissions.applications?.read === true;

            const cleanPermissions = {
                "contact_messages.read": contactRead,
                "applications.read": applicationsRead
            };

            const newRole = role || users[0].role;

            await db.execute(
                `UPDATE users
                 SET permissions = ?, role = ?
                 WHERE id = ?`,
                [
                    JSON.stringify(cleanPermissions),
                    newRole,
                    userId
                ]
            );

            res.json({
                status: "OK",
                message: "Berechtigungen wurden aktualisiert.",
                user: {
                    id: userId,
                    role: newRole,
                    permissions: cleanPermissions
                }
            });
        } catch (error) {
            console.error(
                "Fehler beim Ändern der Berechtigungen:",
                error.message
            );

            res.status(500).json({
                status: "ERROR",
                message: "Berechtigungen konnten nicht geändert werden."
            });
        }
    }
);


// Server starten
const server = app.listen(PORT, () => {
    console.log(`GRATIA Backend läuft auf http://localhost:${PORT}`);
});

server.on("error", (error) => {
    console.error("Backend-Fehler:", error);
});
