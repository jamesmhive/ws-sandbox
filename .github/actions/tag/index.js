import path from 'path';
import {
  createProcessRunner,
  getPackageNameNoScope,
  readJsonFile,
  startAction,
} from '../../utils/action-utils.js';

const GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE;
const GITHUB_ACTOR = process.env.GITHUB_ACTOR;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
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

  const changedPackage = path.join(
    GITHUB_WORKSPACE,
    packagesChanged[0].toString(),
  );
  console.log(`package.json changed in this commit: ${changedPackage}`);

  console.log('Reading package.json');
  const pkg = await readJsonFile(changedPackage);
  console.log(`package.name: ${pkg.name}`);
  console.log(`package.version: ${pkg.version}`);

  const tagName = `${getPackageNameNoScope(pkg.name)}/v${pkg.version}`;
  console.log(`Creating tag "${tagName}"`);

  await run('git', ['config', 'user.name', `"bumpbot"`]);

  await run('git', [
    'config',
    'user.email',
    `'bumpbot@users.noreply.github.com'`,
  ]);

  const repository = `https://${GITHUB_ACTOR}:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git`;
  await run('git', [
    'tag',
    '-a',
    tagName,
    INPUT_SHA,
    '-m',
    `${pkg.name} v${pkg.version}`,
  ]);

  console.log('Pushing tag to repository');
  await run('git', ['push', repository, '--tags']);
}
