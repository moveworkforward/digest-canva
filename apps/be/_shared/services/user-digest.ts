
/* eslint-disable no-case-declarations */
import logger from "../logger";
import { sendEmail } from "../email";
import { Canva } from "../models/canva";
import axios from "axios";
import { CanvaClient } from "./canva";
import { EmailBuilder } from "./email-builder";
import { CanvaDigest } from "../models/canva";

// eslint-disable-next-line @typescript-eslint/naming-convention
const REPETITION_HUMANIAZED: Record<CanvaDigest.EmailRepetition, string> = {
    [CanvaDigest.EmailRepetition.Daily]: "24 hours",
    [CanvaDigest.EmailRepetition.Weekly]: "week",
    [CanvaDigest.EmailRepetition.BiWeekly]: "two weeks",
};

export const userAvatarAttachments = {
    "Tanya Bohutska": {
        url: "https://avatar.canva.com/avatars/users/a08e1fee-5143-43e5-9344-7fee01728cb0/200.png",
        filename: "tanya_bohutska.png",
        cid: "tanya_bohutska",
    },
    "Chad Sajovic": {
        url: "https://avatar.canva.com/avatars/users/e8a8ec67-3e07-4a34-8343-91b4dffd082d/200.jpg",   
        filename: "chad_sajovic.jpg",
        cid: "chad_sajovic",
    },
};

export const sendUserDigest = async (user: CanvaDigest.CanvaUser, notifications: CanvaDigest.UserNotification[], isPreview?: boolean) => {
    try {
        const configuration = user.configuration;

        if (!configuration) {
            logger.error("User configuration not found");
            return;
        }

        const canvaClient = new CanvaClient(user.userId);
        await canvaClient.refreshToken();

        const emailBuilder = new EmailBuilder();
        const title = isPreview ? 
            `${user.displayName}, this is a preview digest!` : 
            `${user.displayName}, your Canva digest is ready!`;
        const subTitle = isPreview ? 
            `Actual one will be sent tomorrow at ${configuration.time % 12}:00${configuration.time > 12 ? " PM" : " AM"}` : 
            `Configuration dates: last ${REPETITION_HUMANIAZED[configuration.repetition]}`;

        emailBuilder.addHeader(title, subTitle);

        const aiText = isPreview ?
            "We’re using an AI to provide you an update summary so you can save your time for something really important." :
            `<span>Some of your teammates request access from you.<br>And also, you'll be happy to know your design </span><span class="color-285fdf" style="font-size: 14px; font-weight: 500; color: #285fdf; text-align: left; line-height: 20px; mso-line-height-rule: exactly">My dream car was</span><span> approved ✅.<br>However your design </span><span class="color-285fdf" style="font-size: 14px; font-weight: 500; color: #285fdf; text-align: left; line-height: 20px; mso-line-height-rule: exactly">My dream dog</span><span> was rejected ❌, luckily Chad provided a comment.<br>As for comments</span><span class="color-285fdf" style="font-size: 14px; font-weight: 500; color: #285fdf; text-align: left; line-height: 20px; mso-line-height-rule: exactly"> My dream car</span><span> and </span><span class="color-285fdf" style="font-size: 14px; font-weight: 500; color: #285fdf; text-align: left; line-height: 20px; mso-line-height-rule: exactly">My dream dog</span><span> got several new ones.<br>Regarding other things there are also new sharings. </span>`;
        
        emailBuilder.addAISection(aiText);

        const uniqueDesignIds: string[] = Array.from(new Set(notifications.map((n) => n.designId))).filter((d) => d !== undefined);
        const designs: Record<string, Canva.Design> = {};

        await Promise.all(uniqueDesignIds.map(async (designId) => {
            const design = await canvaClient.getDesign(designId);
            logger.json("Design for " + designId, design);
            if (design?.thumbnail?.url) {
                const res = await axios.get(design.thumbnail.url || "", { responseType: "arraybuffer" });
                emailBuilder.addDesignAttachment(design, res.data);
            }
            
            designs[designId] = design;
        }));

        await Promise.all(Object.keys(userAvatarAttachments).map(async (name) => {
            const res = await axios.get(userAvatarAttachments[name].url, { responseType: "arraybuffer" });
            emailBuilder.addAttachment(userAvatarAttachments[name].filename, res.data, userAvatarAttachments[name].cid);
        }));

        configuration.sections.forEach((event) => {
            switch (event) {
            case CanvaDigest.EmailSection.Access:
                const accessRequestedNotifications = notifications.filter((n) => n.type === Canva.NotificationType.DesignAccessRequested);
                const teamInviteNotifications = notifications.filter((n) => n.type === Canva.NotificationType.TeamInvite);
                if (accessRequestedNotifications.length === 0 && teamInviteNotifications.length === 0) {
                    return;
                }
                emailBuilder.addSectionTitle("Access requests and invitations", accessRequestedNotifications.length + teamInviteNotifications.length);

                accessRequestedNotifications.forEach((n) => {
                    const content = JSON.parse(n.data) as Canva.DesignAccessRequestedNotificationContent;
                    emailBuilder.addDesignSection({
                        design: n.designId ? designs[n.designId] : undefined, 
                        content, 
                        createdAt: n.createdAt,
                        action: "Requests access",
                        timezoneOffset: +configuration.timezone,
                    });
                });
                teamInviteNotifications.forEach((n) => {
                    const content = JSON.parse(n.data) as Canva.TeamInviteNotificationContent;
                    emailBuilder.addTeamInviteSection(content, n.createdAt, +configuration.timezone);
                });
                break;
            case CanvaDigest.EmailSection.Reviews:
                const approvalRequestedNotifications = notifications.filter((n) => n.type === Canva.NotificationType.DesignApprovalRequested);
                const approvalResponseNotifications = notifications.filter((n) => n.type === Canva.NotificationType.DesignApprovalResponse);
                if (approvalRequestedNotifications.length === 0 && approvalResponseNotifications.length === 0) {
                    return;
                }
                emailBuilder.addSectionTitle("Approvals and reviews", approvalRequestedNotifications.length + approvalResponseNotifications.length);
                if (approvalRequestedNotifications.length > 0) {
                    emailBuilder.addSectionSubtitle("TO REVIEW");
                }
                approvalRequestedNotifications.forEach((n) => {
                    const content = JSON.parse(n.data) as Canva.DesignApprovalRequestedNotificationContent;
                    emailBuilder.addDesignSection({
                        design: n.designId ? designs[n.designId] : undefined, 
                        content, 
                        createdAt: n.createdAt,
                        action: "Requests approval",
                        note: content.approval_request?.message,
                        timezoneOffset: +configuration.timezone,
                    });
                });
                if (approvalResponseNotifications.length > 0) {
                    emailBuilder.addSectionSubtitle("Reviews of your designs");
                }

                approvalResponseNotifications.forEach((n) => {
                    const content = JSON.parse(n.data) as Canva.DesignApprovalResponseNotificationContent;
                    emailBuilder.addDesignApprovalSection({
                        design: n.designId ? designs[n.designId] : undefined, 
                        content, 
                        createdAt: n.createdAt,
                        timezoneOffset: +configuration.timezone,
                    });
                });
                break;
            case CanvaDigest.EmailSection.Comments:
                const commentNotifications = notifications.filter((n) => n.type === Canva.NotificationType.Comment);
                if (commentNotifications.length === 0) {
                    return;
                }
                emailBuilder.addSectionTitle("New comments and replies", commentNotifications.length);

                const commentNotificationsGroupedByDesign = commentNotifications.reduce((acc, n) => {

                    if (!acc[n.designId || ""]) {
                        acc[n.designId || ""] = [];
                    }
                    acc[n.designId || ""].push(n.data);
                    return acc;
                }, {} as Record<string, string[]>);

                Object.keys(commentNotificationsGroupedByDesign).forEach((designId) => {
                    const notifications = commentNotificationsGroupedByDesign[designId].map((n) => JSON.parse(n) as Canva.CommentNotificationContent);
                    emailBuilder.addCommentsDesignSection({
                        design: designId ? designs[designId] : undefined, 
                        notifications, 
                        timezoneOffset: +configuration.timezone,
                    });
                });
                break;
            case CanvaDigest.EmailSection.Shares:
                const sharingNotifications = notifications.filter((n) => n.type === Canva.NotificationType.ShareDesign);
                if (sharingNotifications.length === 0) {
                    return;
                }

                emailBuilder.addSectionTitle("Sharings", sharingNotifications.length);

                sharingNotifications.forEach((n) => {
                    const content = JSON.parse(n.data) as Canva.ShareDesignNotificationContent;
                    emailBuilder.addDesignSection({
                        design: n.designId ? designs[n.designId] : undefined,
                        content, 
                        createdAt: n.createdAt,
                        action: "Shared",
                        note: content.share?.message,
                        timezoneOffset: +configuration.timezone,
                    });
                });
                break;
            }
        });

        await sendEmail({
            to: user.configuration?.email || "",
            //to: "natalia@moveworkforward.com",
            subject: "Ally digest",
            html: emailBuilder.build(),
            attachments: emailBuilder.getAttachments(),
        });
    } catch (e) {
        logger.error("Error sending email to " + user.configuration?.email);
        logger.error(e);

    }
};