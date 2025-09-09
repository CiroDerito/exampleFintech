export const externalApisConfig = {
  prefect: {
    baseUrl: process.env.PREFECT_API_URL || 'https://api.prefect.cloud',
    apiKey: process.env.PREFECT_API_KEY,
    workspaceId: process.env.PREFECT_WORKSPACE_ID,
    flowId: process.env.PREFECT_SCORE_FLOW_ID,
  },
  bigquery: {
    projectId: process.env.BIGQUERY_PROJECT_ID,
    dataset: process.env.BIGQUERY_DATASET || 'fintech_scores',
    table: process.env.BIGQUERY_TABLE || 'user_scores',
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  },
  github: {
    token: process.env.GITHUB_TOKEN,
    repo: process.env.GITHUB_REPO,
    workflowId: process.env.GITHUB_WORKFLOW_ID || 'daily-score-sync.yml',
  },
};
