import { test, expect } from '../fixtures';
import { ScoreCalculatorPage } from '../../pages/ScoreCalculatorPage';
import { createOnboardedStudent } from '../../utils/testUser';

// Reference: Student sheet (Stage_TestCase_E2E, final), TC-STU-067 (Smoke)
// "Complete Score Calculator V2 end-to-end" - renumbered from an earlier
// draft's TC-STU-072. An earlier sheet draft documented this as Blocked -
// Listening, Reading and Writing all completed successfully, but Speaking
// couldn't be tested because the automation environment had no
// microphone. Confirmed live this suite's environment (launchOptions
// fake-device flags + granted mic permission in playwright.config.ts)
// doesn't have that limitation, so this test goes all the way through to
// a completed score report.
test.describe('Score Calculator', () => {
  test('TC-STU-067: Student completes the Score Calculator (V2) and receives a score report', { tag: '@smoke' }, async ({ page }) => {
    test.setTimeout(180_000);

    await createOnboardedStudent(page, 'e2e.stu.scorecalc');

    const scoreCalculatorPage = new ScoreCalculatorPage(page);
    await scoreCalculatorPage.goto();
    await scoreCalculatorPage.startPlacementTest();
    await scoreCalculatorPage.completeSystemRequirementChecker();
    await scoreCalculatorPage.completeAndSubmitAllQuestions();

    // Expected result: the student finishes the Score Calculator and gets a
    // score report.
    await expect(page.getByText(/well done on completing the score calculator/i)).toBeVisible({ timeout: 20_000 });
    await scoreCalculatorPage.viewResults();
    await expect(scoreCalculatorPage.resultHeading).toBeVisible({ timeout: 20_000 });
    await expect(scoreCalculatorPage.overallScoreHeading).toBeVisible();
  });
});
