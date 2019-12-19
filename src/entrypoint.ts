import * as core from '@actions/core';
import * as github from '@actions/github';

const getChangedPackages = async () => {
  const token = process.env.GITHUB_TOKEN!;
  const octokit = new github.GitHub(token);

  const { data: files } = await octokit.pulls.listFiles({
    ...github.context.repo,
    pull_number: github.context.payload!.pull_request!.number,
  });

  // @TODO This assumes standard structure of lerna monorepos
  const allFilenames = files.map(file => file.filename);
  const packageFilenames = allFilenames.filter(filename => filename.startsWith('packages/'));
  const packages = Array.from(new Set(packageFilenames.map(filename => filename.split('/')[1])));

  core.info(`📦 Changed packages: ${packages}`);
  return packages;
};

const splitAcrossNodes = (packages: string[]) => {
  let packagesForNode: string[] = [];

  if (!process.env.BUILD_NODE_INDEX || ! process.env.BUILD_NODE_TOTAL) {
    packagesForNode = packages;
  } else {
    const nodeIndex = parseInt(process.env.BUILD_NODE_INDEX, 10) - 1;
    const nodeTotal = parseInt(process.env.BUILD_NODE_TOTAL, 10);
    packagesForNode = packages.filter((_, index) => index % nodeTotal === nodeIndex);
  }

  core.info(`📦 Changed packages on node: ${packagesForNode}`);
  core.exportVariable('CHANGED_PACKAGES', packagesForNode.join(','));
  return packagesForNode;
};

getChangedPackages()
  .then(splitAcrossNodes)
  .catch(error => {
    core.setFailed(`❌ Job failed: ${error.message}`);
  });
