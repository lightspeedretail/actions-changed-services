# Changed Services

Determines the changed services in a Lerna monorepo, and divides them across runner nodes.

Note: We're waiting for GitHub to support required checks for changes scoped to particular paths. Once this is supported, we can split the workflow into how many ever services exist in a Lerna monorepo.

## Getting Started

We'll set-up the workflow to run on a matrix of 4 runners, and run a lint job across these nodes.

```yaml
name: Lint Parallel
on: [pull_request]
jobs:
  run:
    name: Run
    runs-on: ubuntu-latest
    strategy:
      matrix:
        build_node_index: [1, 2, 3, 4]
        build_node_total: [4]
    steps:
      - name: Checkout
        uses: actions/checkout@v1

      - name: Changed
        uses: lightspeedretail/actions-changed-services@v1.0.0
        env:
          BUILD_NODE_INDEX: ${{ matrix.build_node_index }}
          BUILD_NODE_TOTAL: ${{ matrix.build_node_total }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Install Root
        run: yarn

      - name: Install Apps
        run: |
          for PACKAGE in $(echo $CHANGED_PACKAGES); do
            yarn --cwd ./packages/$PACKAGE
          done;

      - name: Lint
        run: |
          for PACKAGE in $(echo $CHANGED_PACKAGES); do
            yarn --cwd ./packages/$PACKAGE lint
          done;
```