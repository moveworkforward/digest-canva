/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/naming-convention */
export namespace CanvaDigest {
  export interface CanvaAuth {
    state: string;
    codeVerifier: string;
    addonUserId: string;
    nonce: string;
    addonState: string;
    ttl: number;
  }

  export interface CanvaUser {
    userId: string;
    displayName: string;
    refreshToken: string;
    configuration?: EmailConfiguration;
  }

  export interface CanvaUsersMapping {
    addonUserId: string;
    connectUserId: string;
  }

  export interface EmailConfiguration {
    email: string;
    time: number;
    repetition: EmailRepetition;
    timezone: string;
    sections: EmailSection[];
  }


  export enum EmailRepetition {
      Daily = "daily",
      Weekly = "weekly",
      BiWeekly = "bi-weekly",
  }

  export enum EmailSection {
    Access = "access",
    Reviews = "reviews",
    Comments = "comments",
    Shares = "shares",
  }

  export interface UserNotification {
    userId: string;
    notificationId: string;
    createdAt: number;
    designId?: string;
    type: Canva.NotificationType;
    data: string;
  }

  export interface UserNotificationDate {
    userId: string;
    createdAt: number;
    notificationId: string;
  }
}

export namespace Canva {
  export interface WebhookNotification {
    id: string;
    created_at: number;
    content: NotificationContent;
  }

  export type NotificationContent = DesignAccessRequestedNotificationContent | TeamInviteNotificationContent | DesignApprovalRequestedNotificationContent | DesignApprovalResponseNotificationContent | CommentNotificationContent | ShareDesignNotificationContent;

  export enum NotificationType {
    DesignAccessRequested = "design_access_requested",
    TeamInvite = "team_invite",
    DesignApprovalRequested = "design_approval_requested",
    DesignApprovalResponse = "design_approval_response",
    Comment = "comment",
    ShareDesign = "share_design",
  }

  export interface DesignAccessRequestedNotificationContent {
    type: NotificationType.DesignAccessRequested;
    triggering_user: User;
    receiving_team_user: TeamUser;
    design: DesignSummary;
  }

  export interface TeamInviteNotificationContent {
    type: NotificationType.TeamInvite;
    triggering_user: User;
    receiving_team_user: TeamUser;
    design: null;
    inviting_team: {
      id: string;
      display_name: string;
      external: boolean;
    }
  }

  export interface DesignApprovalRequestedNotificationContent {
    type: NotificationType.DesignApprovalRequested;
    triggering_user: User;
    receiving_team_user: TeamUser;
    design: DesignSummary;
    approval_request?: {
      message?: string;
    }
  }

  export interface DesignApprovalResponseNotificationContent {
    type: NotificationType.DesignApprovalResponse;
    triggering_user: User;
    receiving_team_user: TeamUser;
    design: DesignSummary;
    approval_response?: {
      approved: boolean;
      message?: string;
      ready_to_publish?: boolean;
    }
  }

  export interface CommentNotificationContent {
    type: NotificationType.Comment;
    triggering_user: User;
    receiving_team_user: TeamUser;
    design: DesignSummary;
    comment: CommentEvent;
  }

  export interface ShareDesignNotificationContent {
    type: NotificationType.ShareDesign;
    triggering_user: User;
    receiving_team_user: TeamUser;
    design: DesignSummary;
    share?: { message?: string };
  }

  export interface User {
    id: string;
    display_name?: string;
    thumbnail?: {
      url: string;
    }
  }

  export interface TeamUser {
    user_id?: string;
    team_id?: string;
    display_name?: string;
  }

  export interface DesignSummary {
    id?: string;
    title?: string;
    url?: string;
    thumbnail?: {
      width: number;
      height: number;
      url: string;
    }
  }

  export interface Design {
    id: string;
    title: string;
    urls: {
      edit_url: string;
      view_url: string;
    };
    thumbnail?: {
      width: number;
      height: number;
      url: string;
    }
  }

  export enum CommentEventType {
    Comment = "COMMENT",
    Reply = "REPLY",
    Mention = "MENTION",
    Assign = "ASSIGN",
    Resolve = "RESOLVE",
  }

  export interface CommentEvent {
    type: CommentEventType;
    data: CommentData;
  }

  export enum CommentType {
    Parent = "PARENT",
    Reply = "REPLY",
  }

  export interface CommentData {
    type: CommentType;
    id?: string;
    attached_to?: CommentObject;
    message?: string;
    author?: User;
    created_at?: number; // Unix timestamp
    updated_at?: number; // Unix timestamp
    mentions?: { [key: string]: Mention };
    assignee?: User;
    resolver?: User;
    thread_id?: string;
  }

  interface CommentObject {
    type: string; // DESIGN
    design_id?: string;
  }

  export interface Mention {
    user_id?: string;
    team_id?: string;
    display_name?: string;
  }
}