
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function createSuperAdmin() {
    let db;

    try {
        const {
            DB_HOST,
            DB_PORT,
            DB_USER,
            DB_PASSWORD,
            DB_NAME,
            BOOTSTRAP_ADMIN_USERNAME,
            BOOTSTRAP_ADMIN_NAME,
            BOOTSTRAP_ADMIN_EMAIL,
            BOOTSTRAP_ADMIN_PASSWORD
        } = process.env;

        if (
            !BOOTSTRAP_ADMIN_USERNAME ||
            !BOOTSTRAP_ADMIN_NAME ||
            !BOOTSTRAP_ADMIN_EMAIL ||
            !BOOTSTRAP_ADMIN_PASSWORD ||
            BOOTSTRAP_ADMIN_PASSWORD ===
                "YOUR_STRONG_TEMPORARY_PASSWORD"
        ) {
            throw new Error(
                "Bitte die Admin-Angaben in der .env-Datei prüfen."
            );
        }

        if (BOOTSTRAP_ADMIN_PASSWORD.length < 12) {
            throw new Error(
                "Das Admin-Passwort muss mindestens 12 Zeichen haben."
            );
        }

        db = await mysql.createConnection({
            host: DB_HOST || "localhost",
            port: Number(DB_PORT || 3306),
            user: DB_USER || "root",
            password: DB_PASSWORD,
            database: DB_NAME || "gratia_db"
        });

        const [existing] = await db.execute(
            `SELECT id
             FROM users
             WHERE username = ? OR role = 'super_admin'
             LIMIT 1`,
            [BOOTSTRAP_ADMIN_USERNAME]
        );

        if (existing.length > 0) {
            throw new Error(
                "Ein Super-Admin oder dieser Benutzer existiert bereits."
            );
        }

        const passwordHash = await bcrypt.hash(
            BOOTSTRAP_ADMIN_PASSWORD,
            12
        );

        const permissions = JSON.stringify({
            all: true
        });

        await db.execute(
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
                BOOTSTRAP_ADMIN_USERNAME,
                passwordHash,
                "super_admin",
                BOOTSTRAP_ADMIN_EMAIL,
                BOOTSTRAP_ADMIN_NAME,
                true,
                false,
                permissions
            ]
        );

        console.log(
            "Super-Admin wurde erfolgreich erstellt."
        );
        console.log(
            "Username:", BOOTSTRAP_ADMIN_USERNAME
        );
        console.log(
            "E-Mail:", BOOTSTRAP_ADMIN_EMAIL
        );
        console.log(
            "Passwort wurde sicher gehasht gespeichert."
        );

    } catch (error) {
        console.error(
            "Fehler beim Erstellen des Super-Admins:",
            error.message
        );
        process.exitCode = 1;
    } finally {
        if (db) {
            await db.end();
        }
    }
}

createSuperAdmin();
