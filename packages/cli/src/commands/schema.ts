import { readFile } from 'node:fs/promises';
import pc from 'picocolors';
import { loadWorkflow } from '../workflow/loader.js';
import { projectPaths } from '../workflow/paths.js';

export async function schemaShowCommand(): Promise<void> {
  const paths = projectPaths(process.cwd());
  const raw = await readFile(paths.workflowFile, 'utf8');
  process.stdout.write(raw);
}

export async function schemaValidateCommand(): Promise<void> {
  const paths = projectPaths(process.cwd());
  try {
    const wf = await loadWorkflow(paths.workflowFile);
    console.log(`${pc.green('✓')} workflow.yaml is valid`);
    console.log(`  steps: ${wf.steps.length}`);
    const enabled = wf.steps.filter((s) => s.enabled !== false).length;
    console.log(`  enabled: ${enabled}`);
    const required = wf.steps.filter((s) => !s.removable).length;
    console.log(`  required (removable: false): ${required}`);
  } catch (e) {
    console.error(`${pc.red('✗')} ${(e as Error).message}`);
    process.exitCode = 1;
  }
}
