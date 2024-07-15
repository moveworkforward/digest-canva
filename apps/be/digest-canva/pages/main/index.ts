import { baseTemplate } from "../base-template";
import * as handlebars from "handlebars";
import { getResources } from "../resources";
import { StageType } from "../../shared/consts";
import { logger } from "../../shared/logger";
import { generateLoginUrl } from "../../shared/services/canva";

const compiledTemplate = handlebars.compile(baseTemplate());

const stage = process.env.STAGE as StageType;
const domain = process.env.DOMAIN as string;

export const handler = async (event: any) => {
    logger.json("Main page event", event);

    const scriptUrls = getResources(stage, domain);
    const loginUrl = await generateLoginUrl();

    return compiledTemplate({ scriptUrls, loginUrl });
};
