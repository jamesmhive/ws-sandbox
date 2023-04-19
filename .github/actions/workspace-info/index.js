import path from 'path';
const core = require('@actions/core');
import {
  createProcessRunner,
  readJsonFile,
  startAction,
} from '../../utils/action-utils.js';

const GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE;
const INPUT_SHA = process.env.INPUT_SHA;

const run = createProcessRunner({cwd: GITHUB_WORKSPACE});

void startAction(main);

async function main() {
  // important:
  //
  // the GitHub workflow must checkout with a fetch depth so a diff can be performed
  //
  // uses: actions/checkout@v3
  //      with:
  //          fetch-depth: 2
  //
  // might be able to get around this by checking out the commit in this action

  console.log(`Running git diff for SHA ${INPUT_SHA}`);
  const gitdiff = await run(
    'git ',
    ['diff', '--name-only', `${INPUT_SHA}..${INPUT_SHA}~`],
    {
      shell: true,
    },
  );

  const filesChanged = gitdiff.stdout.split('\n');
  const packagesChanged = filesChanged.filter((change) =>
    change.endsWith('package.json'),
  );

  if (packagesChanged.length === 0) {
    throw new Error(
      `Commit ${INPUT_SHA} does not contain any changes to package.json`,
    );
  }

  if (packagesChanged.length > 1) {
    throw new Error(
      `Commit ${INPUT_SHA} contains more than 1 package.json change`,
    );
  }

  const packagePath = path.join(
    GITHUB_WORKSPACE,
    packagesChanged[0].toString(),
  );
  console.log(`package.json changed in this commit: ${packagePath}`);

  console.log('Reading package.json');
  const packageJson = await readJsonFile(packagePath);

  const workspaceName = getPackageNameNoScope(packageJson.name);
  const workspaceDir = path.dirname(packagePath);

  const {publishTarget} = packageJson.meta ?? {};

  core.setOutput('package-name', packageJson.name);
  core.setOutput('package-version', packageJson.version);
  core.setOutput('workspace-name', workspaceName);
  core.setOutput('workspace-dir', workspaceDir);
  core.setOutput('publish-target', publishTarget);
}


export function getPackageNameNoScope(packageName) {
  const n = packageName.indexOf('/');
  return n === -1 ? packageName : packageName.substring(n + 1);
}
