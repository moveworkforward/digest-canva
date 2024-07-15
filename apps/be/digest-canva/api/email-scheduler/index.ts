import { sendUserDigest } from "../../shared/services/user-digest";
import { StageType } from "../../shared/consts";
import { DigestCanvaRepository } from "../../shared/repository/digest-canva";
import logger from "../../shared/logger";
import { CanvaDigest } from "../../shared/models/canva";

const digestCanvaRepository = new DigestCanvaRepository(process.env.STAGE as StageType);

export const handler = async () => {
    const users = await digestCanvaRepository.getCanvaUsers();

    for (const user of users) {
        if (!user.refreshToken || !user.configuration) {
            return;
        }

        const { repetition, timezone: timezoneOffset, time: hour } = user.configuration;

        const nowInUserTimezone = new Date(Date.now() - +timezoneOffset * 60000);
        const curDayOfWeek = nowInUserTimezone.getDay();
        const firstWeek = new Date(nowInUserTimezone.getFullYear(), 0, nowInUserTimezone.getDay());
        const diff = nowInUserTimezone.getTime() - firstWeek.getTime();
        const curWeek = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));

        const curHour = nowInUserTimezone.getHours();

        if (repetition === CanvaDigest.EmailRepetition.Weekly && curDayOfWeek !== 0) {
            return;
        }

        if (repetition === CanvaDigest.EmailRepetition.BiWeekly && curDayOfWeek !== 0 && curWeek % 2 !== 0) {
            return;
        }

        if (curHour !== hour) {
            return;
        }

        const notifications = await digestCanvaRepository.getCanvaUserNotifications(user.userId, user.configuration.repetition);
        logger.json("User notifications for " + user.configuration.email, notifications);
        
        if (notifications.length === 0) {
            return;
        }
        await sendUserDigest(user, notifications);
    }

    return "OK";
};