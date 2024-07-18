/* eslint-disable no-case-declarations */
import { StageType } from "../../shared/consts";
import logger from "../../shared/logger";
import { DigestCanvaRepository } from "../../shared/repository/digest-canva";
import { sendEmail } from "../../shared/email";
import { Canva } from "../../shared/models/canva";
import axios from "axios";
import { CanvaClient } from "../../shared/services/canva";
import { EmailBuilder } from "./email-builder";

const digestCanvaRepository = new DigestCanvaRepository(process.env.STAGE as StageType);

const USER_EVENTS = [
    Canva.NotificationType.DesignAccessRequested,
    Canva.NotificationType.Comment, 
    Canva.NotificationType.ShareDesign,
];

export const handler = async () => {
    const users = await digestCanvaRepository.getCanvaUsers();

    for (const user of users) {
        try {
            if (!user.refreshToken) {
                continue;
            }
            const notifications = await digestCanvaRepository.getCanvaUserNotifications(user.userId);
            logger.json("User notifications for " + user.email, notifications);

            if (notifications.length === 0) {
                continue;
            }

            const canvaClient = new CanvaClient(user);
            await canvaClient.refreshToken();

            const emailBuilder = new EmailBuilder();
            emailBuilder.addHeader(user.displayName);

            const uniqueDesignIds = Array.from(new Set(notifications.map((n) => n.designId).filter((d) => !!d)));
            const designs: Record<string, Canva.Design> = {};

            await Promise.all(uniqueDesignIds.map(async (designId) => {
                const design = await canvaClient.getDesign(designId!);
                if (!design?.thumbnail?.url) {
                    return;
                }
                const res = await axios.get(design.thumbnail.url || "", { responseType: "arraybuffer" });

                emailBuilder.addDesignAttachment(design, res.data);

                designs[designId!] = design;
            }));

            USER_EVENTS.forEach((event) => {
                switch (event) {
                case Canva.NotificationType.DesignAccessRequested:
                    const accessRequestedNotifications = notifications.filter((n) => n.type === Canva.NotificationType.DesignAccessRequested);
                    if (accessRequestedNotifications.length === 0) {
                        return;
                    }
                    emailBuilder.addSectionTitle("Access requests and invitations", accessRequestedNotifications.length);

                    accessRequestedNotifications.forEach((n) => {
                        const content = JSON.parse(n.data) as Canva.DesignAccessRequestedNotificationContent;
                        emailBuilder.addDesignSection({
                            design: designs[n.designId!], 
                            content, 
                            createdAt: n.createdAt,
                            action: "Requests access",
                        });
                    });
                    break;
                case Canva.NotificationType.Comment:
                    const commentNotifications = notifications.filter((n) => n.type === Canva.NotificationType.Comment);
                    if (commentNotifications.length === 0) {
                        return;
                    }
                    emailBuilder.addSectionTitle("New comments and replies", commentNotifications.length);

                    const commentNotificationsGroupedByDesign = commentNotifications.reduce((acc, n) => {
                        if (!acc[n.designId!]) {
                            acc[n.designId!] = [];
                        }
                        acc[n.designId!].push(n.data);
                        return acc;
                    }, {} as Record<string, string[]>);

                    Object.keys(commentNotificationsGroupedByDesign).forEach((designId) => {
                        const notifications = commentNotificationsGroupedByDesign[designId].map((n) => JSON.parse(n) as Canva.CommentNotificationContent);
                        emailBuilder.addCommentsDesignSection(designs[designId], notifications);
                    });
                    break;
                case Canva.NotificationType.ShareDesign:
                    const sharingNotifications = notifications.filter((n) => n.type === Canva.NotificationType.ShareDesign);
                    if (sharingNotifications.length === 0) {
                        return;
                    }

                    emailBuilder.addSectionTitle("Sharings", sharingNotifications.length);

                    sharingNotifications.forEach((n) => {
                        const content = JSON.parse(n.data) as Canva.ShareDesignNotificationContent;
                        emailBuilder.addDesignSection({
                            design: designs[n.designId!], 
                            content, 
                            createdAt: n.createdAt,
                            action: "Shared",
                            note: content.share?.message,
                        });
                    });
                    break;
                }
            });


            await sendEmail({
            //to: user.email,
                to: "natalia@moveworkforward.com",
                subject: "Digest",
                html: emailBuilder.build(),
                attachments: emailBuilder.getAttachments(),
            });
        } catch (e) {
            logger.error("Error sending email to " + user.email);
            logger.error(e);

        }
    }

    return "OK";
};