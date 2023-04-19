import {spawn} from 'child_process';
import {readFile} from 'fs/promises';

export async function startAction(main) {
  try {
    await main();
  } catch (error) {
    logError(error);
    process.exitCode = 1;
  }
}

/** Returns a function that wraps child_process.spawn()
 *
 * @param {object} defaultSpawnOptions - default options when spawn() is called
 * @return {function(command: string, args: any[], options?: any): Promise<any>} - the run function
 */
export function createProcessRunner(defaultSpawnOptions) {
  return function run(command, args, options) {
    return new Promise((resolve, reject) => {
      // nosemgrep: javascript.lang.security.detect-child-process.detect-child-process
      const child = spawn(command, args, {...defaultSpawnOptions, ...options});
      let childDidError = false;
      const stdout = [];
      const stderr = [];
      child.stdout.on('data', (chunk) => stdout.push(chunk.toString()));
      child.stderr.on('data', (chunk) => stderr.push(chunk.toString()));
      const stdoutAsString = () => stdout.join('\n').trim();
      const stderrAsString = () => stderr.join('\n').trim();
      child.on('error', (error) => {
        if (!childDidError) {
          childDidError = true;
          console.log(stdoutAsString());
          console.error(stderrAsString());
          reject(error);
        }
      });
      child.on('exit', (exitCode) => {
        if (!childDidError) {
          if (exitCode === 0) {
            resolve({stdout: stdoutAsString()});
          } else {
            console.log(stdoutAsString());
            reject(
              new Error(
                `${command} exited with code ${exitCode}: \n ${stderrAsString()}`,
              ),
            );
          }
        }
      });
    });
  };
}

export function logError(error) {
  console.error(`✖ ERROR \n${error.stack || error}`);
}

export async function readJsonFile(filePath) {
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export function getPackageNameNoScope(packageName) {
  const n = packageName.indexOf('/');
  return n === -1 ? packageName : packageName.substring(n + 1);
}
