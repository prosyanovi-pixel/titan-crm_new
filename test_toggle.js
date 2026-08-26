const { toggleModule } = require('./backend/modules/administration/controllers/modules');
const req = { params: { id: 'ai' }, body: { is_active: false } };
const res = { json: (data) => console.log('JSON', data), status: (code) => ({ json: (data) => console.log('STATUS', code, data) }) };
toggleModule(req, res).then(() => { process.exit(0); }).catch(console.error);
