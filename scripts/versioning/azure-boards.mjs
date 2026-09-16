const DEV_AZURE_HTTPS = /^https:\/\/dev\.azure\.com\/([^/]+)\/([^/]+)(?:\/_git\/([^/?#]+))?/u;

const DEV_AZURE_SSH =
  /(?:git@ssh\.dev\.azure\.com:v3|https:\/\/ssh\.dev\.azure\.com\/v3)\/([^/]+)\/([^/]+)\/([^/]+)/u;

const VISUAL_STUDIO =
  /^https:\/\/([^.]+)\.visualstudio\.com\/(?:DefaultCollection\/)?([^/_]+)(?:\/_git\/([^/?#]+))?/u;

export function parseAzureDevOpsRemote(remoteUrl) {
  if (!remoteUrl) {
    return undefined;
  }

  const trimmed = remoteUrl.trim().replace(/\.git$/u, '');
  const httpsMatch = DEV_AZURE_HTTPS.exec(trimmed);

  if (httpsMatch) {
    return {
      organization: decodeURIComponent(httpsMatch[1] ?? ''),
      project: decodeURIComponent(httpsMatch[2] ?? ''),
      repository: decodeURIComponent(httpsMatch[3] ?? ''),
    };
  }

  const sshMatch = DEV_AZURE_SSH.exec(trimmed);

  if (sshMatch) {
    return {
      organization: decodeURIComponent(sshMatch[1] ?? ''),
      project: decodeURIComponent(sshMatch[2] ?? ''),
      repository: decodeURIComponent(sshMatch[3] ?? ''),
    };
  }

  const vsMatch = VISUAL_STUDIO.exec(trimmed);

  if (vsMatch) {
    return {
      organization: decodeURIComponent(vsMatch[1] ?? ''),
      project: decodeURIComponent(vsMatch[2] ?? ''),
      repository: decodeURIComponent(vsMatch[3] ?? ''),
    };
  }

  return undefined;
}

export function resolveAzureDevOpsContext(remoteUrl) {
  const fromRemote = parseAzureDevOpsRemote(remoteUrl);
  const organization = process.env.AZURE_DEVOPS_ORG ?? fromRemote?.organization ?? '';
  const project = process.env.AZURE_DEVOPS_PROJECT ?? fromRemote?.project ?? '';
  const repository = process.env.AZURE_DEVOPS_REPO ?? fromRemote?.repository ?? '';

  if (!organization || !project) {
    return undefined;
  }

  return { organization, project, repository };
}

export function storyUrl(storyId, context) {
  if (!context) {
    return undefined;
  }

  const template =
    process.env.AZURE_DEVOPS_STORY_URL ??
    'https://dev.azure.com/{organization}/{project}/_workitems/edit/{id}';

  return template
    .replaceAll('{organization}', encodeURIComponent(context.organization))
    .replaceAll('{org}', encodeURIComponent(context.organization))
    .replaceAll('{project}', encodeURIComponent(context.project))
    .replaceAll('{id}', storyId);
}

export function formatStoryMarkdown(storyId, context) {
  const label = `AB#${storyId}`;
  const url = storyUrl(storyId, context);

  if (!url) {
    return label;
  }

  return `[${label}](${url})`;
}
