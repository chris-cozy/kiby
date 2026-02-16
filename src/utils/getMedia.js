const { AttachmentBuilder } = require("discord.js");
const path = require("path");
const getAllFiles = require("./getAllFiles");

const mediaCache = new Map();

function loadCategory(category) {
  if (mediaCache.has(category)) {
    return mediaCache.get(category);
  }

  const mediaRoot = path.join(__dirname, "..", "media", category);
  const files = getAllFiles(mediaRoot).map((filePath) => ({
    name: path.basename(filePath),
    path: filePath,
  }));

  mediaCache.set(category, files);
  return files;
}

module.exports = async (category = "portrait") => {
  const files = loadCategory(category);

  if (!files.length) {
    throw new Error(`No media files available for category: ${category}`);
  }

  const selected = files[Math.floor(Math.random() * files.length)];

  return {
    name: selected.name,
    path: selected.path,
    attachment: new AttachmentBuilder(selected.path),
  };
};
