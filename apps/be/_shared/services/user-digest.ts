
/* eslint-disable no-case-declarations */
import logger from "../logger";
import { sendEmail } from "../email";
import { Canva } from "../models/canva";
import axios from "axios";
import { CanvaClient } from "./canva";
import { EmailBuilder } from "./email-builder";
import { CanvaDigest } from "../models/canva";

export const sendUserDigest = async (user: CanvaDigest.CanvaUser, notifications: CanvaDigest.UserNotification[]) => {
    try {
        const configuration = user.configuration;

        if (!configuration) {
            logger.error("User configuration not found");
            return;
        }

        const canvaClient = new CanvaClient(user.userId);
        await canvaClient.refreshToken();

        const emailBuilder = new EmailBuilder();
        emailBuilder.addHeader(user.displayName, configuration.repetition);

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
                        design: designs[n.designId!], 
                        content, 
                        createdAt: n.createdAt,
                        action: "Requests access",
                    });
                });
                teamInviteNotifications.forEach((n) => {
                    const content = JSON.parse(n.data) as Canva.TeamInviteNotificationContent;
                    emailBuilder.addTeamInviteSection(content, n.createdAt);
                });
                break;
            case CanvaDigest.EmailSection.Reviews:
                const approvalRequestedNotifications = notifications.filter((n) => n.type === Canva.NotificationType.DesignApprovalRequested);
                const approvalResponseNotifications = notifications.filter((n) => n.type === Canva.NotificationType.DesignApprovalResponse);
                if (approvalRequestedNotifications.length === 0 && approvalResponseNotifications.length === 0) {
                    return;
                }
                emailBuilder.addSectionTitle("Approvals and reviews", approvalRequestedNotifications.length + approvalResponseNotifications.length);
                emailBuilder.addSectionSubtitle("TO REVIEW");
                approvalRequestedNotifications.forEach((n) => {
                    const content = JSON.parse(n.data) as Canva.DesignApprovalRequestedNotificationContent;
                    emailBuilder.addDesignSection({
                        design: designs[n.designId!], 
                        content, 
                        createdAt: n.createdAt,
                        action: "Requests approval",
                        note: content.approval_request?.message,
                    });
                });
                emailBuilder.addSectionSubtitle("Reviews of your designs");

                approvalResponseNotifications.forEach((n) => {
                    const content = JSON.parse(n.data) as Canva.DesignApprovalResponseNotificationContent;
                    emailBuilder.addDesignApprovalSection({
                        design: designs[n.designId!], 
                        content, 
                        createdAt: n.createdAt,
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
            case CanvaDigest.EmailSection.Shares:
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