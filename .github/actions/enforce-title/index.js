import {startAction} from '../../utils/action-utils.js';

const INPUT_PULL_REQUEST_TITLE = process.env.INPUT_TITLE;
const PR_TITLE_CRITERIA = [
  {
    description: 'Version bump pull request starting with "BUMP!"',
    test: /^BUMP!\s/,
  },
  {
    description: 'Starts with a JIRA ticket number in the form of "IHS-#######"',
    test: /^IHS-([0-9])+\s/,
  },
];

void startAction(() => {
  const satisfiesCriteria = PR_TITLE_CRITERIA.some((criteria) => {
    return criteria.test.test(INPUT_PULL_REQUEST_TITLE);
  });
  if (!satisfiesCriteria) {
    printErrorMessageDetails();
    throw new Error(`Invalid pull request title. See log for details.`);
  }
});

function printErrorMessageDetails() {
  const message = [
    `\nPull request title "${INPUT_PULL_REQUEST_TITLE}" does not match PR title criteria.`,
    `Titles must match one of the following:`,
  ];
  PR_TITLE_CRITERIA.forEach((criteria, index) => {
    message.push(`\t${index + 1}. ${criteria.description}`);
  });
  message.push('\n');
  console.error(message.join('\n'));
}
