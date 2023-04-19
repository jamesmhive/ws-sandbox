import path from 'path';
import {
  createProcessRunner,
  getPackageNameNoScope, logError,
  readJsonFile,
  startAction,
} from '../../utils/action-utils.js';

const PublishTarget = Object.freeze({
  AWS_BUCKET: 'AWS_BUCKET',
  GITHUB_PACKAGES: 'GITHUB_PACKAGES',
});

const GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE;
const GITHUB_ACTOR = process.env.GITHUB_ACTOR;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
const INPUT_SHA = process.env.INPUT_SHA;
const INPUT_TAG = process.env.INPUT_TAG;
const INPUT_MESSAGE = process.env.INPUT_MESSAGE;
const INPUT_EMAIL = process.env.INPUT_EMAIL;
const INPUT_USER = process.env.INPUT_USER;

const run = createProcessRunner({cwd: GITHUB_WORKSPACE});

void startAction(main);

export async function main() {
  console.log(`Creating tag "${INPUT_TAG}"`);

  await run('git', ['config', 'user.name', `"${INPUT_USER}"`]);

  await run('git', [
    'config',
    'user.email',
    `'${INPUT_EMAIL}'`,
  ]);

  const repository = `https://${GITHUB_ACTOR}:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git`;
  await run('git', [
    'tag',
    '-a',
    INPUT_TAG,
    INPUT_SHA,
    '-m',
    INPUT_MESSAGE, //`${pkg.name} v${pkg.version}`,
  ]);

  console.log('Pushing tag to repository');
  await run('git', ['push', repository, '--tags']);
}
