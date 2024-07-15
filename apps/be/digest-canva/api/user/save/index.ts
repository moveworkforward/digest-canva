import { sendUserDigest } from "../../../shared/services/user-digest";
import logger from "../../../shared/logger";
import { DigestCanvaRepository } from "../../../shared/repository/digest-canva";
import { verifyJwt } from "../../../shared/services/jwt-verifier";
import { getDemoNotifications } from "./demo-notifications";
import { StageType } from "../../../shared/consts";

export const handler = async (event: any) => {
    logger.json("Update user configuration event", event);
    try {
        const jwt = event.headers.Authorization.split(" ")[1];
        const verified = await verifyJwt(jwt);

        const digestCanvaRepository = new DigestCanvaRepository(process.env.STAGE as StageType);

        const userMapping = await digestCanvaRepository.getCanvaAddonUserMapping(verified.userId);
        if (!userMapping) {
            throw new Error("User mapping not found");
        }

        const configuration = event.body;

        const user = await digestCanvaRepository.updateCanvaUserConfiguration(userMapping.connectUserId, configuration);
        if (!user) {
            throw new Error("User not found");
        }

        const notifications = getDemoNotifications(user);

        await sendUserDigest(user, notifications, true);

        return { ...user, refreshToken: "****" };
    } catch (error) {
        logger.error("Update user configuration error", error);
        return null;
    }
};
