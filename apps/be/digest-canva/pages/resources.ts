
import { StageType } from "../shared/consts";
import { logger } from "../shared/logger";

// THIS FILE IS GENERATED, DO NOT CHANGE IT BY HAND

export function getResources(stage: StageType, domain: string): string[] {
    logger.debug(`Getting resource urls for stage[${stage}] domain[${domain}]`);

    const resourcesForStage: Record<StageType, string[]> = {
        prod: [
            `https://fe-digest-canva.${domain}/js/main.e6a5d00b.js`,
        ],
        test: [
            `https://fe-digest-canva.${domain}/js/2.b5ea9514.chunk.js`,
            `https://fe-digest-canva.${domain}/js/main.4e3bd376.chunk.js`,
            `https://fe-digest-canva.${domain}/js/runtime-main.dafe41f8.js`,
        ],
        dev: [
            `https://s3.amazonaws.com/fe-digest-canva.${domain}/js/main.b3b34ead.js`,
        ],
        personal: [
            `https://s3.amazonaws.com/fe-digest-canva.${domain}/js/main.3ead06d5.js`,
        ],
        local: [],
    };

    if (resourcesForStage[stage] === undefined || resourcesForStage[stage]?.length === 0) {
        throw new Error(`There are no resources configured for stage[${stage}] and domain[${domain}]`);
    }

    return resourcesForStage[stage];
}
