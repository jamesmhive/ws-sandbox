import {startAction} from '../../utils/action-utils.js';

const INPUT_PULL_REQUEST_TITLE = process.env.INPUT_PULL_REQUEST_TITLE;
const PR_TITLE_CRITERIA = [
  {
    description: 'Version bump pull request starting with "BUMP!"',
    test: /^BUMP!\s/,
  },
  {
    description: 'JIRA ticket in the form of "IHS-#######"',
    test: /^IHS-([0-9])+\s/,
  },
];

void startAction(() => {
  const satisfiesCriteria = PR_TITLE_CRITERIA.some((criteria) => {
    criteria.test.test(INPUT_PULL_REQUEST_TITLE);
  });
  if (!satisfiesCriteria) {
    printErrorMessageDetails();
    throw new Error(`Invalid pull request title. See log for details.`);
  }
});

function printErrorMessageDetails() {
  const message = [
    `Pull request title "${INPUT_PULL_REQUEST_TITLE}" does not match PR title criteria.`,
    `Titles must match one of the following:`,
  ];
  PR_TITLE_CRITERIA.forEach((criteria) => {
    message.push(`\n${criteria.description}`);
    message.push(`\t${criteria.test}`);
  });
  console.error(message.join('\n'));
}