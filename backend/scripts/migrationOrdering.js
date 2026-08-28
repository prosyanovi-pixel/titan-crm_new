function getMigrationSequence(filename) {
  const match = filename.match(/^(\d+)/);
  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  return Number.parseInt(match[1], 10);
}

function compareMigrationFilenames(a, b) {
  const sequenceDiff = getMigrationSequence(a) - getMigrationSequence(b);
  if (sequenceDiff !== 0) {
    return sequenceDiff;
  }

  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

module.exports = {
  compareMigrationFilenames,
  getMigrationSequence,
};
