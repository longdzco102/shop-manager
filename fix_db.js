const db = require('./backend/config/db');

async function fixDb() {
    try {
        // Add payment_method to sales if not exists
        try {
            await db.query(`ALTER TABLE sales ADD COLUMN payment_method ENUM('cod', 'momo') NOT NULL DEFAULT 'cod'`);
            console.log("Added payment_method");
        } catch(e) {
            if(e.code !== 'ER_DUP_FIELDNAME') console.log("payment_method:", e.message);
        }

        // Add other missing columns to sales just in case
        const queries = [
            `ALTER TABLE sales ADD COLUMN status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending'`,
            `ALTER TABLE sales ADD COLUMN customer_name VARCHAR(200) DEFAULT ''`,
            `ALTER TABLE sales ADD COLUMN customer_phone VARCHAR(20) DEFAULT ''`,
            `ALTER TABLE sales ADD COLUMN discount_code VARCHAR(100) DEFAULT NULL`,
            `ALTER TABLE sales ADD COLUMN discount_amount DECIMAL(12, 2) DEFAULT 0`,
            `ALTER TABLE sales ADD COLUMN shipping_name VARCHAR(200) DEFAULT ''`,
            `ALTER TABLE sales ADD COLUMN shipping_phone VARCHAR(20) DEFAULT ''`,
            `ALTER TABLE sales ADD COLUMN shipping_address TEXT DEFAULT ''`
        ];
        
        for (let q of queries) {
            try {
                await db.query(q);
            } catch(e) {
                if(e.code !== 'ER_DUP_FIELDNAME') console.log(e.message);
            }
        }
        
        // Remove base_salary from users if required (User said base_salary is not needed for calculation, so we can just ignore it or remove it from UI, but DB doesn't hurt)
        // Fix user foreign keys to ON DELETE SET NULL or CASCADE.
        // Actually, for delete user, let's just make attendance and cart items cascade.
        // Sales should not be deleted, let's set sales.user_id to nullable.
        // Let's do it in JS.
        try {
            await db.query(`ALTER TABLE sales MODIFY user_id INT NULL`);
            await db.query(`ALTER TABLE sales DROP FOREIGN KEY sales_ibfk_1`);
            await db.query(`ALTER TABLE sales ADD CONSTRAINT sales_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`);
        } catch(e) { console.log(e.message) }

        try {
            await db.query(`ALTER TABLE expenses MODIFY created_by INT NULL`);
            // Drop expense foreing key if named expenses_ibfk_1
            try { await db.query(`ALTER TABLE expenses DROP FOREIGN KEY expenses_ibfk_1`); } catch(e){}
            await db.query(`ALTER TABLE expenses ADD CONSTRAINT expenses_ibfk_1 FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL`);
        } catch(e) { console.log(e.message) }

        try {
            // Drop attendance foreing key if named attendance_ibfk_1
            try { await db.query(`ALTER TABLE attendance DROP FOREIGN KEY attendance_ibfk_1`); } catch(e){}
            await db.query(`ALTER TABLE attendance ADD CONSTRAINT attendance_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`);
        } catch(e) { console.log(e.message) }

        console.log("DB checks done.");
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

fixDb();
