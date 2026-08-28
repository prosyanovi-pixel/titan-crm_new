const quotesRoutes = require('./routes/quotesRoutes');
const settings = require('./settings');

module.exports = (app) => {
    // Inject any module specific setup here
    return quotesRoutes;
};
