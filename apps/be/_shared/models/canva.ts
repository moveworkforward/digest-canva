/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/naming-convention */
export namespace CanvaDigest {
  export interface CanvaAuth {
    state: string;
    codeVerifier: string;
    ttl: number;
  }

  export interface CanvaUser {
    userId: string;
    email: string;
    displayName: string;
  }

  export interface UserNotification {
    userId: string;
    createdAt: number;
    designId: string;
    type: Canva.NotificationType;
    data: string;
  } 

}

export namespace Canva {
  export interface WebhookNotification {
    id: string;
    created_at: number;
    content: NotificationContent;
  }

  export type NotificationContent = CommentNotificationContent;

  export enum NotificationType {
    Comment = "comment",
  }

  export interface CommentNotificationContent {
    type: NotificationType.Comment;
    triggering_user: User;
    receiving_team_user: TeamUser;
    design: DesignSummary;
    comment: CommentEvent;
  }

  export interface User {
    id: string;
    display_name?: string;
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
  
  interface Mention {
    user_id?: string;
    team_id?: string;
    display_name?: string;
  }
}