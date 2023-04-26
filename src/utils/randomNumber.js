
/**
 * @brief Calculate a random number between the bounds
 * @param {Number} min 
 * @param {Number} max 
 * @return A number between the range
 */
module.exports = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}