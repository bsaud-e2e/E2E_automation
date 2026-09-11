#!/usr/bin/env node
/**
 * Reads Playwright's JSON reporter output (results.json), classifies any
 * failures via DeepSeek's chat completions API, and either posts the
 * resulting report as a PR comment (if the pushed branch has an open PR)
 * or prints it to the workflow log.
 *
 * Required env: DEEPSEEK_API_KEY, GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_REF_NAME.
 * Read-only with respect to the test suite - never touches test files or app code.
 */

const fs = require('fs');
const path = require('path');

const RESULTS_PATH = path.join(__dirname, '..', 'results.json');
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions';

const CLASSIFICATION_SYSTEM_PROMPT = `You are the MVP QA Agent for the E2 Language Playwright test project. You analyze a Playwright test run's failures and produce a concise QA report. You do not write or modify code.

Classify every failure as exactly one of:
- Automation/locator issue - a selector doesn't match current markup, a locator is ambiguous, a wait targets the wrong element.
- Timing/wait issue - a real timeout where the flow likely would have succeeded given more time.
- Test-data issue - a shared/fixture account ran out of usable state, a generated value collided, preconditions weren't met.
- Environment issue - about where the test ran, not what it tested (CI runner IP blocked, network differs from local, missing config/secrets in that environment).
- Application defect - the app actually behaved incorrectly (wrong text, broken navigation, missing element, wrong status/price, a real functional bug).

Known false positive - check first, every time: a "SecurityError: Blocked a frame with origin ... azdopl-rc-microfrontend.e2language.com ..." error when opening an Assessment is a confirmed automation-tooling artifact. Manual browser testing has proven the underlying flow works correctly. Classify any match as Environment issue, never Application defect, and say so explicitly.

Never invent a root cause the log doesn't support. A bare timeout or "element not found" gets reported as exactly that - do not guess why underneath it unless the provided error text genuinely shows a reason.

Output ONLY a Markdown report, under 250 words, in this shape:
- One line: total / passed / failed / skipped / duration.
- One bullet per failure: test id + title, classification, one-line reason (from the log, not invented), one-line suggested fix where applicable (only for Automation/locator, Timing/wait, or the known SecurityError pattern - name what's needed for Test-data/Environment issues instead of a code fix).
- Close with one line naming which failures (if any) need a human to manually re-check in a real browser before being treated as confirmed defects.

Do not add any preamble, sign-off, or commentary outside that structure.`;

function readResults() {
  if (!fs.existsSync(RESULTS_PATH)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));
}

/** Flattens Playwright's nested suite tree into one record per spec. */
function flattenSpecs(suites, file = null) {
  const specs = [];
  for (const suite of suites ?? []) {
    const currentFile = suite.file ?? file;
    for (const spec of suite.specs ?? []) {
      specs.push({ ...spec, file: currentFile });
    }
    specs.push(...flattenSpecs(suite.suites, currentFile));
  }
  return specs;
}

function summarize(results) {
  const stats = results.stats ?? {};
  const specs = flattenSpecs(results.suites);

  const failures = [];
  for (const spec of specs) {
    for (const test of spec.tests ?? []) {
      const lastResult = test.results?.[test.results.length - 1];
      if (!lastResult || lastResult.status === 'passed' || lastResult.status === 'skipped') continue;

      const errorMessage = lastResult.error?.message ?? lastResult.errors?.[0]?.message ?? '(no error message captured)';
      failures.push({
        title: spec.title,
        file: spec.file,
        status: lastResult.status,
        error: errorMessage.replace(/\[[0-9;]*m/g, '').slice(0, 1200), // strip ANSI colour codes, cap length
      });
    }
  }

  return {
    total: (stats.expected ?? 0) + (stats.unexpected ?? 0) + (stats.flaky ?? 0) + (stats.skipped ?? 0),
    passed: stats.expected ?? 0,
    failed: stats.unexpected ?? 0,
    flaky: stats.flaky ?? 0,
    skipped: stats.skipped ?? 0,
    durationMs: stats.duration ?? 0,
    failures,
  };
}

function buildDeterministicNoFailuresReport(summary) {
  const durationSec = Math.round(summary.durationMs / 1000);
  return `**QA Report** — ${summary.total} total / ${summary.passed} passed / ${summary.failed} failed / ${summary.skipped} skipped, ${durationSec}s.\n\nNo failures on this run.`;
}

async function classifyWithDeepSeek(summary) {
  const durationSec = Math.round(summary.durationMs / 1000);
  const userContent = [
    `Total: ${summary.total}, Passed: ${summary.passed}, Failed: ${summary.failed}, Skipped: ${summary.skipped}, Duration: ${durationSec}s.`,
    '',
    'Failures:',
    ...summary.failures.map(
      (f, i) => `${i + 1}. [${f.status}] ${f.title} (${f.file})\nError:\n${f.error}\n`
    ),
  ].join('\n');

  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      temperature: 0.1,
      messages: [
        { role: 'system', content: CLASSIFICATION_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`DeepSeek API returned ${response.status}: ${body.slice(0, 500)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '(DeepSeek returned no content)';
}

async function findOpenPrForBranch() {
  const repo = process.env.GITHUB_REPOSITORY;
  const branch = process.env.GITHUB_REF_NAME;
  const token = process.env.GITHUB_TOKEN;
  if (!repo || !branch || !token) return null;

  const [owner] = repo.split('/');
  const url = `https://api.github.com/repos/${repo}/pulls?state=open&head=${owner}:${branch}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) return null;
  const prs = await response.json();
  return Array.isArray(prs) && prs.length > 0 ? prs[0].number : null;
}

async function postPrComment(prNumber, body) {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  const url = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  });
  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`Failed to post PR comment: ${response.status} ${errBody.slice(0, 500)}`);
  }
}

async function main() {
  const results = readResults();
  if (!results) {
    console.log('QA Agent: results.json not found - the test run likely crashed before producing a report.');
    return;
  }

  const summary = summarize(results);
  const report =
    summary.failed === 0
      ? buildDeterministicNoFailuresReport(summary)
      : await classifyWithDeepSeek(summary);

  const prNumber = await findOpenPrForBranch();
  if (prNumber) {
    await postPrComment(prNumber, report);
    console.log(`QA Agent: posted report to PR #${prNumber}.`);
  } else {
    console.log('QA Agent: no open PR for this branch - printing report to the workflow log.\n');
  }
  console.log(report);
}

main().catch((err) => {
  console.error('QA Agent failed:', err);
  process.exitCode = 1;
});
