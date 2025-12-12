import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

interface UpstreamRepoState {
  url: string;
  path: string;
  lastSyncedCommit: string | null;
}

interface SyncFile {
  [repoKey: string]: UpstreamRepoState | undefined;
}

interface RepoReport {
  repoKey: string;
  url: string;
  path: string;
  exists: boolean;
  isGitRepo: boolean;
  defaultBranch: string | null;
  remoteHead: string | null;
  lastSyncedCommit: string | null;
  commits: Array<{ sha: string; subject: string }> | null;
  diffStat: string | null;
  nextSteps: string[];
}

function usage(): never {
  // Keep this minimal: users typically run `--help` in a terminal.
  // eslint-disable-next-line no-console
  console.log(
    [
      'Usage:',
      '  bun monorepo/regent-sdk/scripts/upstream-report.ts [--clone] [--json] [--limit N] [--repo <lucid-agents|agent0-ts>] [--mark-synced <repoKey>]',
      '',
      'Defaults:',
      '  - fetches origin and reports commits since lastSyncedCommit (if configured), otherwise last N commits',
      '',
      'State file:',
      '  monorepo/regent-sdk/upstream-sync.json',
    ].join('\n')
  );
  process.exit(1);
}

function parseArgs(argv: string[]) {
  const args = new Map<string, string | boolean>();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token?.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    const hasValue = next != null && !next.startsWith('--');
    args.set(key, hasValue ? next : true);
    if (hasValue) i += 1;
  }
  return {
    clone: args.get('clone') === true,
    json: args.get('json') === true,
    help: args.get('help') === true,
    repo: typeof args.get('repo') === 'string' ? String(args.get('repo')) : null,
    limit:
      typeof args.get('limit') === 'string' ? Number(args.get('limit')) : 20,
    markSynced:
      typeof args.get('mark-synced') === 'string'
        ? String(args.get('mark-synced'))
        : null,
  };
}

function runGit(cwd: string, gitArgs: string[]) {
  const result = Bun.spawnSync(['git', ...gitArgs], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
    env: process.env,
  });
  const stdout = result.stdout.toString().trim();
  const stderr = result.stderr.toString().trim();
  if (result.exitCode !== 0) {
    const cmd = ['git', ...gitArgs].join(' ');
    throw new Error(
      `Command failed (exit=${result.exitCode}): ${cmd}\n` +
        (stderr ? `\n${stderr}` : '')
    );
  }
  return stdout;
}

function tryRunGit(cwd: string, gitArgs: string[]) {
  try {
    return runGit(cwd, gitArgs);
  } catch {
    return null;
  }
}

function readSyncFile(filePath: string): SyncFile {
  if (!existsSync(filePath)) return {};
  try {
    const raw = readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as SyncFile;
  } catch {
    return {};
  }
}

function writeSyncFile(filePath: string, next: SyncFile) {
  writeFileSync(filePath, JSON.stringify(next, null, 2) + '\n', 'utf8');
}

function splitLines(value: string | null): string[] {
  if (!value) return [];
  return value
    .split('\n')
    .map(line => line.trimEnd())
    .filter(Boolean);
}

function parseOnelineLog(lines: string[]): Array<{ sha: string; subject: string }> {
  return lines
    .map(line => {
      const [sha, ...rest] = line.trim().split(' ');
      if (!sha) return null;
      return { sha, subject: rest.join(' ').trim() };
    })
    .filter((entry): entry is { sha: string; subject: string } => Boolean(entry));
}

const DEFAULT_REPOS: Record<string, UpstreamRepoState> = {
  'lucid-agents': {
    url: 'https://github.com/daydreamsai/lucid-agents.git',
    path: 'lucid-agents',
    lastSyncedCommit: null,
  },
  'agent0-ts': {
    url: 'https://github.com/agent0lab/agent0-ts.git',
    path: 'agent0-ts',
    lastSyncedCommit: null,
  },
};

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) usage();
  if (!Number.isFinite(opts.limit) || opts.limit <= 0) {
    throw new Error(`Invalid --limit: ${opts.limit}`);
  }

  const rootDir = path.resolve(import.meta.dir, '..');
  const syncPath = path.join(rootDir, 'upstream-sync.json');
  const sync = { ...DEFAULT_REPOS, ...readSyncFile(syncPath) } as SyncFile;

  const requestedRepoKeys = opts.repo ? [opts.repo] : Object.keys(DEFAULT_REPOS);

  const reports: RepoReport[] = [];

  for (const repoKey of requestedRepoKeys) {
    const state = sync[repoKey];
    if (!state) {
      reports.push({
        repoKey,
        url: '',
        path: '',
        exists: false,
        isGitRepo: false,
        defaultBranch: null,
        remoteHead: null,
        lastSyncedCommit: null,
        commits: null,
        diffStat: null,
        nextSteps: [
          `Unknown repoKey "${repoKey}". Valid: ${Object.keys(DEFAULT_REPOS).join(', ')}`,
        ],
      });
      continue;
    }

    const localPath = path.join(rootDir, state.path);
    let exists = existsSync(localPath);
    let isGitRepo = existsSync(path.join(localPath, '.git'));

    const nextSteps: string[] = [];

    if (!exists) {
      nextSteps.push(
        `Clone upstream repo: git clone ${state.url} ${state.path} (or re-run with --clone).`
      );
    } else if (!isGitRepo) {
      nextSteps.push(
        `Directory exists but is not a git repo: "${state.path}". Move it aside, then clone (or delete it if it's a stub).`
      );
    }

    if (opts.clone && (!exists || !isGitRepo)) {
      const parentDir = path.dirname(localPath);
      if (!existsSync(parentDir)) {
        throw new Error(`Missing parent directory: ${parentDir}`);
      }

      // Ensure destination is empty if it exists.
      if (exists && !isGitRepo) {
        throw new Error(
          `Refusing to clone into non-git directory "${state.path}". Move it aside first.`
        );
      }

      if (!exists) {
        runGit(rootDir, ['clone', '--filter=blob:none', state.url, state.path]);
      }

      // Recompute after cloning.
      exists = existsSync(localPath);
      isGitRepo = existsSync(path.join(localPath, '.git'));
    }

    let defaultBranch: string | null = null;
    let remoteHead: string | null = null;
    let commits: Array<{ sha: string; subject: string }> | null = null;
    let diffStat: string | null = null;

    if (existsSync(localPath) && existsSync(path.join(localPath, '.git'))) {
      // Fetch updates.
      runGit(localPath, ['fetch', '--prune', '--tags', 'origin']);

      const originHead = tryRunGit(localPath, [
        'symbolic-ref',
        'refs/remotes/origin/HEAD',
      ]);
      if (originHead) {
        const parts = originHead.split('/');
        defaultBranch = parts[parts.length - 1] ?? null;
      }

      if (defaultBranch) {
        remoteHead = runGit(localPath, ['rev-parse', `origin/${defaultBranch}`]);
      }

      const since = state.lastSyncedCommit;
      if (defaultBranch && remoteHead) {
        if (since) {
          const logRaw = runGit(localPath, [
            'log',
            '--oneline',
            `${since}..origin/${defaultBranch}`,
          ]);
          commits = parseOnelineLog(splitLines(logRaw));
          diffStat =
            tryRunGit(localPath, [
              'diff',
              '--stat',
              `${since}..origin/${defaultBranch}`,
            ]) ?? null;
        } else {
          const logRaw = runGit(localPath, [
            'log',
            `-n`,
            String(opts.limit),
            '--oneline',
            `origin/${defaultBranch}`,
          ]);
          commits = parseOnelineLog(splitLines(logRaw));
          diffStat = null;
          nextSteps.push(
            `Set a baseline commit in upstream-sync.json (lastSyncedCommit) to get range-based diffs.`
          );
        }

        if (opts.markSynced && opts.markSynced === repoKey) {
          sync[repoKey] = {
            ...state,
            lastSyncedCommit: remoteHead,
          };
          writeSyncFile(syncPath, sync);
          nextSteps.push(
            `Updated upstream-sync.json: ${repoKey}.lastSyncedCommit = ${remoteHead}`
          );
        }
      }
    }

    // Map upstream → internal fork for humans.
    if (repoKey === 'lucid-agents') {
      nextSteps.push(
        'Apply relevant changes to: monorepo/regent-sdk/regent-sdk/'
      );
    }
    if (repoKey === 'agent0-ts') {
      nextSteps.push(
        'Apply relevant changes to: monorepo/regent-sdk/regent-sdk/packages/erc8004/'
      );
    }

    reports.push({
      repoKey,
      url: state.url,
      path: state.path,
      exists,
      isGitRepo,
      defaultBranch,
      remoteHead,
      lastSyncedCommit: state.lastSyncedCommit,
      commits,
      diffStat,
      nextSteps,
    });
  }

  if (opts.json) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ generatedAt: new Date().toISOString(), reports }, null, 2));
    return;
  }

  for (const report of reports) {
    // eslint-disable-next-line no-console
    console.log(`\n== ${report.repoKey} ==`);
    // eslint-disable-next-line no-console
    console.log(`url: ${report.url}`);
    // eslint-disable-next-line no-console
    console.log(`path: ${report.path}`);
    // eslint-disable-next-line no-console
    console.log(`git: ${report.isGitRepo ? 'yes' : 'no'}`);
    // eslint-disable-next-line no-console
    console.log(`defaultBranch: ${report.defaultBranch ?? '(unknown)'}`);
    // eslint-disable-next-line no-console
    console.log(`remoteHead: ${report.remoteHead ?? '(unknown)'}`);
    // eslint-disable-next-line no-console
    console.log(`lastSyncedCommit: ${report.lastSyncedCommit ?? '(unset)'}`);

    if (report.commits?.length) {
      // eslint-disable-next-line no-console
      console.log(`\nCommits (${report.commits.length}):`);
      for (const c of report.commits) {
        // eslint-disable-next-line no-console
        console.log(`- ${c.sha} ${c.subject}`);
      }
    } else {
      // eslint-disable-next-line no-console
      console.log('\nCommits: (none or repo missing)');
    }

    if (report.diffStat) {
      // eslint-disable-next-line no-console
      console.log('\nDiffstat:\n' + report.diffStat);
    }

    if (report.nextSteps.length) {
      // eslint-disable-next-line no-console
      console.log('\nNext steps:');
      for (const step of report.nextSteps) {
        // eslint-disable-next-line no-console
        console.log(`- ${step}`);
      }
    }
  }
}

main();


