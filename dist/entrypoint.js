"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const getChangedPackages = () => __awaiter(void 0, void 0, void 0, function* () {
    const token = process.env.GITHUB_TOKEN;
    const octokit = new github.GitHub(token);
    const { data: files } = yield octokit.pulls.listFiles(Object.assign(Object.assign({}, github.context.repo), { 
        // pull_number: github.context.payload!.pull_request!.number,
        pull_number: 1418 }));
    // @TODO This assumes standard structure of lerna monorepos
    const allFilenames = files.map(file => file.filename);
    const packageFilenames = allFilenames.filter(filename => filename.startsWith('packages/'));
    const packages = Array.from(new Set(packageFilenames.map(filename => filename.split('/')[1])));
    core.info(`📦 Changed packages: ${packages}`);
    return packages;
});
const splitAcrossNodes = (packages) => {
    let packagesForNode = [];
    if (!process.env.BUILD_NODE_INDEX || !process.env.BUILD_NODE_TOTAL) {
        packagesForNode = packages;
    }
    else {
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
