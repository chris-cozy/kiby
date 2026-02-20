const { AttachmentBuilder } = require("discord.js");
const path = require("path");
const getAllFiles = require("./getAllFiles");

const mediaCache = new Map();
const VALID_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
]);

function toCategoryPath(category) {
  return path.join(__dirname, "..", "media", category);
}

function isValidMediaFile(filePath) {
  const fileName = path.basename(filePath);
  if (fileName.startsWith(".")) {
    return false;
  }

  return VALID_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

function loadCategory(category) {
  if (mediaCache.has(category)) {
    return mediaCache.get(category);
  }

  const mediaRoot = toCategoryPath(category);
  let files = [];
  try {
    files = getAllFiles(mediaRoot)
      .filter(isValidMediaFile)
      .map((filePath) => ({
        name: path.basename(filePath),
        path: filePath,
      }));
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  mediaCache.set(category, files);
  return files;
}

module.exports = async (category = "info", options = {}) => {
  const fallbackCategory = options.fallbackCategory || "";
  let files = loadCategory(category);
  let selectedCategory = category;

  if (!files.length && fallbackCategory && fallbackCategory !== category) {
    files = loadCategory(fallbackCategory);
    selectedCategory = fallbackCategory;
  }

  if (!files.length) {
    throw new Error(`No media files available for category: ${category}`);
  }

  const selected = files[Math.floor(Math.random() * files.length)];

  return {
    name: selected.name,
    path: selected.path,
    category: selectedCategory,
    attachment: new AttachmentBuilder(selected.path),
  };
};
