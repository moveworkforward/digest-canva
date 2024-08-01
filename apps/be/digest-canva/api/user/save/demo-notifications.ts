import { CanvaDigest, Canva } from "../../../shared/models/canva";

// eslint-disable-next-line @typescript-eslint/naming-convention
const triggering_user = { id: "user1", display_name: "Bot Botskins" };


export function getDemoNotifications(user: CanvaDigest.CanvaUser): CanvaDigest.UserNotification[] {
    const notifications: CanvaDigest.UserNotification[] = [
        {
            userId: user.userId,
            notificationId: "1",
            createdAt: Date.now(),
            type: Canva.NotificationType.DesignAccessRequested,
            data: JSON.stringify({
                type: Canva.NotificationType.DesignAccessRequested,
                triggering_user,
            } as Canva.DesignAccessRequestedNotificationContent),
        },
        {
            userId: user.userId,
            notificationId: "3",
            createdAt: Date.now(),
            type: Canva.NotificationType.DesignApprovalRequested,
            data: JSON.stringify({
                type: Canva.NotificationType.DesignApprovalRequested,
                triggering_user,
                receiving_team_user: { user_id: user.userId, display_name: user.displayName },
                approval_request: { message: "Comments will be shown here." },
            } as Canva.DesignApprovalRequestedNotificationContent),
        },
        {
            userId: user.userId,
            notificationId: "5",
            createdAt: Date.now(),
            type: Canva.NotificationType.Comment,
            data: JSON.stringify({
                type: Canva.NotificationType.Comment,
                triggering_user,
                receiving_team_user: { user_id: user.userId, display_name: user.displayName },
                comment: {
                    type: Canva.CommentEventType.Comment,
                    data: {
                        type: Canva.CommentType.Parent,
                        message: "Comments will be shown here.",
                        author: triggering_user,
                        created_at: Date.now(),
                        updated_at: Date.now(),
                    },
                },
            } as Canva.CommentNotificationContent),
        },
        {
            userId: user.userId,
            notificationId: "6",
            createdAt: Date.now(),
            type: Canva.NotificationType.ShareDesign,
            data: JSON.stringify({
                type: Canva.NotificationType.ShareDesign,
                triggering_user,
                receiving_team_user: { user_id: user.userId, display_name: user.displayName },
                share: { message: "Comments will be shown here." },
            } as Canva.ShareDesignNotificationContent),
        },
    ];

    return notifications;
}
