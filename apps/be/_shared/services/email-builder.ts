import { Canva } from "../../digest-canva/shared/models/canva";
import logger from "../../digest-canva/shared/logger";
import { CanvaDigest } from "../models/canva";
import path from "path";

export class EmailBuilder {
    private _attachments: any[] = [];
    private _sections: string[] = [];

    constructor() {
        this._attachments.push(...[
            {
                filename: "design.png",
                path: "https://s3.amazonaws.com/fe-digest-canva.mwf-idrisovanv.com/assets/design.png",
                cid: "design",
            },
            {
                filename: "folder.png",
                path: "https://s3.amazonaws.com/fe-digest-canva.mwf-idrisovanv.com/assets/folder.png",
                cid: "folder",
            },
            {
                filename: "team.png",
                path: "https://s3.amazonaws.com/fe-digest-canva.mwf-idrisovanv.com/assets/team.png",
                cid: "team",
            },
            {
                filename: "check.png",
                path: "https://s3.amazonaws.com/fe-digest-canva.mwf-idrisovanv.com/assets/check.png",
                cid: "check",
            },
            {
                filename: "cross.png",
                path: "https://s3.amazonaws.com/fe-digest-canva.mwf-idrisovanv.com/assets/cross.png",
                cid: "cross",
            },
            {
                filename: "ally.png",
                path: "https://s3.amazonaws.com/fe-digest-canva.mwf-idrisovanv.com/assets/ally.png",
                cid: "ally",
            },
        ]);
    }

    public addHeader(displayName: string, repetition: CanvaDigest.EmailRepetition): void {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const REPETITION_HUMANIAZED: Record<CanvaDigest.EmailRepetition, string> = {
            [CanvaDigest.EmailRepetition.Daily]: "24 hours",
            [CanvaDigest.EmailRepetition.Weekly]: "week",
            [CanvaDigest.EmailRepetition.BiWeekly]: "two weeks",
        };
        this._sections.push(`
          <div style="padding-bottom: 12px">
            <table class="bg-f2f7ff" cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="#f2f7ff" width="100.00%" style="background-color: #f2f7ff; padding-top: 24px; padding-bottom: 24px; width: 100%; border-spacing: 0">
              <tbody><tr>
                <td align="left" valign="middle" style="padding-left: 24px; vertical-align: middle">
                  <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 0; border-spacing: 0">
                    <tbody><tr>
                      <td valign="middle" width="64" style="padding-right: 7px; width: 64px; vertical-align: middle">
                        <table class="bg-fffffe" cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="white" width="100.00%" style="border-radius: 16px; background-color: white; padding-top: 11px; padding-bottom: 11px; width: 100%; border-spacing: 0; border-collapse: separate">
                          <tbody><tr>
                            <td valign="middle" width="100.00%" style="padding-left: 11px; padding-right: 11px; width: 100%; vertical-align: middle">
                              <img src="cid:ally" width="100.00%" height="40" style="width: 40px; height: 40px; display: block" />
                            </td>
                          </tr>
                        </tbody></table>
                      </td>
                      <td valign="middle" width="377" style="padding-left: 8px; width: 377px; vertical-align: middle">
                        <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100.00%" style="width: 100%; border-spacing: 0">
                          <tbody><tr>
                            <td style="padding-bottom: 4px">
                              <p class="color-0a2540" width="100.00%" style="font-size: 20px; font-weight: 700; color: #0a2540; margin: 0; padding: 0; width: 100%; line-height: 28px; mso-line-height-alt: 28px">${displayName}, your Canva digest is ready!</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-top: 4px">
                              <p class="color-476788" width="100.00%" style="font-size: 16px; font-weight: 400; color: #476788; margin: 0; padding: 0; width: 100%; line-height: 24px; mso-line-height-alt: 24px">Configuration dates: last ${REPETITION_HUMANIAZED[repetition]}</p>
                            </td>
                          </tr>
                        </tbody></table>
                      </td>
                    </tr>
                  </tbody></table>
                </td>
              </tr>
            </tbody></table>
          </div>
        `);
    }

    public addSectionTitle(title: string, amount: number): void {
        this._sections.push(`
          <div style="padding-top: 12px; padding-bottom: 7.75px; padding-left: 23px">
            <p style="font-size: 18px; font-weight: 700; color: #0a2540; margin: 0; padding: 0; line-height: 24px; mso-line-height-alt: normal">
              ${title}   <span style="border-radius: 10px; background-color: #f2f7ff; font-size: 14px; font-weight: 400; color: #0a2540; margin: 0; padding: 2px 8px; width: 100%; line-height: 20px; text-align: center; height: 20px; mso-line-height-alt: normal">${amount}</span>
            </p>
          </div>
        `);
    }

    public addSectionSubtitle(title: string): void {
        this._sections.push(`
          <div style="padding-top: 8px; padding-bottom: 7.75px; padding-left: 23px">
              <p width="100.00%" style="text-transform: uppercase; font-size: 11px; font-weight: 700; line-height: 12px; color: #476788; mso-line-height-rule: exactly; margin: 0; padding: 0; width: 100%">${title}</p>
          </div>
          <div style="padding-top: 5.75px; padding-left: 24px;">
            <div style="padding-bottom: 3.75px; border-top: 1px solid rgba(213, 217, 223, 0.5); mso-border-top-alt: none"></div>
          </div>
        `);
    }

    public addCommentsDesignSection(design: Canva.Design, notifications: Canva.CommentNotificationContent[]): void {
        this._sections.push(`
          <div style="padding-top: 8px; padding-bottom: 3.75px; padding-left: 24px;">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 0; border-spacing: 0">
              <tbody><tr>
                <td style="padding-right: 7px">
                  <img src="cid:${design.id}" width="40" height="40" style="border: none; border-radius: 4px; max-width: initial; object-fit: cover; width: 40px; display: block">
                </td>
                <td width="401" style="padding-left: 8px;">
                  <div style="padding-bottom: 2px">
                    ${this.formatDesignTitle(design)}
                  </div>
                  <div style="padding-top: 2px">
                    <p class="color-0a2540" width="100.00%" style="font-size: 12px; font-weight: 400; color: #0a2540; margin: 0; padding: 0; width: 100%; line-height: 16px; mso-line-height-rule: exactly">
                      got ${notifications.length} comment${notifications.length === 1 ? "" : "s"}:
                    </p>
                  </div>
                </td>
              </tr>
            </tbody></table>
          </div>
          <div style="padding-top: 5.75px; padding-left: 80px;">
            <div style="padding-bottom: 5.75px; border-top: 1px solid rgba(213, 217, 223, 0.5); mso-border-top-alt: none"></div>
          </div>
        `);
        notifications.forEach((n) => {
            this._sections.push(`
              <div style="padding-top: 3.75px; padding-bottom: 5.75px; padding-left: 80px">
                <p style="font-size: 14px; font-weight: 600; color: #0a2540; margin: 0; padding: 0; width: 100%; line-height: 20px; mso-line-height-rule: exactly">${n.triggering_user.display_name}</p>
                <p style="font-size: 14px; font-weight: 400; font-style: italic; color: #476788; margin: 0; padding: 0; padding-bottom: 2px; width: 100%; line-height: 20px; mso-line-height-rule: exactly">${this.replaceMentions(n.comment.data.message, n.comment.data.mentions)}</p>
                <p style="font-size: 11px; font-weight: 400; line-height: 12px; color: #476788; mso-line-height-rule: exactly; margin: 0; padding: 0; padding-top: 2px; width: 100%">${this.formatDate(n.comment.data.created_at!)}</p>
              </div>
              <div style="padding-top: 5.75px; padding-left: 80px;">
                <div style="padding-bottom: 5.75px; border-top: 1px solid rgba(213, 217, 223, 0.5); mso-border-top-alt: none"></div>
              </div>
            `);
        });                         
    }

    public addDesignSection(params: { design: Canva.Design, content: Canva.NotificationContent, createdAt: number, action: string, note?: string }): void {
        const { design, content, createdAt, action, note = "" } = params;

        this._sections.push(`
          <div style="padding-top: 3.75px; padding-bottom: 5.75px; padding-left: 24px; width: 100%; box-sizing: border-box;">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100.00%" style="width: 100%; border-spacing: 0">
              <tbody><tr>
                <td valign="top" style="vertical-align: top" width="100%">
                  <p class="color-0a2540" width="100.00%" style="font-size: 14px; font-weight: 600; color: #0a2540; margin: 0; padding: 0; padding-bottom: 2px; width: 100%; line-height: 20px; mso-line-height-rule: exactly">${content.triggering_user.display_name}</p>
                  <div style="white-space: nowrap; padding-top: 2px; padding-bottom: 2px">
                    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 0; border-spacing: 0">
                      <tbody><tr>
                        <td valign="middle" style="vertical-align: middle">
                          <span style="font-size: 14px; font-weight: 400; color: #0a2540; margin: 0; padding: 0; line-height: 20px; mso-line-height-alt: normal">${action}</span>
                        </td>
                        <td valign="middle" style="padding-left: 7px; vertical-align: middle">
                          <span style="box-sizing: border-box; width: 4px; height: 4px; background: #476788;border: 1px solid #476788; display: inline-block; border-radius: 2px; margin-bottom: 2px;"/>
                        </td>
                        <td valign="middle" style="padding-left: 7px; vertical-align: middle">
                          ${this.formatDesignTitle(design)}
                        </td>
                      </tr>
                    </tbody></table>
                  </div>
                  <p class="color-476788" width="100.00%" style="font-size: 14px; font-weight: 400; font-style: italic; color: #476788; margin: 0; padding: 0; padding-top: 2px; padding-bottom: 2px; width: 100%; line-height: 20px; mso-line-height-rule: exactly">${note}</p>
                  <p class="color-476788" width="100.00%" style="font-size: 11px; font-weight: 400; line-height: 12px; color: #476788; mso-line-height-rule: exactly; margin: 0; padding: 0; padding-top: 2px; width: 100%">${this.formatDate(createdAt)}</p>
                </td>
                <td valign="top" style="vertical-align: top; padding-left: 8px;">
                  <img src="cid:${design?.id}" width="64" height="64" style="border: none; border-radius: 8px; max-width: initial; object-fit: cover; width: 64px; display: block">
                </td>
              </tr>
            </tbody></table>
          </div>
          <div style="padding-top: 5.75px; padding-left: 24px;">
            <div style="padding-bottom: 3.75px; border-top: 1px solid rgba(213, 217, 223, 0.5); mso-border-top-alt: none"></div>
          </div>
        `);
    }

    public addDesignApprovalSection(params: { design: Canva.Design, content: Canva.DesignApprovalResponseNotificationContent, createdAt: number }): void {
        const { design, content, createdAt } = params;
        this.addDesignSection({
            design,
            content,
            createdAt,
            action: content.approval_response?.approved ? this.getApprovedBadge() : this.getRejectedBadge(),
            note: content.approval_response?.message,
        });
    }

    public addTeamInviteSection(content: Canva.TeamInviteNotificationContent, createdAt: number): void {
        this._sections.push(`
          <div style="padding-top: 3.75px; padding-bottom: 5.75px; padding-left: 24px; width: 100%; box-sizing: border-box;">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100.00%" style="width: 100%; border-spacing: 0">
              <tbody><tr>
                <td valign="top" style="vertical-align: top" width="100%">
                  <p class="color-0a2540" width="100.00%" style="font-size: 14px; font-weight: 600; color: #0a2540; margin: 0; padding: 0; padding-bottom: 2px; width: 100%; line-height: 20px; mso-line-height-rule: exactly">${content.triggering_user.display_name}</p>
                  <div style="white-space: nowrap; padding-top: 2px; padding-bottom: 2px">
                    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 0; border-spacing: 0">
                      <tbody><tr>
                        <td valign="middle" style="vertical-align: middle">
                          <p class="color-0a2540" style="font-size: 14px; font-weight: 400; color: #0a2540; margin: 0; padding: 0; line-height: 20px; mso-line-height-alt: normal">Invited you to join</p>
                        </td>
                        <td valign="middle" style="padding-left: 7px; vertical-align: middle">
                          <span style="box-sizing: border-box; width: 4px; height: 4px; background: #476788;border: 1px solid #476788; display: inline-block; border-radius: 2px; margin-bottom: 2px;"/>
                        </td>
                        <td valign="middle" style="padding-left: 7px; vertical-align: middle">
                          ${this.formatTeamTitle(content.inviting_team)}
                        </td>
                      </tr>
                    </tbody></table>
                  </div>
                  <p class="color-476788" width="100.00%" style="font-size: 11px; font-weight: 400; line-height: 12px; color: #476788; mso-line-height-rule: exactly; margin: 0; padding: 0; padding-top: 2px; width: 100%">${this.formatDate(createdAt)}</p>
                </td>
              </tr>
            </tbody></table>
          </div>
          <div style="padding-top: 5.75px; padding-left: 24px;">
            <div style="padding-bottom: 3.75px; border-top: 1px solid rgba(213, 217, 223, 0.5); mso-border-top-alt: none"></div>
          </div>
        `);
    }

    public getAttachments(): any[] {
        return this._attachments;
    }
    public addDesignAttachment(design: Canva.Design, imageContent: string): void {
        this._attachments.push({
            filename: "preview.png",
            content: imageContent,
            cid: design.id,
        });
    }

    public build(): string {
        return `
            <center style="width: 100%; table-layout: fixed; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%">
              <div width="480.00" style="text-align: left; background-color: white; width: 100%; border-spacing: 0; font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif, Tahoma, system-ui; max-width: 480px">
                ${this._sections.join("")}
              </div>
            </center>
        `;
    }

    private replaceMentions(text = "", mentions: { [key: string]: Canva.Mention } = []): string {
        let result = text;
        Object.keys(mentions).forEach((key) => {
            const mention = mentions[key];
            result = result.replace(`[${key}]`, `<span class="color-285fdf" style="font-size: 1rem; font-weight: 500; color: #285fdf; margin: 0; padding: 0; line-height: 20px; mso-line-height-alt: normal">${mention.display_name}</span>`);
        });
        return result;
    }

    private formatDate(datetime: number): string {
        // TODO: user's timezone
        return new Date(datetime).toLocaleString("en-US", {
            timeZone: "Europe/Paris",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    }

    private formatDesignTitle(design: Canva.Design): string {
        return `
          <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-spacing: 0">
            <tbody><tr>
              <td valign="middle" style="vertical-align: middle">
                <img src="cid:design" width="12.00" height="12.00" style="width: 12px; height: 12px; display: block">
              </td>
              <td valign="middle" width="385" style="padding-left: 3px; width: 385px; vertical-align: middle">
                <!--[if mso]> <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="385" style="width:385px;"> <tr> <td> <![endif]-->
                <a href="${design?.urls?.edit_url}" target="_blank" class="color-285fdf" width="385" style="text-decoration: none; font-size: 1rem; font-weight: 500; color: #285fdf; margin: 0; padding: 0; width: 385px; line-height: 20px; mso-line-height-alt: normal">${design?.title || "Untitled design"}</a>
                <!--[if mso]></td></tr></table><![endif]-->
              </td>
            </tr>
          </tbody></table>
        `;
    }

    private formatTeamTitle(team: Canva.TeamInviteNotificationContent["inviting_team"]): string {
        return `
          <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-spacing: 0">
            <tbody><tr>
              <td valign="middle" style="vertical-align: middle">
                <img src="cid:team" width="12.00" height="12.00" style="width: 12px; height: 12px; display: block">
              </td>
              <td valign="middle" width="385" style="padding-left: 3px; width: 385px; vertical-align: middle">
                <!--[if mso]> <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="385" style="width:385px;"> <tr> <td> <![endif]-->
                <a href="${team?.id}" target="_blank" class="color-285fdf" width="385" style="text-decoration: none; font-size: 1rem; font-weight: 500; color: #285fdf; margin: 0; padding: 0; width: 385px; line-height: 20px; mso-line-height-alt: normal">${team?.display_name}</a>
                <!--[if mso]></td></tr></table><![endif]-->
              </td>
            </tr>
          </tbody></table>
        `;
    }
    
    private getApprovedBadge(): string {
        return `
          <table cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="#e9f2e8" width="100.00%" height="20.00" style="border-radius: 4px; background-color: #e9f2e8; width: 100%; height: 20px; border-spacing: 0; border-collapse: separate">
            <tbody><tr>
              <td align="left" height="20.00" style="padding-left: 8px; height: 20px">
                <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 0; border-spacing: 0">
                  <tbody><tr>
                    <td valign="middle" style="vertical-align: middle">
                      <img src="cid:check" width="12.00" height="12.00" style="width: 12px; height: 12px; display: block">
                    </td>
                    <td valign="middle" width="75" style="padding-left: 3px; width: 75px; vertical-align: middle">
                      <!--[if mso]> <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="75" style="width:75px;"> <tr> <td> <![endif]-->
                      <p class="color-278019" width="75" style="font-size: 14px; font-weight: 500; color: #278019; margin: 0; padding: 0; width: 75px; line-height: 20px; mso-line-height-alt: 20px">Approved</p>
                      <!--[if mso]></td></tr></table><![endif]-->
                    </td>
                  </tr>
                </tbody></table>
                </td>
              </tr>
            </tbody></table>
        `;
    }

    private getRejectedBadge(): string {
        return `
          <table cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="#fde8e8" width="100.00%" height="20.00" style="border-radius: 4px; background-color: #fde8e8; width: 100%; height: 20px; border-spacing: 0; border-collapse: separate">
            <tbody><tr>
              <td align="left" height="20.00" style="padding-left: 8px; height: 20px">
                <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 0; border-spacing: 0">
                  <tbody><tr>
                    <td valign="middle" style="vertical-align: middle">
                      <img src="cid:cross" width="12.00" height="12.00" style="width: 12px; height: 12px; display: block">
                    </td>
                    <td valign="middle" width="75" style="padding-left: 3px; width: 75px; vertical-align: middle">
                      <!--[if mso]> <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="75" style="width:75px;"> <tr> <td> <![endif]-->
                      <p class="color-d800" width="75" style="font-size: 14px; font-weight: 500; color: #d8000c; margin: 0; padding: 0; width: 75px; line-height: 20px; mso-line-height-alt: 20px">Rejected</p>
                      <!--[if mso]></td></tr></table><![endif]-->
                    </td>
                  </tr>
                </tbody></table>
                </td>
              </tr>
            </tbody></table>
        `;
    }

}
