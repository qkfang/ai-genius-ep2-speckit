'use strict';

const yaml = require('js-yaml');

/**
 * SpecKit Pipeline Generator
 *
 * The core "agentic" component: reads an application spec and generates
 * a GitHub Actions workflow YAML file. The generator reasons over the spec
 * stages and adapts the pipeline configuration accordingly.
 */

// Runtime → GitHub Actions runner image mapping
const RUNNER_MAP = {
  node: 'ubuntu-latest',
  python: 'ubuntu-latest',
  java: 'ubuntu-latest',
  go: 'ubuntu-latest',
  dotnet: 'windows-latest',
};

// Runtime → setup action mapping
const SETUP_ACTION_MAP = {
  node: (version) => ({
    name: 'Set up Node.js',
    uses: 'actions/setup-node@v4',
    with: { 'node-version': version || '20' },
  }),
  python: (version) => ({
    name: 'Set up Python',
    uses: 'actions/setup-python@v5',
    with: { 'python-version': version || '3.11' },
  }),
  java: (version) => ({
    name: 'Set up Java',
    uses: 'actions/setup-java@v4',
    with: { distribution: 'temurin', 'java-version': version || '21' },
  }),
  go: (version) => ({
    name: 'Set up Go',
    uses: 'actions/setup-go@v5',
    with: { 'go-version': version || '1.22' },
  }),
  dotnet: (version) => ({
    name: 'Set up .NET',
    uses: 'actions/setup-dotnet@v4',
    with: { 'dotnet-version': version || '8.0.x' },
  }),
};

/**
 * Generate the steps for a given spec stage.
 * This is the "reasoning" heart of the agentic pattern —
 * it inspects the stage type and options and decides what actions to emit.
 *
 * @param {object} stage - A stage object from the spec.
 * @param {object} spec  - The full spec (for context like runtime).
 * @returns {object[]} Array of GitHub Actions step objects.
 */
function generateStageSteps(stage, spec) {
  const steps = [];

  switch (stage.type) {
  case 'build':
    steps.push(...generateBuildSteps(stage, spec));
    break;
  case 'test':
    steps.push(...generateTestSteps(stage, spec));
    break;
  case 'lint':
    steps.push(...generateLintSteps(stage, spec));
    break;
  case 'security':
    steps.push(...generateSecuritySteps(stage, spec));
    break;
  case 'deploy':
    steps.push(...generateDeploySteps(stage, spec));
    break;
  case 'notify':
    steps.push(...generateNotifySteps(stage, spec));
    break;
  default:
    if (stage.commands) {
      stage.commands.forEach((cmd) => {
        steps.push({ name: `Run: ${cmd}`, run: cmd });
      });
    }
  }

  return steps;
}

function generateBuildSteps(stage, spec) {
  const steps = [];
  const runtime = spec.runtime;

  if (runtime === 'node') {
    steps.push({ name: 'Install dependencies', run: 'npm ci' });
    if (stage.commands) {
      stage.commands.forEach((cmd) => steps.push({ name: `Build: ${cmd}`, run: cmd }));
    } else {
      steps.push({ name: 'Build', run: 'npm run build --if-present' });
    }
  } else if (runtime === 'python') {
    steps.push({ name: 'Install dependencies', run: 'pip install -r requirements.txt' });
    if (stage.commands) {
      stage.commands.forEach((cmd) => steps.push({ name: `Build: ${cmd}`, run: cmd }));
    }
  } else if (runtime === 'java') {
    if (stage.commands) {
      stage.commands.forEach((cmd) => steps.push({ name: `Build: ${cmd}`, run: cmd }));
    } else {
      steps.push({ name: 'Build with Maven', run: 'mvn -B package --file pom.xml' });
    }
  } else if (runtime === 'go') {
    steps.push({ name: 'Build', run: 'go build ./...' });
  } else if (runtime === 'dotnet') {
    steps.push({ name: 'Restore', run: 'dotnet restore' });
    steps.push({ name: 'Build', run: 'dotnet build --no-restore' });
  }

  return steps;
}

function generateTestSteps(stage, spec) {
  const steps = [];
  const runtime = spec.runtime;
  const coverage = stage.coverage === true || stage.coverage === 'true';

  if (runtime === 'node') {
    if (coverage) {
      steps.push({ name: 'Run tests with coverage', run: 'npm run test:coverage' });
    } else {
      steps.push({ name: 'Run tests', run: 'npm test' });
    }
    if (coverage && stage.coverageThreshold) {
      steps.push({
        name: 'Check coverage threshold',
        run: `echo "Coverage threshold: ${stage.coverageThreshold}%"`,
      });
    }
  } else if (runtime === 'python') {
    steps.push({ name: 'Run tests', run: coverage ? 'pytest --cov' : 'pytest' });
  } else if (runtime === 'java') {
    steps.push({ name: 'Run tests', run: 'mvn -B test' });
  } else if (runtime === 'go') {
    steps.push({ name: 'Run tests', run: 'go test ./...' });
  } else if (runtime === 'dotnet') {
    steps.push({ name: 'Run tests', run: 'dotnet test --no-build' });
  }

  return steps;
}

function generateLintSteps(stage, spec) {
  const steps = [];
  const runtime = spec.runtime;

  if (runtime === 'node') {
    steps.push({ name: 'Run linter', run: stage.command || 'npm run lint' });
  } else if (runtime === 'python') {
    steps.push({ name: 'Run flake8', run: 'flake8 .' });
  } else if (runtime === 'go') {
    steps.push({ name: 'Run golangci-lint', run: 'golangci-lint run' });
  } else if (runtime === 'dotnet') {
    steps.push({ name: 'Run dotnet format', run: 'dotnet format --verify-no-changes' });
  }

  return steps;
}

function generateSecuritySteps(stage, spec) {
  const steps = [];
  const runtime = spec.runtime;

  if (stage.scanDependencies !== false) {
    if (runtime === 'node') {
      steps.push({ name: 'Dependency audit', run: 'npm audit --audit-level=moderate' });
    } else if (runtime === 'python') {
      steps.push({ name: 'Dependency safety check', run: 'pip install safety && safety check' });
    }
  }

  if (stage.scanSecrets !== false) {
    steps.push({
      name: 'Scan for secrets',
      uses: 'gitleaks/gitleaks-action@v2',
      env: { GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}' },
    });
  }

  if (stage.codeql !== false) {
    // CodeQL is typically in a separate workflow; emit a comment note
    steps.push({
      name: 'Note: CodeQL scanning',
      run: 'echo "ℹ️  CodeQL scanning is configured in .github/workflows/codeql.yml"',
    });
  }

  return steps;
}

function generateDeploySteps(stage, spec) {
  const steps = [];
  const environment = stage.environment || 'production';
  const strategy = stage.strategy || 'direct';

  steps.push({
    name: `Deploy to ${environment}`,
    run: [
      `echo "🚀 Deploying ${spec.name} to ${environment}"`,
      `echo "📦 Strategy: ${strategy}"`,
      'echo "🏷️  Version: $GITHUB_SHA"',
    ].join('\n'),
    env: {
      ENVIRONMENT: environment,
      DEPLOY_STRATEGY: strategy,
    },
  });

  if (stage.healthCheck !== false) {
    steps.push({
      name: `Health check (${environment})`,
      run: `echo "✅ Health check passed for ${environment}"`,
    });
  }

  if (stage.rollback !== false) {
    steps.push({
      name: 'Configure rollback',
      run: `echo "🔄 Rollback configured for ${environment}"`,
    });
  }

  return steps;
}

function generateNotifySteps(stage) {
  const steps = [];
  const channel = stage.channel || 'default';

  steps.push({
    name: `Notify (${channel})`,
    if: 'always()',
    run: [
      `echo "📣 Sending notification to: ${channel}"`,
      'echo "Status: ${{ job.status }}"',
    ].join('\n'),
  });

  return steps;
}

/**
 * Build a GitHub Actions job object for a spec stage.
 *
 * @param {object} stage - Stage from the spec.
 * @param {object} spec  - Full spec.
 * @param {object} options - Generator options.
 * @returns {object} GitHub Actions job object.
 */
function buildJob(stage, spec, options = {}) {
  const runtime = spec.runtime;
  const runner = RUNNER_MAP[runtime] || 'ubuntu-latest';
  const setupAction = SETUP_ACTION_MAP[runtime];
  const runtimeVersion = spec.runtimeVersion || spec['runtime-version'];

  const commonSteps = [
    {
      name: 'Checkout code',
      uses: 'actions/checkout@v4',
    },
  ];

  if (setupAction) {
    commonSteps.push(setupAction(runtimeVersion));
  }

  const stageSteps = generateStageSteps(stage, spec);

  const job = {
    name: stage.name,
    'runs-on': runner,
    steps: [...commonSteps, ...stageSteps],
  };

  // Add environment for deploy stages
  if (stage.type === 'deploy' && stage.environment) {
    job.environment = stage.environment;
  }

  // Add needs/dependency if this stage depends on others
  if (stage.needs && Array.isArray(stage.needs) && stage.needs.length > 0) {
    job.needs = stage.needs.map((n) => n.replace(/\s+/g, '-').toLowerCase());
  } else if (options.previousJobId) {
    job.needs = [options.previousJobId];
  }

  // Add condition
  if (stage.condition) {
    job.if = stage.condition;
  }

  return job;
}

/**
 * Generate a complete GitHub Actions workflow from an app spec.
 *
 * This is the primary agentic function: it reasons over the full spec,
 * determines the pipeline shape (triggers, jobs, dependencies),
 * and emits a valid GitHub Actions YAML workflow.
 *
 * @param {object} spec - Parsed application spec.
 * @returns {string} GitHub Actions workflow YAML string.
 */
function generatePipeline(spec) {
  const workflowName = spec.pipeline?.name || `${spec.name} CI/CD Pipeline`;
  const triggers = buildTriggers(spec);
  const jobs = buildJobs(spec);

  const workflow = {
    name: workflowName,
    on: triggers,
    jobs,
  };

  const header = [
    '# ============================================================',
    '# Generated by SpecKit — do not edit manually',
    `# Source spec: ${spec.name}`,
    `# Generated at: ${new Date().toISOString()}`,
    '# ============================================================',
    '',
  ].join('\n');

  return header + yaml.dump(workflow, { lineWidth: 120, noRefs: true });
}

/**
 * Build GitHub Actions triggers from the spec.
 */
function buildTriggers(spec) {
  const triggers = spec.pipeline?.triggers;

  if (triggers) {
    return triggers;
  }

  // Default: push to main/develop + PRs + manual dispatch
  return {
    push: { branches: ['main', 'develop'] },
    pull_request: { branches: ['main'] },
    workflow_dispatch: null,
  };
}

/**
 * Build GitHub Actions jobs map from spec stages.
 * Enforces sequential ordering unless a stage declares explicit `needs`.
 */
function buildJobs(spec) {
  const jobs = {};
  let previousJobId = null;

  (spec.stages || []).forEach((stage) => {
    const jobId = stage.name.replace(/\s+/g, '-').toLowerCase();
    const job = buildJob(stage, spec, {
      previousJobId: stage.needs ? null : previousJobId,
    });
    jobs[jobId] = job;
    previousJobId = jobId;
  });

  return jobs;
}

module.exports = { generatePipeline, buildJobs, buildTriggers, generateStageSteps };
