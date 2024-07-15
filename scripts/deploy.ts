import { program } from "commander";
import * as shell from "shelljs";
import { v4 as random_uuid } from "uuid";

if (!shell.which("aws")) {
    shell.echo("Sorry, this script requires aws");
    shell.exit(1);
}
if (!shell.which("git")) {
    shell.echo("Sorry, this script requires git");
    shell.exit(1);
}

// Get CLI Arguments
program
    .version("0.1.0")
    .option("-a, --application [application]", "Application to deploy")
    .option("-func, --func <func>", "Function name")
    .parse(process.argv);

const cliArguments = program.opts();
const options = {
    application: `${cliArguments.application}`,
    func: `${cliArguments.func}`,
    awsAccountId: `${process.env.AWS_ACCOUNT_ID}`,
    awsProfile: `${process.env.AWS_PROFILE}`,
    awsRegion: `${process.env.REGION}`,
    domain: `${process.env.DOMAIN}`,
    stage: `${process.env.STAGE}`,
};

if (!options.application) {
    console.error("Application was not provided.");
}

console.log(`Deploying App=${options.application}, Stage=${options.stage}, Region=${options.awsRegion}, Domain=${options.domain}, Profile=${options.awsProfile}`);

// Go to Apps Folder
const currentPath = shell.pwd();
shell.cd("apps");

// Define Apps
const sentryReleaseUuid = random_uuid();
const infraApps = [].map(name => `infra/${name}`);
const feApps = ["digest-canva"].map(name => `fe/${name}`);
const beApps = ["digest-canva"].map(name => `be/${name}`);
let appsToDeploy: string[] = [];
if (options.application) {
    // Specific infra/be/fe app to be deployed
    if (options.application.startsWith("infra/") && infraApps.includes(options.application)) {
        appsToDeploy.push(options.application);
    }
    else if (options.application.startsWith("fe/") && feApps.includes(options.application)) {
        appsToDeploy.push(options.application);
    }
    else if (options.application.startsWith("be/") && beApps.includes(options.application)) {
        appsToDeploy.push(options.application);
    }
    // Potentially fe + be app to be deployed together
    else {
        if (infraApps.includes(`infra/${options.application}`)) {
            appsToDeploy.push(`infra/${options.application}`);
        }
        if (feApps.includes(`fe/${options.application}`)) {
            appsToDeploy.push(`fe/${options.application}`);
        }
        if (beApps.includes(`be/${options.application}`)) {
            appsToDeploy.push(`be/${options.application}`);
        }
    }
}
else {
    appsToDeploy = [...infraApps, ...feApps, ...beApps];
}
let functionName = "";
if (options.func) {
    console.log(`Deploying only 1 function - ${options.func}`);
    functionName = `function --function ${options.func}`;
}

// Deploy apps
appsToDeploy.map((appPath: string) => {
    // Set Application Name
    const appPathParts = appPath.split("/");
    const appType = appPathParts[0];
    const appId = appPathParts[1];

    // Go to Application Folder
    shell.cd(appPath); 
    
    // Install Dependencies
    const npmInstallResult = shell.exec("npm install");
    if (npmInstallResult.code !== 0) {
        shell.echo("Error installing npm packages.");
        shell.exit(1);
    }

    // Set Environment Variables
    shell.env["AWS_ACCOUNT_ID"] = options.awsAccountId;
    shell.env["AWS_PROFILE"] = options.awsProfile;
    shell.env["REGION"] = options.awsRegion;
    shell.env["DOMAIN"] = options.domain;
    shell.env["REACT_APP_DOMAIN"] = options.domain;
    shell.env["STAGE"] = options.stage;
    shell.env["SENTRY_RELEASE"] = `${options.stage}.apps.${appType}.${appId}.${sentryReleaseUuid}`;
    shell.env["SLS_DEBUG"] = "true";

    // If Front-End Application
    if (appType === "fe") {
        // Build Application
        let buildCmd = "node_modules/.bin/react-scripts build";
        if (appId === "mst-confluence") { // TODO: change mst-confluence to react-scripts & remove this check
            buildCmd = "node_modules/.bin/react-app-rewired build";
        }
        console.log("\n");
        console.log(`Building app from ${appPath} folder.`);

        const buildResult = shell.exec(buildCmd);
        if (buildResult.code !== 0) {
            shell.echo("Error building.");
            shell.exit(1);
        }

        // Generate Resources
        const generateResourceFileCommand = `"${currentPath}/node_modules/.bin/ts-node" "${currentPath}/scripts/generate-resource-file.ts" --application=${appId}`;
        shell.exec(generateResourceFileCommand);
    }

    // Package Application
    if (!functionName) {
        const packageCmd = "sls package --package=.serverless";
        console.log(`Packaging app from ${appPath} folder.`);
        const packageResult = shell.exec(packageCmd);
        if (packageResult.code !== 0) {
            shell.echo("Error packaging application.");
            shell.exit(1);
        }
    }

    if (options.stage === "prod") {
    // Push to Sentry only for backend apps app
    // TODO: remove this check once we go live with the other apps
        if (appType === "be") {
        // Create Release in Sentry
            const sentryCreateReleaseCmd = `sentry-cli releases new ${shell.env["SENTRY_RELEASE"]}`;
            const sentryCreateReleaseResult = shell.exec(sentryCreateReleaseCmd);
            if (sentryCreateReleaseResult.code !== 0) {
                shell.echo("Error creating release in Sentry.");
                shell.exit(1);
            }

            // Push Source Maps to Sentry
            const sentrySourceMapsCmd = "sentry-cli sourcemaps upload .esbuild/.build";
            const sentrySourceMapsResult = shell.exec(sentrySourceMapsCmd);
            if (sentrySourceMapsResult.code !== 0) {
                shell.echo("Error pushing source maps to Sentry.");
                shell.exit(1);
            }
        }
    }

    // Deploy Application
    if (shell.test("-e", "serverless.yml")) {
        const deployCmd = functionName ? `sls deploy ${functionName}`
            : "sls deploy --package=.serverless";
        console.log(`Deploying app from ${appPath} folder.`);
        
        const deployResult = shell.exec(deployCmd);
        if (deployResult.code !== 0) {
            shell.echo("Error deploying in AWS.");
            shell.exit(1);
        }
    }

    if (options.stage === "prod") {
    // Push to Sentry only for backend apps
    // TODO: remove this check once we go live with the other apps
        if (appType === "be") {
        // Finalize Release in Sentry
            const sentryFinalizeReleaseCmd = `sentry-cli releases finalize ${shell.env["SENTRY_RELEASE"]}`;
            const sentryFinalizeReleaseResult = shell.exec(sentryFinalizeReleaseCmd);
            if (sentryFinalizeReleaseResult.code !== 0) {
                shell.echo("Error finalizing release in Sentry.");
                shell.exit(1);
            }
        }
    }

    // Delete Build Files
    const deleteBuildFilesCmd = "rm -rf .esbuild .serverless";
    const deleteBuildFilesResult = shell.exec(deleteBuildFilesCmd);
    if (deleteBuildFilesResult.code !== 0) {
        shell.echo("Error deleting build files.");
        shell.exit(1);
    }

    // go back to the root
    shell.cd("../..");
});
