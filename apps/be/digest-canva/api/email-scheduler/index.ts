import { sendUserDigest } from "../../shared/services/user-digest";
import { StageType } from "../../shared/consts";
import { DigestCanvaRepository } from "../../shared/repository/digest-canva";
import logger from "../../shared/logger";

const digestCanvaRepository = new DigestCanvaRepository(process.env.STAGE as StageType);

export const handler = async () => {
    const users = await digestCanvaRepository.getCanvaUsers();

    for (const user of users) {
        // TODO: check if it's the time to send the digest
        if (!user.refreshToken || !user.configuration) {
            return;
        }
        const notifications = await digestCanvaRepository.getCanvaUserNotifications(user.userId);
        logger.json("User notifications for " + user.configuration.email, notifications);
        
        if (notifications.length === 0) {
            return;
        }
        await sendUserDigest(user, notifications);
    }

    return "OK";
};