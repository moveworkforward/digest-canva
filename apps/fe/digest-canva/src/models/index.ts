export interface CanvaUser {
  userId: string;
  displayName: string;
  refreshToken: string;
  configuration?: EmailConfiguration;
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
