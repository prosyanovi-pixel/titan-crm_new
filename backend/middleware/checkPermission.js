
const db = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'titan-crm-secret-key-2026';

/**
 * Проверка наличия права с поддержкой wildcard
 * @param {string} requiredPermission - Требуемое право, например 'roles.read'
 * @param {string[]} userPermissions - Права пользователя
 * @returns {boolean}
 */
const hasPermission = (requiredPermission, userPermissions) => {
  // Точное совпадение
  if (userPermissions.includes(requiredPermission)) return true;
  
  // Глобальный wildcard
  if (userPermissions.includes('*')) return true;
  
  // Wildcard модуля: например 'roles.*' покрывает 'roles.read', 'roles.write'
  const [resource] = requiredPermission.split('.');
  const wildcardPermission = `${resource}.*`;
  if (userPermissions.includes(wildcardPermission)) return true;
  
  return false;
};

/**
 * Middleware для проверки прав доступа.
 * @param {string|string[]} requiredPermission - Строка права или массив прав, например 'users.delete' или ['users.read', 'users.write']
 * @param {object} options - Опции
 * @param {string} options.mode - Режим проверки: 'any' (любое из списка) или 'all' (все права)
 */
const checkPermission = (requiredPermission, options = {}) => {
  const { mode = 'any' } = options;
  
  return async (req, res, next) => {
    try {
      // 1. Извлекаем токен из заголовков
      const authHeader = req.headers.authorization;
      let userId;
      let userRole;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          userId = decoded.id;
          userRole = decoded.role;
        } catch (jwtErr) {
          console.error('JWT verification failed:', jwtErr.message);
          return res.status(401).json({ error: 'Недействительный или истекший токен' });
        }
      } else {
        // Fallback для разработки (если не передан Bearer токен)
        userId = req.headers['x-user-id'] || '2';
      }

      // 2. Получаем роль пользователя и её права
      const query = `
        SELECT r.permissions, r.name as role_name, u.role as user_role_id
        FROM users u
        LEFT JOIN roles r ON r.id = u.role
        WHERE u.id = $1
      `;

      const { rows } = await db.query(query, [userId]);

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Пользователь не авторизован или роль не найдена' });
      }

      const userPermissions = rows[0].permissions || [];
      const roleName = rows[0].role_name;
      
      // Добавляем инфо о пользователе в request для последующего использования
      req.user = {
        id: userId,
        role: rows[0].user_role_id,
        permissions: userPermissions
      };

      // 3. Проверяем наличие нужного права с поддержкой wildcard
      // Если передан массив прав
      if (Array.isArray(requiredPermission)) {
        if (mode === 'any') {
          // Достаточно любого одного права
          const hasAny = requiredPermission.some(p => hasPermission(p, userPermissions));
          if (!hasAny) {
            console.log(`Access Denied: User ${userId} (${roleName}) tried [${requiredPermission}] but has ${JSON.stringify(userPermissions)}`);
            return res.status(403).json({
              error: 'Нет прав доступа',
              details: `Необходимо одно из прав: ${requiredPermission.join(', ')}`
            });
          }
        } else {
          // Нужны все права
          const hasAll = requiredPermission.every(p => hasPermission(p, userPermissions));
          if (!hasAll) {
            console.log(`Access Denied: User ${userId} (${roleName}) tried [${requiredPermission}] but has ${JSON.stringify(userPermissions)}`);
            return res.status(403).json({
              error: 'Нет прав доступа',
              details: `Необходимы все права: ${requiredPermission.join(', ')}`
            });
          }
        }
      } else {
        // Проверка одного права
        if (!hasPermission(requiredPermission, userPermissions)) {
          console.log(`Access Denied: User ${userId} (${roleName}) tried ${requiredPermission} but has ${JSON.stringify(userPermissions)}`);
          return res.status(403).json({
            error: 'Нет прав доступа',
            details: `Необходимо право: ${requiredPermission}`
          });
        }
      }

      // 3. Если всё ок, идем дальше
      next();

    } catch (err) {
      console.error('Permission check error:', err);
      res.status(500).json({ error: 'Ошибка проверки прав доступа' });
    }
  };
};

module.exports = checkPermission;
module.exports.hasPermission = hasPermission;
