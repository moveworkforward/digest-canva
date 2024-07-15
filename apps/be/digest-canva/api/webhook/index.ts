import logger from "../../shared/logger";

export const handler = async (event: any) => {
    logger.json("Webhook event", event);
    return "OK";
};