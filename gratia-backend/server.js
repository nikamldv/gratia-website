
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// بدون JWT_SECRET سرور نباید اجرا شود.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error(
        "Fehler: JWT_SECRET fehlt oder ist zu kurz. Bitte .env prüfen."
    );
    process.exit(1);
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

// Kontaktanfragen: nur für berechtigte Benutzer
app.get(
    "/api/contact-messages",
    authenticateToken,
    requirePermission("contact_messages.read"),
    async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT *
                FROM contact_messages
                ORDER BY id DESC
            `);

            res.json({
                status: "OK",
                count: rows.length,
                messages: rows
            });
        } catch (error) {
            console.error(
                "Fehler beim Laden der Nachrichten:",
                error.message
            );

            res.status(500).json({
                status: "ERROR",
                message: "Kontaktanfragen konnten nicht geladen werden."
            });
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


/* ================================
   Benutzerverwaltung
================================ */

// Alle Benutzer anzeigen
// Nur Super-Admins dürfen Benutzer verwalten.
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
                permissions
            } = req.body || {};

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

            // Nur erlaubte Rollen akzeptieren
            const allowedRoles = [
                "admin",
                "employee"
            ];

            if (!allowedRoles.includes(role)) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Ungültige Benutzerrolle."
                });
            }

            // Der Client darf keine uneingeschränkten Rechte vergeben
            if (
                !permissions ||
                typeof permissions !== "object" ||
                Array.isArray(permissions) ||
                permissions.all === true
            ) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Bitte gültige Einzelberechtigungen auswählen."
                });
            }

            const allowedPermissions = [
                "contact_messages.read",
                "applications.read"
            ];

            const cleanPermissions = {};

            for (const permission of allowedPermissions) {
                const [section, action] = permission.split(".");

                const enabled =
                    permissions[permission] === true ||
                    permissions[section]?.[action] === true;

                cleanPermissions[permission] = enabled;
            }

            const [existing] = await db.execute(
                `SELECT id
                 FROM users
                 WHERE username = ? OR email = ?
                 LIMIT 1`,
                [username.trim(), email.trim()]
            );

            if (existing.length > 0) {
                return res.status(409).json({
                    status: "ERROR",
                    message: "Benutzername oder E-Mail-Adresse ist bereits vergeben."
                });
            }

            // Zufälliges, nicht verwendbares Startpasswort.
            // Der Benutzer benötigt später einen sicheren Einrichtungsprozess.
            const temporaryPassword =
                require("crypto").randomBytes(32).toString("hex");

            const passwordHash = await bcrypt.hash(
                temporaryPassword,
                12
            );

            const [result] = await db.execute(
                `INSERT INTO users (
                    username,
                    password_hash,
                    role,
                    email,
                    full_name,
                    is_active,
                    must_change_password,
                    permissions
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    username.trim(),
                    passwordHash,
                    role,
                    email.trim(),
                    full_name.trim(),
                    true,
                    true,
                    JSON.stringify(cleanPermissions)
                ]
            );

            res.status(201).json({
                status: "OK",
                message: "Benutzer wurde erstellt. Die Passwort-Einrichtung muss noch eingerichtet werden.",
                user: {
                    id: result.insertId,
                    username: username.trim(),
                    email: email.trim(),
                    full_name: full_name.trim(),
                    role,
                    is_active: true,
                    must_change_password: true,
                    permissions: cleanPermissions
                }
            });
        } catch (error) {
            console.error(
                "Fehler beim Erstellen des Benutzers:",
                error.message
            );

            res.status(500).json({
                status: "ERROR",
                message: "Benutzer konnte nicht erstellt werden."
            });
        }
    }
);


/* Benutzer aktivieren oder deaktivieren */
app.patch(
    "/api/users/:id/status",
    authenticateToken,
    requirePermission("users.manage"),
    async (req, res) => {
        try {
            const userId = Number(req.params.id);
            const { is_active } = req.body || {};

            if (
                !Number.isInteger(userId) ||
                userId <= 0 ||
                typeof is_active !== "boolean"
            ) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Ungültige Benutzer-ID oder Statusangabe."
                });
            }

            if (userId === Number(req.user.id)) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Sie können Ihr eigenes Konto hier nicht deaktivieren."
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
                    message: "Ein Super-Admin-Konto kann hier nicht deaktiviert werden."
                });
            }

            await db.execute(
                "UPDATE users SET is_active = ? WHERE id = ?",
                [is_active, userId]
            );

            res.json({
                status: "OK",
                message: is_active
                    ? "Benutzer wurde aktiviert."
                    : "Benutzer wurde deaktiviert."
            });
        } catch (error) {
            console.error(
                "Fehler beim Ändern des Benutzerstatus:",
                error.message
            );

            res.status(500).json({
                status: "ERROR",
                message: "Benutzerstatus konnte nicht geändert werden."
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
