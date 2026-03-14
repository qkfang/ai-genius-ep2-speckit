'use strict';

const fs = require('fs');
const yaml = require('js-yaml');

/**
 * SpecKit Parser
 * Reads and parses application and pipeline specification YAML files.
 */

/**
 * Load and parse a YAML spec file.
 * @param {string} filePath - Absolute or relative path to the spec file.
 * @returns {object} Parsed spec object.
 */
function parseSpec(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Spec file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf8');

  let parsed;
  try {
    parsed = yaml.load(raw);
  } catch (err) {
    throw new Error(`Failed to parse spec YAML at ${filePath}: ${err.message}`);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Spec file is empty or invalid: ${filePath}`);
  }

  return parsed;
}

/**
 * Load multiple spec files and merge them.
 * @param {string[]} filePaths - Array of spec file paths.
 * @returns {object} Merged spec object.
 */
function parseSpecs(filePaths) {
  return filePaths.reduce((merged, filePath) => {
    const spec = parseSpec(filePath);
    return { ...merged, ...spec };
  }, {});
}

module.exports = { parseSpec, parseSpecs };
