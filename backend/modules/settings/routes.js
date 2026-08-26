const express = require('express');
const { asyncHandler } = require('../../utils/errorHandler');
const { sendSuccess } = require('../../utils/responseHelpers');
const statusesRouter = require('./controllers/statuses');
const tagsRouter = require('./controllers/tags');
const prioritiesRouter = require('./controllers/priorities');
const projectStagesRouter = require('./controllers/projectStages');
const externalRouter = require('./controllers/external');
const referenceDataService = require('./services/referenceData');

const router = express.Router();

router.use('/statuses', statusesRouter);
router.use('/tags', tagsRouter);
router.use('/priorities', prioritiesRouter);
router.use('/project-stages', projectStagesRouter);
router.use('/external', externalRouter);

router.get(
  '/reference-data',
  asyncHandler(async (req, res) => {
    const data = await referenceDataService.getAllReferenceData();
    sendSuccess(res, data);
  })
);

module.exports = router;