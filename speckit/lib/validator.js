'use strict';

/**
 * SpecKit Validator
 * Validates that spec files conform to the expected schema.
 */

const REQUIRED_APP_SPEC_FIELDS = ['name', 'runtime', 'stages'];
const VALID_RUNTIMES = ['node', 'python', 'java', 'go', 'dotnet'];
const VALID_STAGE_TYPES = ['build', 'test', 'lint', 'security', 'deploy', 'notify'];

/**
 * Validate an application spec object.
 * @param {object} spec - Parsed spec object.
 * @returns {{ valid: boolean, errors: string[] }} Validation result.
 */
function validateSpec(spec) {
  const errors = [];

  // Check required top-level fields
  for (const field of REQUIRED_APP_SPEC_FIELDS) {
    if (!spec[field]) {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  // Validate runtime
  if (spec.runtime && !VALID_RUNTIMES.includes(spec.runtime)) {
    errors.push(
      `Invalid runtime "${spec.runtime}". Must be one of: ${VALID_RUNTIMES.join(', ')}`
    );
  }

  // Validate stages
  if (spec.stages) {
    if (!Array.isArray(spec.stages)) {
      errors.push('"stages" must be an array');
    } else if (spec.stages.length === 0) {
      errors.push('"stages" must contain at least one stage');
    } else {
      spec.stages.forEach((stage, i) => {
        if (!stage.name) {
          errors.push(`Stage[${i}] is missing required field "name"`);
        }
        if (!stage.type) {
          errors.push(`Stage[${i}] ("${stage.name || i}") is missing required field "type"`);
        } else if (!VALID_STAGE_TYPES.includes(stage.type)) {
          errors.push(
            `Stage[${i}] ("${stage.name || i}") has invalid type "${stage.type}". ` +
            `Must be one of: ${VALID_STAGE_TYPES.join(', ')}`
          );
        }
      });
    }
  }

  // Validate deploy stage requirements
  if (spec.stages && Array.isArray(spec.stages)) {
    const deployStages = spec.stages.filter((s) => s.type === 'deploy');
    deployStages.forEach((stage) => {
      if (!stage.environment) {
        errors.push(`Deploy stage "${stage.name}" must specify an "environment"`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = { validateSpec, VALID_RUNTIMES, VALID_STAGE_TYPES };
