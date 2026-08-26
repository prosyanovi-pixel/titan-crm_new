# Administration Module

Consolidates users, employees, roles, permissions, organizational structure (departments, positions), and company management into a unified module.

## 📁 Structure

```
administration/
├── index.js                 # Module entry point
├── settings.js              # Configuration & defaults (roles, permissions)
├── routes/                  # Express routers
│   ├── users.js
│   ├── employees.js
│   ├── roles.js
│   └── permissions.js
├── controllers/             # Request handlers
│   ├── users.js
│   └── employees.js
├── services/                # Business logic
│   ├── userService.js
│   ├── employeeSync.js
│   └── permissionCache.js
├── utils/                   # Utilities
│   └── validators.js
└── __tests__/               # Test suite
    ├── unit/
    │   └── services/
    └── integration/
        └── routes/
```

## 🚀 Getting Started

### Phase 1: Setup & Users (In Progress)
- [x] Module directory structure
- [x] `settings.js` with default roles and permissions
- [x] Initial `index.js` module entry point
- [ ] `userService.js` - CRUD operations
- [ ] `users.js` route handler
- [ ] Unit tests for userService
- [ ] Integration tests for user routes

### Phase 2: HR & Employees
- [ ] Employee service and routes
- [ ] `employeeSync.js` - user-employee synchronization
- [ ] Permission cache service
- [ ] Integration tests for employee workflows

### Phase 3: Cleanup & Deployment
- [ ] Verify all routes working
- [ ] Full E2E tests
- [ ] Deployment and verification

## 📋 Development Guide

### Adding a New Feature

1. **Create service** in `services/`:
   ```javascript
   // services/userService.js
   async function create(userData) { /* ... */ }
   ```

2. **Create controller** in `controllers/`:
   ```javascript
   // controllers/users.js
   const create = asyncHandler(async (req, res) => { /* ... */ });
   ```

3. **Create route** in `routes/`:
   ```javascript
   // routes/users.js
   router.post('/', create);
   ```

4. **Write tests**:
   - Unit test in `__tests__/unit/services/`
   - Integration test in `__tests__/integration/routes/`

5. **Update plan** in [../../plans/backend/refactoring-plans/administration-module.md](../../plans/backend/refactoring-plans/administration-module.md)

## 🧪 Testing

```bash
# Run all tests
npm run test -- backend/modules/administration

# Unit tests only
npm run test -- backend/modules/administration/__tests__/unit

# Integration tests only
npm run test -- backend/modules/administration/__tests__/integration

# With coverage
npm run test:coverage -- backend/modules/administration
```

## 📚 References

- [Full Refactoring Plan](../../plans/backend/refactoring-plans/administration-module.md)
- [Module Architecture](../ARCHITECTURE.md)
- [Testing Guide](../../docs/DEVELOPMENT_RULES.md)
