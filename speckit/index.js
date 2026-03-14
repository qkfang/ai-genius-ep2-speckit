#!/usr/bin/env node
'use strict';

/**
 * SpecKit CLI
 *
 * Agentic DevOps toolkit: turn application specs into GitHub Actions CI/CD pipelines.
 *
 * Commands:
 *   validate <spec>           Validate a spec file
 *   generate <spec>           Generate a GitHub Actions workflow from a spec
 *   run <spec>                Validate + generate + print summary
 *   diff <spec> <workflow>    Show what would change in an existing workflow
 */

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

const { parseSpec } = require('./lib/parser');
const { validateSpec } = require('./lib/validator');
const { generatePipeline } = require('./lib/pipeline-generator');

const VERSION = require('../package.json').version;

program
  .name('speckit')
  .description('Agentic DevOps: turn specs into CI/CD pipelines')
  .version(VERSION);

// ─── validate ────────────────────────────────────────────────────────────────
program
  .command('validate <spec>')
  .description('Validate a SpecKit spec file')
  .action((specPath) => {
    const absPath = path.resolve(specPath);
    console.log(chalk.cyan(`\n🔍 SpecKit › Validating spec: ${absPath}\n`));

    let spec;
    try {
      spec = parseSpec(absPath);
    } catch (err) {
      console.error(chalk.red(`❌ Parse error: ${err.message}`));
      process.exit(1);
    }

    const { valid, errors } = validateSpec(spec);

    if (valid) {
      console.log(chalk.green('✅ Spec is valid!'));
      console.log(chalk.grey(`   Name:    ${spec.name}`));
      console.log(chalk.grey(`   Runtime: ${spec.runtime}`));
      console.log(chalk.grey(`   Stages:  ${spec.stages.map((s) => s.name).join(' → ')}`));
    } else {
      console.error(chalk.red(`❌ Spec validation failed with ${errors.length} error(s):\n`));
      errors.forEach((e) => console.error(chalk.red(`  • ${e}`)));
      process.exit(1);
    }
  });

// ─── generate ────────────────────────────────────────────────────────────────
program
  .command('generate <spec>')
  .description('Generate a GitHub Actions workflow from a spec file')
  .option('-o, --output <file>', 'Output file path (default: stdout)')
  .option('--dry-run', 'Print the workflow without writing to disk', false)
  .action((specPath, opts) => {
    const absPath = path.resolve(specPath);
    console.log(chalk.cyan(`\n⚙️  SpecKit › Generating pipeline from: ${absPath}\n`));

    let spec;
    try {
      spec = parseSpec(absPath);
    } catch (err) {
      console.error(chalk.red(`❌ Parse error: ${err.message}`));
      process.exit(1);
    }

    const { valid, errors } = validateSpec(spec);
    if (!valid) {
      console.error(chalk.red('❌ Spec validation failed. Fix errors before generating:\n'));
      errors.forEach((e) => console.error(chalk.red(`  • ${e}`)));
      process.exit(1);
    }

    let workflow;
    try {
      workflow = generatePipeline(spec);
    } catch (err) {
      console.error(chalk.red(`❌ Generation error: ${err.message}`));
      process.exit(1);
    }

    if (opts.output && !opts.dryRun) {
      const outPath = path.resolve(opts.output);
      const outDir = path.dirname(outPath);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      fs.writeFileSync(outPath, workflow, 'utf8');
      console.log(chalk.green(`✅ Workflow written to: ${outPath}`));
      console.log(chalk.grey(`   Stages: ${spec.stages.map((s) => s.name).join(' → ')}`));
    } else {
      console.log(chalk.yellow('─── Generated Workflow ─────────────────────────────'));
      console.log(workflow);
    }
  });

// ─── run ─────────────────────────────────────────────────────────────────────
program
  .command('run <spec>')
  .description('Validate and generate a pipeline, printing a full summary')
  .action((specPath) => {
    const absPath = path.resolve(specPath);

    console.log(chalk.bold.cyan('\n╔══════════════════════════════════════╗'));
    console.log(chalk.bold.cyan('║         SpecKit — Agentic DevOps     ║'));
    console.log(chalk.bold.cyan('╚══════════════════════════════════════╝\n'));
    console.log(chalk.cyan(`📋 Processing spec: ${absPath}\n`));

    // Step 1: Parse
    let spec;
    try {
      spec = parseSpec(absPath);
      console.log(chalk.green('✅ Step 1/3 — Parse:    spec loaded successfully'));
    } catch (err) {
      console.error(chalk.red(`❌ Step 1/3 — Parse:    ${err.message}`));
      process.exit(1);
    }

    // Step 2: Validate
    const { valid, errors } = validateSpec(spec);
    if (valid) {
      console.log(chalk.green('✅ Step 2/3 — Validate: spec is valid'));
    } else {
      console.error(chalk.red('❌ Step 2/3 — Validate: spec has errors'));
      errors.forEach((e) => console.error(chalk.red(`   • ${e}`)));
      process.exit(1);
    }

    // Step 3: Generate
    let workflow;
    try {
      workflow = generatePipeline(spec);
      console.log(chalk.green('✅ Step 3/3 — Generate: pipeline generated\n'));
    } catch (err) {
      console.error(chalk.red(`❌ Step 3/3 — Generate: ${err.message}`));
      process.exit(1);
    }

    // Summary
    console.log(chalk.bold('─── Pipeline Summary ──────────────────────────────'));
    console.log(chalk.white(`  App Name:  ${spec.name}`));
    console.log(chalk.white(`  Runtime:   ${spec.runtime}${spec.runtimeVersion ? ` ${spec.runtimeVersion}` : ''}`));
    console.log(chalk.white(`  Stages:    ${spec.stages.length}`));
    spec.stages.forEach((s, i) => {
      const isLast = i === spec.stages.length - 1;
      const prefix = isLast ? '  └─' : '  ├─';
      console.log(chalk.grey(`${prefix} [${s.type.padEnd(8)}] ${s.name}`));
    });

    console.log(chalk.bold('\n─── Generated Workflow ────────────────────────────'));
    console.log(workflow);
  });

program.parse(process.argv);
