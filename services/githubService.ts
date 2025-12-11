import { ContributionItem, GitHubCommit, GitHubIssueOrPR, SearchConfig } from '../types';

const BASE_URL = 'https://api.github.com';

/**
 * Fetches commits from a specific repository authored by the user.
 * Supports multiple branches.
 */
async function fetchCommits(config: SearchConfig): Promise<ContributionItem[]> {
  const { owner, repo, username, since, token, branches } = config;
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  // Helper to fetch for a single branch (or default if branch is undefined)
  const fetchForBranch = async (branchName?: string): Promise<GitHubCommit[]> => {
    let url = `${BASE_URL}/repos/${owner}/${repo}/commits?author=${username}&since=${since}&per_page=100`;
    
    if (branchName) {
      url += `&sha=${encodeURIComponent(branchName)}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("GitHub API rate limit exceeded. Please provide a Personal Access Token.");
      }
      if (response.status === 404) {
        const branchMsg = branchName ? ` or Branch '${branchName}'` : '';
        throw new Error(`Repository, User${branchMsg} not found. Check your spelling.`);
      }
      throw new Error(`GitHub Error: ${response.statusText}`);
    }

    return response.json();
  };

  let rawCommits: GitHubCommit[] = [];

  if (!branches || branches.length === 0) {
    // Fetch default branch
    rawCommits = await fetchForBranch();
  } else {
    // Fetch all specified branches in parallel
    const results = await Promise.all(branches.map(b => fetchForBranch(b)));
    rawCommits = results.flat();
  }

  // Deduplicate commits based on SHA (as the same commit might exist in multiple branches)
  const uniqueCommitsMap = new Map<string, GitHubCommit>();
  rawCommits.forEach(commit => {
    if (!uniqueCommitsMap.has(commit.sha)) {
      uniqueCommitsMap.set(commit.sha, commit);
    }
  });

  const uniqueCommits = Array.from(uniqueCommitsMap.values());

  return uniqueCommits.map((commit) => ({
    type: 'COMMIT',
    url: commit.html_url,
    date: commit.commit.author.date,
    description: commit.commit.message,
  }));
}

/**
 * Fetches Issues and Pull Requests created by the user in the repository.
 */
async function fetchIssuesAndPRs(config: SearchConfig): Promise<ContributionItem[]> {
  const { owner, repo, username, since, token } = config;
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  // Use the search API for issues and PRs
  const query = `repo:${owner}/${repo} author:${username} created:>=${since}`;
  const url = `${BASE_URL}/search/issues?q=${encodeURIComponent(query)}&per_page=100`;

  const response = await fetch(url, { headers });

  if (!response.ok) {
     if (response.status === 403) {
      throw new Error("GitHub API rate limit exceeded. Please provide a Personal Access Token.");
    }
    throw new Error(`GitHub Error: ${response.statusText}`);
  }

  const data = await response.json();
  const items: GitHubIssueOrPR[] = data.items || [];

  return items.map((item) => ({
    type: item.pull_request ? 'PR' : 'ISSUE',
    url: item.html_url,
    date: item.created_at,
    description: item.title,
  }));
}

/**
 * Main aggregator function.
 */
export async function fetchAllContributions(config: SearchConfig): Promise<ContributionItem[]> {
  // Run fetches in parallel
  const [commits, issuesAndPrs] = await Promise.all([
    fetchCommits(config),
    fetchIssuesAndPRs(config)
  ]);

  const allItems = [...commits, ...issuesAndPrs];

  // Sort by date descending (newest first)
  return allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}