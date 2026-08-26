const db = require('../../../db');

/**
 * Validates that a value is a valid number
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {number} - Validated number
 * @throws {Error} - If value is not a valid number
 */
function validateNumber(value, fieldName) {
    if (value === undefined || value === null) {
        throw new Error(`${fieldName} is required`);
    }
    const num = parseFloat(value);
    if (isNaN(num) || !isFinite(num)) {
        throw new Error(`${fieldName} must be a valid number`);
    }
    return num;
}

/**
 * Validates that a value is a valid positive number
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {number} - Validated positive number
 * @throws {Error} - If value is not a valid positive number
 */
function validatePositiveNumber(value, fieldName) {
    const num = validateNumber(value, fieldName);
    if (num <= 0) {
        throw new Error(`${fieldName} must be a positive number`);
    }
    return num;
}

/**
 * Get all inventory balances with product and warehouse information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Array of inventory balances
 */
exports.getBalances = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT b.*, p.name as product_name, p.sku_internal, w.name as warehouse_name 
            FROM inventory_balances b
            JOIN products p ON b.product_id = p.id
            JOIN warehouses w ON b.warehouse_id = w.id
            ORDER BY p.name ASC, w.name ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching inventory balances:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Get inventory balance for a specific product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Array of balances for the product
 */
exports.getProductBalance = async (req, res) => {
    try {
        const { productId } = req.params;
        if (!productId) return res.status(400).json({ message: 'Product ID is required' });
        
        const validatedProductId = validatePositiveNumber(productId, 'productId');
        
        const result = await db.query(`
            SELECT b.*, w.name as warehouse_name 
            FROM inventory_balances b
            JOIN warehouses w ON b.warehouse_id = w.id
            WHERE b.product_id = $1
        `, [validatedProductId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching product balance:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Create a new inventory transaction
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Transaction result with updated balance
 * 
 * @note TODO: Consider using Decimal.js for precise quantity calculations to avoid
 * floating-point precision issues with fractional units (e.g., 0.001).
 */
exports.createTransaction = async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        
        const { productId, warehouseId, type, quantity, referenceId, referenceType, notes, serialNumbers } = req.body;
        const userId = req.headers['x-user-id'] || null;

        if (!productId || !warehouseId || !type || quantity === undefined) {
            throw new Error('Missing required fields');
        }

        // Validate numeric fields
        const validatedProductId = validatePositiveNumber(productId, 'productId');
        const validatedWarehouseId = validatePositiveNumber(warehouseId, 'warehouseId');
        const parsedQuantity = validatePositiveNumber(quantity, 'quantity');

        let changeQuantity = 0;
        let reserveChange = 0;

        switch(type) {
            case 'receipt': changeQuantity = parsedQuantity; break;
            case 'expense': changeQuantity = -parsedQuantity; break;
            case 'reserve': reserveChange = parsedQuantity; break;
            case 'unreserve': reserveChange = -parsedQuantity; break;
            default: throw new Error('Invalid transaction type');
        }
        
        if (serialNumbers && Array.isArray(serialNumbers) && serialNumbers.length > 0) {
            if (serialNumbers.length !== parsedQuantity) {
                throw new Error(`Number of serial numbers (${serialNumbers.length}) does not match quantity (${parsedQuantity})`);
            }
        }

        // Retrieve settings before updating balance to check allowOversell
        const moduleSettingsLoader = require('../../../utils/moduleSettingsLoader');
        const settings = await moduleSettingsLoader.getModuleSettings('warehouse');
        const allowOversell = settings?.features?.allowOversell ?? false; // TITAN CRM: default to false
        const autoCreatePurchaseRequest = settings?.features?.autoCreatePurchaseRequest ?? true;

        // Get current balance to check available stock BEFORE updating
        // Use FOR UPDATE for pessimistic locking to prevent concurrent modifications
        const currentBalanceResult = await client.query(
            `SELECT quantity, reserved_quantity FROM inventory_balances 
             WHERE product_id = $1 AND warehouse_id = $2 
             FOR UPDATE`,
            [validatedProductId, validatedWarehouseId]
        );

        const currentBalance = currentBalanceResult.rows[0];
        const currentQuantity = parseFloat(currentBalance?.quantity || 0);
        const currentReserved = parseFloat(currentBalance?.reservedQuantity || 0);
        const currentAvailable = currentQuantity - currentReserved;
        
        // Calculate new available after this transaction
        const newAvailable = changeQuantity !== 0 
            ? currentAvailable + changeQuantity 
            : currentAvailable + reserveChange;

        // Check if transaction would cause negative available stock
        if (newAvailable < 0) {
            if (!allowOversell) {
                throw new Error('Insufficient available stock (overselling is disabled)');
            }
            
            // Only create purchase request for expense transactions
            if (autoCreatePurchaseRequest && type === 'expense') {
                const missingQuantity = Math.abs(newAvailable);
                const prCheck = await client.query(
                    `SELECT id, requested_quantity FROM purchase_requests 
                     WHERE product_id = $1 AND status = 'pending' AND (reference_id = $2 OR reference_id IS NULL) LIMIT 1`,
                    [validatedProductId, referenceId || null]
                );
                
                if (prCheck.rows.length > 0) {
                    await client.query(
                        'UPDATE purchase_requests SET requested_quantity = requested_quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                        [missingQuantity, prCheck.rows[0].id]
                    );
                } else {
                    await client.query(
                        `INSERT INTO purchase_requests (product_id, requested_quantity, status, source_type, reference_id, notes)
                         VALUES ($1, $2, 'pending', 'auto', $3, 'Auto-generated due to oversell')`,
                        [validatedProductId, missingQuantity, referenceId || null]
                    );
                }
            }
        }

        // Insert transaction audit log
        const txResult = await client.query(
            `INSERT INTO inventory_transactions (product_id, warehouse_id, type, quantity, reference_id, reference_type, notes, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [validatedProductId, validatedWarehouseId, type, (changeQuantity !== 0 ? changeQuantity : reserveChange), referenceId || null, referenceType || null, notes || null, userId]
        );
        const transactionId = txResult.rows[0].id;

        // Process serial numbers if provided
        if (serialNumbers && Array.isArray(serialNumbers) && serialNumbers.length > 0) {
            for (const serialNumber of serialNumbers) {
                let serialId;
                if (type === 'receipt') {
                    // Check if exists
                    const existingSerial = await client.query(
                        `SELECT id, status FROM inventory_serials WHERE product_id = $1 AND serial_number = $2`,
                        [validatedProductId, serialNumber]
                    );
                    
                    if (existingSerial.rows.length > 0) {
                        if (existingSerial.rows[0].status === 'available') {
                            throw new Error(`Serial number ${serialNumber} is already available in inventory`);
                        }
                        // Update status to available
                        await client.query(
                            `UPDATE inventory_serials SET status = 'available', warehouse_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id`,
                            [validatedWarehouseId, existingSerial.rows[0].id]
                        );
                        serialId = existingSerial.rows[0].id;
                    } else {
                        // Insert new serial
                        const newSerial = await client.query(
                            `INSERT INTO inventory_serials (product_id, warehouse_id, serial_number, status)
                             VALUES ($1, $2, $3, 'available') RETURNING id`,
                            [validatedProductId, validatedWarehouseId, serialNumber]
                        );
                        serialId = newSerial.rows[0].id;
                    }
                } else if (type === 'expense') {
                    // Mark as sold
                    const updatedSerial = await client.query(
                        `UPDATE inventory_serials SET status = 'sold', updated_at = CURRENT_TIMESTAMP 
                         WHERE product_id = $1 AND serial_number = $2 AND warehouse_id = $3 AND status = 'available' RETURNING id`,
                        [validatedProductId, serialNumber, validatedWarehouseId]
                    );
                    if (updatedSerial.rows.length === 0) {
                        throw new Error(`Serial number ${serialNumber} is not available in this warehouse`);
                    }
                    serialId = updatedSerial.rows[0].id;
                } else if (type === 'reserve') {
                    // Mark as reserved
                    const updatedSerial = await client.query(
                        `UPDATE inventory_serials SET status = 'reserved', updated_at = CURRENT_TIMESTAMP 
                         WHERE product_id = $1 AND serial_number = $2 AND warehouse_id = $3 AND status = 'available' RETURNING id`,
                        [validatedProductId, serialNumber, validatedWarehouseId]
                    );
                    if (updatedSerial.rows.length === 0) {
                        throw new Error(`Serial number ${serialNumber} is not available for reservation`);
                    }
                    serialId = updatedSerial.rows[0].id;
                } else if (type === 'unreserve') {
                    // Unmark as reserved
                    const updatedSerial = await client.query(
                        `UPDATE inventory_serials SET status = 'available', updated_at = CURRENT_TIMESTAMP 
                         WHERE product_id = $1 AND serial_number = $2 AND warehouse_id = $3 AND status = 'reserved' RETURNING id`,
                        [validatedProductId, serialNumber, validatedWarehouseId]
                    );
                    if (updatedSerial.rows.length === 0) {
                        throw new Error(`Serial number ${serialNumber} is not reserved`);
                    }
                    serialId = updatedSerial.rows[0].id;
                }

                if (serialId) {
                    await client.query(
                        `INSERT INTO inventory_transaction_serials (transaction_id, serial_id) VALUES ($1, $2)`,
                        [transactionId, serialId]
                    );
                }
            }
        }

        // Upsert balance
        const balanceResult = await client.query(
            `INSERT INTO inventory_balances (product_id, warehouse_id, quantity, reserved_quantity)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (product_id, warehouse_id)
             DO UPDATE SET 
                quantity = inventory_balances.quantity + EXCLUDED.quantity,
                reserved_quantity = inventory_balances.reserved_quantity + EXCLUDED.reserved_quantity,
                updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [validatedProductId, validatedWarehouseId, changeQuantity, reserveChange]
        );

        const newBalance = balanceResult.rows[0];

        await client.query('COMMIT');
        res.status(201).json({ message: 'Transaction successful', balance: newBalance });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating transaction:', err);
        res.status(err.message.includes('Missing') || err.message.includes('Insufficient') ? 400 : 500).json({ message: err.message || 'Internal server error' });
    } finally {
        client.release();
    }
};

/**
 * Get all inventory transactions with filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Array of transactions
 */
exports.getTransactions = async (req, res) => {
    try {
        const { productId, warehouseId, limit = 50, offset = 0 } = req.query;
        
        // Validate numeric query parameters
        const validatedLimit = !isNaN(parseInt(limit, 10)) ? parseInt(limit, 10) : 50;
        const validatedOffset = !isNaN(parseInt(offset, 10)) ? parseInt(offset, 10) : 0;
        
        let query = `
            SELECT t.*, p.name as product_name, w.name as warehouse_name, u.name as user_name
            FROM inventory_transactions t
            JOIN products p ON t.product_id = p.id
            JOIN warehouses w ON t.warehouse_id = w.id
            LEFT JOIN users u ON t.created_by = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (productId) {
            const validatedProductId = validatePositiveNumber(productId, 'productId');
            query += ` AND t.product_id = $${paramCount++}`;
            params.push(validatedProductId);
        }
        if (warehouseId) {
            const validatedWarehouseId = validatePositiveNumber(warehouseId, 'warehouseId');
            query += ` AND t.warehouse_id = $${paramCount++}`;
            params.push(validatedWarehouseId);
        }

        query += ` ORDER BY t.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
        params.push(validatedLimit);
        params.push(validatedOffset);

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Get all purchase requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Array of purchase requests
 */
exports.getPurchaseRequests = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT pr.*, p.name as product_name, p.sku_internal
            FROM purchase_requests pr
            JOIN products p ON pr.product_id = p.id
            ORDER BY pr.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching purchase requests:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Create a new purchase request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Created purchase request
 */
exports.createPurchaseRequest = async (req, res) => {
    try {
        const { productId, requestedQuantity, referenceId, notes } = req.body;
        if (!productId || !requestedQuantity) return res.status(400).json({ message: 'Product ID and quantity required' });
        
        // Validate numeric fields
        const validatedProductId = validatePositiveNumber(productId, 'productId');
        const validatedQuantity = validatePositiveNumber(requestedQuantity, 'requestedQuantity');

        const result = await db.query(
            `INSERT INTO purchase_requests (product_id, requested_quantity, status, source_type, reference_id, notes)
             VALUES ($1, $2, 'pending', 'manual', $3, $4) RETURNING *`,
            [validatedProductId, validatedQuantity, referenceId || null, notes || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating purchase request:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Update an existing purchase request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Updated purchase request
 */
exports.updatePurchaseRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, requestedQuantity, notes } = req.body;
        
        if (!id) return res.status(400).json({ message: 'Purchase request ID is required' });
        
        // Validate numeric fields if provided
        const validatedQuantity = requestedQuantity !== undefined 
            ? validatePositiveNumber(requestedQuantity, 'requestedQuantity')
            : undefined;

        const result = await db.query(
            `UPDATE purchase_requests 
             SET status = COALESCE($1, status),
                 requested_quantity = COALESCE($2, requested_quantity),
                 notes = COALESCE($3, notes),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4 RETURNING *`,
            [status, validatedQuantity, notes, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ message: 'Purchase request not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating purchase request:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
