'use strict';

const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const { parseSpec, parseSpecs } = require('../speckit/lib/parser');
const { validateSpec, VALID_RUNTIMES, VALID_STAGE_TYPES } = require('../speckit/lib/validator');
const { generatePipeline, buildTriggers } = require('../speckit/lib/pipeline-generator');

const SPEC_PATH = path.resolve(__dirname, '../specs/app.spec.yaml');

// ─────────────────────────────────────────────────────────────────────────────
// Parser tests
// ─────────────────────────────────────────────────────────────────────────────
describe('SpecKit — Parser', () => {
  it('should parse the real spec file without errors', () => {
    expect(() => parseSpec(SPEC_PATH)).not.toThrow();
  });

  it('should return an object with required fields', () => {
    const spec = parseSpec(SPEC_PATH);
    expect(spec).toHaveProperty('name');
    expect(spec).toHaveProperty('runtime');
    expect(spec).toHaveProperty('stages');
  });

  it('should throw when file does not exist', () => {
    expect(() => parseSpec('/nonexistent/spec.yaml')).toThrow('Spec file not found');
  });

  it('should throw for invalid YAML', () => {
    const tmpFile = path.join(__dirname, '__tmp_invalid.yaml');
    fs.writeFileSync(tmpFile, ': invalid: yaml: {{{', 'utf8');
    try {
      expect(() => parseSpec(tmpFile)).toThrow('Failed to parse spec YAML');
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it('should throw for empty file', () => {
    const tmpFile = path.join(__dirname, '__tmp_empty.yaml');
    fs.writeFileSync(tmpFile, '', 'utf8');
    try {
      expect(() => parseSpec(tmpFile)).toThrow('Spec file is empty or invalid');
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it('should merge multiple spec files with parseSpecs', () => {
    const tmpFile = path.join(__dirname, '__tmp_extra.yaml');
    fs.writeFileSync(tmpFile, 'extra: value\n', 'utf8');
    try {
      const merged = parseSpecs([SPEC_PATH, tmpFile]);
      expect(merged).toHaveProperty('name');
      expect(merged).toHaveProperty('extra', 'value');
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Validator tests
// ─────────────────────────────────────────────────────────────────────────────
describe('SpecKit — Validator', () => {
  it('should pass for the real spec file', () => {
    const spec = parseSpec(SPEC_PATH);
    const { valid, errors } = validateSpec(spec);
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it('should fail when name is missing', () => {
    const spec = { runtime: 'node', stages: [{ name: 'Build', type: 'build' }] };
    const { valid, errors } = validateSpec(spec);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('"name"'))).toBe(true);
  });

  it('should fail when runtime is missing', () => {
    const spec = { name: 'test', stages: [{ name: 'Build', type: 'build' }] };
    const { valid, errors } = validateSpec(spec);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('"runtime"'))).toBe(true);
  });

  it('should fail for an unsupported runtime', () => {
    const spec = {
      name: 'test',
      runtime: 'ruby',
      stages: [{ name: 'Build', type: 'build' }],
    };
    const { valid, errors } = validateSpec(spec);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('Invalid runtime'))).toBe(true);
  });

  it('should fail when stages is empty', () => {
    const spec = { name: 'test', runtime: 'node', stages: [] };
    const { valid, errors } = validateSpec(spec);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('"stages"'))).toBe(true);
  });

  it('should fail when a stage is missing its name', () => {
    const spec = { name: 'test', runtime: 'node', stages: [{ type: 'build' }] };
    const { valid, errors } = validateSpec(spec);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('"name"'))).toBe(true);
  });

  it('should fail when a stage has an invalid type', () => {
    const spec = {
      name: 'test',
      runtime: 'node',
      stages: [{ name: 'Custom', type: 'invalid-type' }],
    };
    const { valid, errors } = validateSpec(spec);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('invalid type'))).toBe(true);
  });

  it('should fail when a deploy stage has no environment', () => {
    const spec = {
      name: 'test',
      runtime: 'node',
      stages: [{ name: 'Deploy', type: 'deploy' }],
    };
    const { valid, errors } = validateSpec(spec);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('environment'))).toBe(true);
  });

  it('should export VALID_RUNTIMES and VALID_STAGE_TYPES', () => {
    expect(Array.isArray(VALID_RUNTIMES)).toBe(true);
    expect(VALID_RUNTIMES).toContain('node');
    expect(Array.isArray(VALID_STAGE_TYPES)).toBe(true);
    expect(VALID_STAGE_TYPES).toContain('deploy');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Generator tests
// ─────────────────────────────────────────────────────────────────────────────
describe('SpecKit — Pipeline Generator', () => {
  let spec;

  beforeEach(() => {
    spec = parseSpec(SPEC_PATH);
  });

  it('should generate valid YAML from the real spec', () => {
    const output = generatePipeline(spec);
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  it('should include the pipeline name in the generated YAML', () => {
    const output = generatePipeline(spec);
    expect(output).toContain(spec.pipeline.name);
  });

  it('should include all stage names as job IDs', () => {
    const output = generatePipeline(spec);
    spec.stages.forEach((stage) => {
      const jobId = stage.name.replace(/\s+/g, '-').toLowerCase();
      expect(output).toContain(jobId + ':');
    });
  });

  it('should include the checkout action in every job', () => {
    const output = generatePipeline(spec);
    expect(output).toContain('actions/checkout@v4');
  });

  it('should use the correct setup action for node runtime', () => {
    const output = generatePipeline(spec);
    expect(output).toContain('actions/setup-node@v4');
  });

  it('should generate valid YAML that can be parsed back', () => {
    const output = generatePipeline(spec);
    // Remove the header comment lines
    const yamlOnly = output.replace(/^#.*$/gm, '').trim();
    expect(() => yaml.load(yamlOnly)).not.toThrow();
  });

  it('should include npm ci in build jobs', () => {
    const buildStages = spec.stages.filter((s) => s.type === 'build');
    expect(buildStages.length).toBeGreaterThan(0);
    const output = generatePipeline(spec);
    expect(output).toContain('npm ci');
  });

  it('should include npm test in test jobs', () => {
    const output = generatePipeline(spec);
    expect(output).toContain('npm');
    expect(output).toContain('test');
  });

  it('should generate deploy jobs with environment field', () => {
    const output = generatePipeline(spec);
    const parsed = yaml.load(output.replace(/^#.*$/gm, '').trim());
    const jobIds = Object.keys(parsed.jobs);
    const deployJobId = jobIds.find((id) => id.includes('deploy'));
    expect(deployJobId).toBeDefined();
    expect(parsed.jobs[deployJobId]).toHaveProperty('environment');
  });

  it('should generate jobs with needs for sequential ordering', () => {
    const output = generatePipeline(spec);
    const parsed = yaml.load(output.replace(/^#.*$/gm, '').trim());
    const jobs = parsed.jobs;
    const jobIds = Object.keys(jobs);
    // Second job onwards should have a needs field
    jobIds.slice(1).forEach((id) => {
      expect(jobs[id]).toHaveProperty('needs');
    });
  });

  it('should use default triggers when spec has no pipeline.triggers', () => {
    const minSpec = { name: 'test', runtime: 'node', stages: [{ name: 'Build', type: 'build' }] };
    const triggers = buildTriggers(minSpec);
    expect(triggers).toHaveProperty('push');
    expect(triggers).toHaveProperty('pull_request');
    expect(triggers).toHaveProperty('workflow_dispatch');
  });

  it('should use spec-defined triggers when present', () => {
    const triggers = buildTriggers(spec);
    expect(triggers).toHaveProperty('push');
    expect(triggers.push.branches).toContain('main');
  });

  it('should generate valid pipeline for all supported runtimes', () => {
    const runtimes = ['node', 'python', 'java', 'go', 'dotnet'];
    runtimes.forEach((runtime) => {
      const minSpec = {
        name: `test-${runtime}`,
        runtime,
        stages: [
          { name: 'Build', type: 'build' },
          { name: 'Test', type: 'test' },
        ],
      };
      expect(() => generatePipeline(minSpec)).not.toThrow();
      const output = generatePipeline(minSpec);
      expect(output.length).toBeGreaterThan(0);
    });
  });
});
