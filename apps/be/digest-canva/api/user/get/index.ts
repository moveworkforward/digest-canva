import { verifyJwt } from "../../../shared/services/jwt-verifier";
import logger from "../../../shared/logger";
import { DigestCanvaRepository } from "../../../shared/repository/digest-canva";
import { StageType } from "../../../shared/consts";

export const handler = async (event: any) => {
    logger.json("Get user event", event);

    try {
        const jwt = event.headers.Authorization.split(" ")[1];
        const verified = await verifyJwt(jwt);

        const digestCanvaRepository = new DigestCanvaRepository(process.env.STAGE as StageType);

        const userMapping = await digestCanvaRepository.getCanvaAddonUserMapping(verified.userId);
        if (!userMapping) {
            return null;
        }
        const user = await digestCanvaRepository.getCanvaUser(userMapping.connectUserId);
        return { ...user, refreshToken: "****" };
    } catch (error) {
        logger.error("Get user error", error);
        return null;
    }
};