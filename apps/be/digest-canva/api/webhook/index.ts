/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-case-declarations */
import { StageType } from "../../shared/consts";
import logger from "../../shared/logger";
import { Canva, CanvaDigest } from "../../shared/models/canva";
import { DigestCanvaRepository } from "../../shared/repository/digest-canva";

const digestCanvaRepository = new DigestCanvaRepository(process.env.STAGE as StageType);

export const handler = async (event: any) => {
    logger.json("Webhook event", event);

    const webhookNotification = event.body as Canva.WebhookNotification;
    let userNotification: CanvaDigest.UserNotification | null = null;

    switch (webhookNotification.content.type) {
    case Canva.NotificationType.Comment:
        const { content, created_at } = webhookNotification;
        const userId = content.receiving_team_user.user_id;
        if (!userId) {
            logger.error("User id not found");
            return;
        }
        const digetsUser = await digestCanvaRepository.getCanvaUser(userId);
        if (!digetsUser) {
            logger.error("User not found");
            return;
        }
        userNotification = {
            userId: digetsUser.userId,
            createdAt: created_at,
            designId: content.design.id!,
            type: Canva.NotificationType.Comment,
            data: JSON.stringify(content),
        };
        
        break;
    default:
        logger.info("Unsupported notification type");
        return;
    }

    if (!userNotification) {
        return;
    }

    await digestCanvaRepository.createCanvaUserNotification(userNotification);

    return "OK";
};