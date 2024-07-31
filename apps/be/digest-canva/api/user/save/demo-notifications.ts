import { CanvaDigest, Canva } from "../../../shared/models/canva";

export function getDemoNotifications(user: CanvaDigest.CanvaUser, designs: any[]): CanvaDigest.UserNotification[] {
    const notifications: CanvaDigest.UserNotification[] = [
        {
            userId: user.userId,
            notificationId: "1",
            createdAt: Date.now(),
            type: Canva.NotificationType.DesignAccessRequested,
            designId: designs[0].id,
            data: JSON.stringify({
                type: Canva.NotificationType.DesignAccessRequested,
                triggering_user: { id: "user1", display_name: "Alice" },
                receiving_team_user: { user_id: user.userId, display_name: user.displayName },
                design: designs[0],
            } as Canva.DesignAccessRequestedNotificationContent),
        },
        {
            userId: user.userId,
            notificationId: "2",
            createdAt: Date.now(),
            type: Canva.NotificationType.TeamInvite,
            data: JSON.stringify({
                type: Canva.NotificationType.TeamInvite,
                triggering_user: { id: "user2", display_name: "Bob" },
                receiving_team_user: { user_id: user.userId, display_name: user.displayName },
                design: null,
                inviting_team: { id: "team1", display_name: "Team 1", external: false },
            } as Canva.TeamInviteNotificationContent),
        },
        {
            userId: user.userId,
            notificationId: "3",
            createdAt: Date.now(),
            type: Canva.NotificationType.DesignApprovalRequested,
            designId: designs[1].id,
            data: JSON.stringify({
                type: Canva.NotificationType.DesignApprovalRequested,
                triggering_user: { id: "user3", display_name: "Charlie" },
                receiving_team_user: { user_id: user.userId, display_name: user.displayName },
                design: designs[1],
                approval_request: { message: "Please approve this design." },
            } as Canva.DesignApprovalRequestedNotificationContent),
        },
        {
            userId: user.userId,
            notificationId: "4",
            createdAt: Date.now(),
            type: Canva.NotificationType.DesignApprovalResponse,
            designId: designs[0].id,
            data: JSON.stringify({
                type: Canva.NotificationType.DesignApprovalResponse,
                triggering_user: { id: "user4", display_name: "Dave" },
                receiving_team_user: { user_id: user.userId, display_name: user.displayName },
                design: designs[0],
                approval_response: { approved: true, message: "Approved!", ready_to_publish: true },
            } as Canva.DesignApprovalResponseNotificationContent),
        },
        {
            userId: user.userId,
            notificationId: "9",
            createdAt: Date.now(),
            type: Canva.NotificationType.DesignApprovalResponse,
            designId: designs[1].id,
            data: JSON.stringify({
                type: Canva.NotificationType.DesignApprovalResponse,
                triggering_user: { id: "user4", display_name: "Nataly" },
                receiving_team_user: { user_id: user.userId, display_name: user.displayName },
                design: designs[1],
                approval_response: { approved: false, message: "Not approved.", ready_to_publish: false },
            } as Canva.DesignApprovalResponseNotificationContent),
        },
        {
            userId: user.userId,
            notificationId: "5",
            createdAt: Date.now(),
            type: Canva.NotificationType.Comment,
            designId: designs[3].id,
            data: JSON.stringify({
                type: Canva.NotificationType.Comment,
                triggering_user: { id: "user5", display_name: "Eve" },
                receiving_team_user: { user_id: user.userId, display_name: user.displayName },
                design: designs[3],
                comment: {
                    type: Canva.CommentEventType.Comment,
                    data: {
                        type: Canva.CommentType.Parent,
                        message: "Great design!",
                        author: { id: "user5", display_name: "Eve" },
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
            designId: designs[0].id,
            data: JSON.stringify({
                type: Canva.NotificationType.ShareDesign,
                triggering_user: { id: "user6", display_name: "Frank" },
                receiving_team_user: { user_id: user.userId, display_name: user.displayName },
                design: designs[0],
                share: { message: "Check out this design." },
            } as Canva.ShareDesignNotificationContent),
        },
    ];

    return notifications;
}
