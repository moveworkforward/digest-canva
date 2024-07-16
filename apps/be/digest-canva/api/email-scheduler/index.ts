import { StageType } from "../../shared/consts";
import logger from "../../shared/logger";
import { DigestCanvaRepository } from "../../shared/repository/digest-canva";
import { sendEmail } from "../../shared/email";
import { Canva, CanvaDigest } from "../../shared/models/canva";
import axios from "axios";

const digestCanvaRepository = new DigestCanvaRepository(process.env.STAGE as StageType);

export const handler = async () => {
    const users = await digestCanvaRepository.getCanvaUsers();

    for (const user of users) {
        const notifications = await digestCanvaRepository.getCanvaUserNotifications(user.userId);
        logger.json("User notifications for " + user.email, notifications);
        const attachments: any[] = [];
        const commentNotifications = notifications.filter((n) => n.type === Canva.NotificationType.Comment);
        const commentSection = await renderCommentsSection(commentNotifications, attachments);

        await sendEmail({
            to: user.email,
            subject: "Digest",
            html: `
                <h2 style="background: #F2F7FF; padding: 24px; color: #0A2540;">${user.displayName}, your Canva digest is ready!</h2>
                <div style="padding: 24px; color: #0A2540;">
                    <h2>New comments and replies <span style="background-color: #F2F7FF; padding: 4px 8px;border-radius: 10px;font-size: 14px;font-weight: 400;">
                        ${commentNotifications.length}
                    </span></h2>
                    ${commentSection}
                </div>
            `,
            attachments,
        });
    }

    return "OK";
};

const renderCommentsSection = async (commentNotifications: CanvaDigest.UserNotification[], attachments) => {
    const commentNotificationsGroupedByDesign = commentNotifications.reduce((acc, n) => {
        if (!acc[n.designId]) {
            acc[n.designId] = [];
        }
        acc[n.designId].push(n.data);
        return acc;
    }, {} as Record<string, string[]>);

    const sections = await Promise.all(Object.keys(commentNotificationsGroupedByDesign).map(async (designId) => {
        const notifications = commentNotificationsGroupedByDesign[designId].map((n) => JSON.parse(n) as Canva.CommentNotificationContent);
        const design = notifications[0].design;

        const response = await axios.get(design?.thumbnail?.url || "", { responseType: "arraybuffer" });

        attachments.push({
            filename: "preview.png",
            content: response.data,
            cid: design.id,
        });
        return `
                <table width="100%">
                    <tr>
                        <td width="50px" valign="top">
                            <div style="
                                width: 40px; height: 40px; overflow: hidden; 
                                border-radius: 4px;
                                background-image: url(cid:${design.id}); 
                                background-position: center;
                                background-size: cover;
                            "/>
                        </td>
                        <td valign="top" style="border-bottom: 1px solid rgba(213, 217, 223, 0.5);">
                            <a href="${design.url}" target="_blank" style="color: #285FDF; font-size: 14px;">${design.title}</a>
                            <div style="padding-bottom: 8px;">got ${notifications.length} comments:</div>
                        </td>
                    </tr>
                    ${notifications.map((c) => `
                        <tr>
                            <td></td>
                            <td valign="top" style="border-bottom: 1px solid rgba(213, 217, 223, 0.5);">
                                <div style="padding: 8px 0;">
                                    <div style="font-size: 14px;"><strong>${c.triggering_user.display_name}</strong></div>
                                    <div style="font-size: 14px;"><i>${c.comment.data.message}</i></div>
                                    <div>${new Date(c.comment.data.created_at!).toLocaleString()}</div>
                                </div>
                            </td>
                        </tr>
                    `).join("")}
                </table>
            `;
    }));
    return sections.join("");
};

