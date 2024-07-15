import { program } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as handlebars from "handlebars";
import { dirname, resolve } from "path";
import * as shell from "shelljs";
import { Stage, StageType } from "../apps/be/_shared/consts";
import { logger } from "../apps/be/_shared/logger";


interface ResourcesTemplateModel {
    prodResources: string[];
    testResources: string[];
    devResources: string[];
    personalResources: string[];
}

const template = `
import { StageType } from "../shared/consts";
import { logger } from "../shared/logger";

// THIS FILE IS GENERATED, DO NOT CHANGE IT BY HAND

export function getResources(stage: StageType, domain: string): string[] {
    logger.debug(\`Getting resource urls for stage[\${stage}] domain[\${domain}]\`);

    const resourcesForStage: Record<StageType, string[]> = {
        prod: [
            {{#if prodResources}}
            {{#each prodResources}}
            \`{{this}}\`,
            {{/each}}
            {{/if}}
        ],
        test: [
            {{#if testResources}}
            {{#each testResources}}
            \`{{this}}\`,
            {{/each}}
            {{/if}}
        ],
        dev: [
            {{#if devResources}}
            {{#each devResources}}
            \`{{this}}\`,
            {{/each}}
            {{/if}}
        ],
        personal: [
            {{#if personalResources}}
            {{#each personalResources}}
            \`{{this}}\`,
            {{/each}}
            {{/if}}
        ],
        local: [],
    };

    if (resourcesForStage[stage] === undefined || resourcesForStage[stage]?.length === 0) {
        throw new Error(\`There are no resources configured for stage[\${stage}] and domain[\${domain}]\`);
    }

    return resourcesForStage[stage];
}
`;

function generateResourceFile(appId: string): string {
    const compiledTemplate = handlebars.compile(template);
    const domain = `${process.env.REACT_APP_DOMAIN}`;
    const stage = `${process.env.STAGE}` as StageType;

    let currentPath = __filename;
    currentPath = dirname(currentPath);
    currentPath = resolve(`${currentPath}/..`);

    const scripts = getScriptFiles(`${currentPath}/apps/fe/${appId}/build/static/js`);
    const resources = appendDomainToFileNames({
        appId,
        buildFolderPath: `${currentPath}/apps/fe/${appId}/build/static/js`,
        domain,
        stage,
    }, scripts);


    const resourcesFilePath = `${currentPath}/apps/be/${appId}/pages/resources.ts`;
    logger.debug(`Requiring resourcesFilePath[${resourcesFilePath}]`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getResources } = require(resourcesFilePath);

    const templateModel: ResourcesTemplateModel = {
        prodResources: replaceRealDomainsToTheDomainVariable(
            stage === Stage.Prod ? resources : getResources(Stage.Prod, domain),
            domain
        ),
        testResources: replaceRealDomainsToTheDomainVariable(
            stage === Stage.Test ? resources : getResources(Stage.Test, domain),
            domain
        ),
        devResources: replaceRealDomainsToTheDomainVariable(
            stage === Stage.Dev ? resources : getResources(Stage.Dev, domain),
            domain
        ),
        personalResources: replaceRealDomainsToTheDomainVariable(
            stage === Stage.Personal ? resources : getResources(Stage.Personal, domain),
            domain
        ),
    };

    const tsFile = compiledTemplate(templateModel);

    logger.debug(
        `>>>>>> File[${resourcesFilePath}] was generated for App: ${appId}, stage: ${stage}, domain: ${domain}.`
    );
    logger.debug("------------------------");
    logger.debug(tsFile);
    logger.debug("------------------------");

    fs.renameSync(resourcesFilePath, `${resourcesFilePath}.backup`);
    fs.writeFileSync(resourcesFilePath, tsFile);

    return tsFile;
}

function getScriptFiles(fullpath: string, subpath: string = ""): string[] {
    logger.debug(`Reading files from folder[${fullpath}]`);

    let files: string[] = [];

    for(const file of fs.readdirSync(fullpath)) {
        const filename = path.resolve(fullpath, file);
        const fsStat = fs.statSync(filename);

        if (fsStat.isDirectory()) {
            files = files.concat(getScriptFiles(`${fullpath}/${file}`, `${subpath}${file}/`));
        } else {
            files = files.concat(subpath?.length === 0 ? file : `${subpath}${file}` );
        }
    }

    return files;
}

function appendDomainToFileNames(input: {
    appId: string;
    buildFolderPath: string;
    domain: string;
    stage: StageType;
}, files: string[]) {
    const { appId, domain, stage } = input;
    return files.map(file => {

        return appendDomainToFileName({ fileName: file, stage, domain, appId });
    }).filter(v => v.endsWith(".js"));
}

export function appendDomainToFileName(input: {
    appId: string;
    domain: string;
    fileName: string;
    stage: StageType;
}): string {
    const { appId, domain, fileName, stage } = input;

    const folderNameToAppId: Record<string, string> = {
        "digest-canva": "fe-digest-canva",
    };

    const s3BucketName = `${folderNameToAppId[appId]}.${domain}`;

    let resourceUrl;

    if (stage === "prod" || stage === "test") {
        resourceUrl = `https://${s3BucketName}/js/${fileName}`;
    } else {
        resourceUrl = `https://s3.amazonaws.com/${s3BucketName}/js/${fileName}`;
    }

    const result = resourceUrl.replace(domain, "${domain}");

    logger.debug(`appendDomainToFileName appId[${appId}], domain[${domain}], stage[${stage}]: ${result}`);

    return result;
}

export function replaceRealDomainsToTheDomainVariable(fileNames: string[], domain: string): string[] {
    return fileNames.map((fileName: string) => fileName.replace(domain, "${domain}"));
}

// Get CLI Arguments
program
    .version("0.1.0")
    .option("-a, --application [application]", "Application to generate resource file for")
    .parse(process.argv);

const options = program.opts();
if (!options.application) {
    console.error("Application was not provided.");
    shell.exit(1);
}

generateResourceFile(options.application);
