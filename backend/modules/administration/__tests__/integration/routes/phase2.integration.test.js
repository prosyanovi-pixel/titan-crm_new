/**
 * @jest-environment node
 */
const request = require('supertest');
const express = require('express');

// ── Mock middleware ──────────────────────────────────────────────
jest.mock('../../../../../middleware/auth', () => ({
  authMiddleware: (req, res, next) => {
    req.user = { id: 'admin-id', name: 'Admin' };
    next();
  }
}));

jest.mock('../../../../../middleware/checkPermission', () => {
  return () => (req, res, next) => {
    req.user = { ...req.user, role: 'admin' };
    next();
  };
});

// ── Mock services ───────────────────────────────────────────────
jest.mock('../../../services/roleService');
jest.mock('../../../services/employeeService');
jest.mock('../../../services/orgService');
jest.mock('../../../services/companyService');

const roleService = require('../../../services/roleService');
const employeeService = require('../../../services/employeeService');
const orgService = require('../../../services/orgService');
const companyService = require('../../../services/companyService');

// ── Routes ──────────────────────────────────────────────────────
const rolesRouter = require('../../../routes/roles');
const permissionsRouter = require('../../../routes/permissions');
const employeesRouter = require('../../../routes/employees');
const orgRouter = require('../../../routes/org');
const companyRouter = require('../../../routes/company');

// ── App setup ───────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/api/admin/roles', rolesRouter);
app.use('/api/admin/permissions', permissionsRouter);
app.use('/api/admin/employees', employeesRouter);
app.use('/api/admin/org', orgRouter);
app.use('/api/admin/company', companyRouter);

// ═════════════════════════════════════════════════════════════════
// ROLES
// ═════════════════════════════════════════════════════════════════
describe('Roles Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /api/admin/roles — should return all roles', async () => {
    roleService.getAllRoles.mockResolvedValue([
      { id: 'admin', name: 'Admin', permissions: ['*'] }
    ]);

    const res = await request(app).get('/api/admin/roles');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('admin');
  });

  it('POST /api/admin/roles — should create role', async () => {
    roleService.createRole.mockResolvedValue({ id: 'new_role', name: 'New', permissions: [] });

    const res = await request(app)
      .post('/api/admin/roles')
      .send({ name: 'New', description: 'Test', permissions: [] });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('new_role');
  });

  it('PUT /api/admin/roles/:id — should update role', async () => {
    roleService.updateRole.mockResolvedValue({ id: 'admin', name: 'Updated' });

    const res = await request(app)
      .put('/api/admin/roles/admin')
      .send({ name: 'Updated', description: 'Updated desc', permissions: ['*'] });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated');
  });

  it('PUT /api/admin/roles/:id — should 404 if not found', async () => {
    roleService.updateRole.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/admin/roles/nonexistent')
      .send({ name: 'X' });

    expect(res.status).toBe(404);
  });

  it('DELETE /api/admin/roles/:id — should delete role', async () => {
    roleService.deleteRole.mockResolvedValue();

    const res = await request(app).delete('/api/admin/roles/test_role');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/admin/roles/:id — should 400 if role in use', async () => {
    roleService.deleteRole.mockRejectedValue(new Error('Невозможно удалить роль, назначенную пользователям'));

    const res = await request(app).delete('/api/admin/roles/admin');
    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════════════
// PERMISSIONS
// ═════════════════════════════════════════════════════════════════
describe('Permissions Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /api/admin/permissions — should return all permissions', async () => {
    roleService.getAllPermissions.mockResolvedValue([
      { id: 'users:read', name: 'Read users' }
    ]);

    const res = await request(app).get('/api/admin/permissions');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

// ═════════════════════════════════════════════════════════════════
// EMPLOYEES
// ═════════════════════════════════════════════════════════════════
describe('Employees Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /api/admin/employees — should return all employees', async () => {
    employeeService.getAllEmployees.mockResolvedValue([
      { id: 1, full_name: 'Иван Петров', department_name: 'IT' }
    ]);

    const res = await request(app).get('/api/admin/employees');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].full_name).toBe('Иван Петров');
  });

  it('GET /api/admin/employees/:id — should return employee by id', async () => {
    employeeService.getEmployeeById.mockResolvedValue({ id: 1, full_name: 'Иван Петров' });

    const res = await request(app).get('/api/admin/employees/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('GET /api/admin/employees/:id — should 404 if not found', async () => {
    employeeService.getEmployeeById.mockResolvedValue(null);

    const res = await request(app).get('/api/admin/employees/999');
    expect(res.status).toBe(404);
  });

  it('POST /api/admin/employees — should create employee', async () => {
    employeeService.createEmployee.mockResolvedValue({ id: 2, full_name: 'Мария Сидорова' });

    const res = await request(app)
      .post('/api/admin/employees')
      .send({ full_name: 'Мария Сидорова', department_id: 1 });

    expect(res.status).toBe(201);
    expect(res.body.full_name).toBe('Мария Сидорова');
  });

  it('PUT /api/admin/employees/:id — should update employee', async () => {
    employeeService.updateEmployee.mockResolvedValue({ id: 1, full_name: 'Иван Обновлён' });

    const res = await request(app)
      .put('/api/admin/employees/1')
      .send({ full_name: 'Иван Обновлён' });

    expect(res.status).toBe(200);
    expect(res.body.full_name).toBe('Иван Обновлён');
  });

  it('PUT /api/admin/employees/:id — should 404 if not found', async () => {
    employeeService.updateEmployee.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/admin/employees/999')
      .send({ full_name: 'X' });

    expect(res.status).toBe(404);
  });

  it('DELETE /api/admin/employees/:id — should delete employee', async () => {
    employeeService.deleteEmployee.mockResolvedValue(true);

    const res = await request(app).delete('/api/admin/employees/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/admin/employees/:id — should 404 if not found', async () => {
    employeeService.deleteEmployee.mockResolvedValue(false);

    const res = await request(app).delete('/api/admin/employees/999');
    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════
// ORG (Departments + Positions)
// ═════════════════════════════════════════════════════════════════
describe('Org Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  // -- Org Info --
  it('GET /api/admin/org — should return org info', async () => {
    orgService.getOrgInfo.mockResolvedValue({ departments: 3, positions: 5 });

    const res = await request(app).get('/api/admin/org');
    expect(res.status).toBe(200);
    expect(res.body.departments).toBe(3);
  });

  // -- Departments --
  it('GET /api/admin/org/departments — should return departments', async () => {
    orgService.getAllDepartments.mockResolvedValue([{ id: 1, name: 'IT' }]);

    const res = await request(app).get('/api/admin/org/departments');
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe('IT');
  });

  it('POST /api/admin/org/departments — should create department', async () => {
    orgService.createDepartment.mockResolvedValue({ id: 2, name: 'HR' });

    const res = await request(app)
      .post('/api/admin/org/departments')
      .send({ name: 'HR' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('HR');
  });

  it('PUT /api/admin/org/departments/:id — should update department', async () => {
    orgService.updateDepartment.mockResolvedValue({ id: 1, name: 'IT Updated' });

    const res = await request(app)
      .put('/api/admin/org/departments/1')
      .send({ name: 'IT Updated' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('IT Updated');
  });

  it('DELETE /api/admin/org/departments/:id — should delete department', async () => {
    orgService.deleteDepartment.mockResolvedValue();

    const res = await request(app).delete('/api/admin/org/departments/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/admin/org/departments/:id — should 400 if in use', async () => {
    orgService.deleteDepartment.mockRejectedValue(new Error('Отдел используется сотрудниками'));

    const res = await request(app).delete('/api/admin/org/departments/1');
    expect(res.status).toBe(400);
  });

  // -- Positions --
  it('GET /api/admin/org/positions — should return positions', async () => {
    orgService.getAllPositions.mockResolvedValue([{ id: 1, name: 'Developer' }]);

    const res = await request(app).get('/api/admin/org/positions');
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe('Developer');
  });

  it('POST /api/admin/org/positions — should create position', async () => {
    orgService.createPosition.mockResolvedValue({ id: 2, name: 'Designer' });

    const res = await request(app)
      .post('/api/admin/org/positions')
      .send({ name: 'Designer' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Designer');
  });

  it('PUT /api/admin/org/positions/:id — should update position', async () => {
    orgService.updatePosition.mockResolvedValue({ id: 1, name: 'Senior Dev' });

    const res = await request(app)
      .put('/api/admin/org/positions/1')
      .send({ name: 'Senior Dev' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Senior Dev');
  });

  it('DELETE /api/admin/org/positions/:id — should delete position', async () => {
    orgService.deletePosition.mockResolvedValue();

    const res = await request(app).delete('/api/admin/org/positions/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/admin/org/positions/:id — should 400 if in use', async () => {
    orgService.deletePosition.mockRejectedValue(new Error('Должность используется сотрудниками'));

    const res = await request(app).delete('/api/admin/org/positions/1');
    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════════════
// COMPANY
// ═════════════════════════════════════════════════════════════════
describe('Company Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /api/admin/company — should return company info', async () => {
    companyService.getProfile.mockResolvedValue({ full_name: 'ООО Титан' });

    const res = await request(app).get('/api/admin/company');
    expect(res.status).toBe(200);
    expect(res.body.profile.full_name).toBe('ООО Титан');
  });

  it('GET /api/admin/company/profile — should return profile', async () => {
    companyService.getProfile.mockResolvedValue({ full_name: 'ООО Титан', inn: '1234567890' });

    const res = await request(app).get('/api/admin/company/profile');
    expect(res.status).toBe(200);
    expect(res.body.inn).toBe('1234567890');
  });

  it('PUT /api/admin/company/profile — should update profile', async () => {
    companyService.updateProfile.mockResolvedValue({ full_name: 'ООО Титан Обновлённый' });

    const res = await request(app)
      .put('/api/admin/company/profile')
      .send({ full_name: 'ООО Титан Обновлённый' });

    expect(res.status).toBe(200);
    expect(res.body.full_name).toBe('ООО Титан Обновлённый');
  });

  it('GET /api/admin/company/accounts — should return accounts', async () => {
    companyService.getAllAccounts.mockResolvedValue([
      { id: 1, name: 'Основной счёт', is_default: true }
    ]);

    const res = await request(app).get('/api/admin/company/accounts');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('POST /api/admin/company/accounts — should create account', async () => {
    companyService.createAccount.mockResolvedValue({ id: 2, name: 'Доп. счёт' });

    const res = await request(app)
      .post('/api/admin/company/accounts')
      .send({ name: 'Доп. счёт' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Доп. счёт');
  });

  it('PUT /api/admin/company/accounts/:id — should update account', async () => {
    companyService.updateAccount.mockResolvedValue({ id: 1, name: 'Обновлённый' });

    const res = await request(app)
      .put('/api/admin/company/accounts/1')
      .send({ name: 'Обновлённый' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Обновлённый');
  });

  it('PUT /api/admin/company/accounts/:id — should 404 if not found', async () => {
    companyService.updateAccount.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/admin/company/accounts/999')
      .send({ name: 'X' });

    expect(res.status).toBe(404);
  });

  it('DELETE /api/admin/company/accounts/:id — should delete account', async () => {
    companyService.deleteAccount.mockResolvedValue(true);

    const res = await request(app).delete('/api/admin/company/accounts/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/admin/company/accounts/:id — should 404 if not found', async () => {
    companyService.deleteAccount.mockResolvedValue(false);

    const res = await request(app).delete('/api/admin/company/accounts/999');
    expect(res.status).toBe(404);
  });
});
