const searchService = require('../services/searchService');
const { sendSuccess } = require('../../../utils/responseHelpers');

class SearchController {
  async search(req, res) {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return sendSuccess(res, { contractors: [], projects: [], tasks: [] });
    }

    const results = await searchService.search(q.trim());
    sendSuccess(res, results);
  }
}

module.exports = new SearchController();
