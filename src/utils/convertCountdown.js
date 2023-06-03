/**
 * @brief Convert milliseconds to a HH MM SS format
 * @param {Number} milliseconds
 * @return A string containing the HH MM SS format
 */
module.exports = (milliseconds) => {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor(((milliseconds % 360000) % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
}