module.exports = (milliseconds) => {
  const safeMs = Math.max(0, Number(milliseconds) || 0);
  const hours = Math.floor(safeMs / 3600000);
  const minutes = Math.floor((safeMs % 3600000) / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
};
