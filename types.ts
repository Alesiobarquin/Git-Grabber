export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      date: string;
      name: string;
    };
  };
  html_url: string;
}

export interface GitHubIssueOrPR {
  number: number;
  title: string;
  html_url: string;
  created_at: string;
  pull_request?: object; // If present, it's a PR
  state: string;
}

export interface ContributionItem {
  type: 'COMMIT' | 'ISSUE' | 'PR';
  url: string;
  date: string;
  description: string;
}

export interface SearchConfig {
  owner: string;
  repo: string;
  username: string;
  since: string; // YYYY-MM-DD
  branches?: string[];
  token?: string;
}