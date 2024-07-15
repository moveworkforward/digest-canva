import crypto from "crypto";
import { DigestCanvaRepository } from "../repository/digest-canva";
import { StageType } from "../consts";
import axios from "axios";
import logger from "../logger";
import { Canva } from "../models/canva";

const digestCanvaRepository = new DigestCanvaRepository(process.env.STAGE as StageType);

const REDIRECT_URI = `https://api.${process.env.DOMAIN}/digest-canva/auth`;
const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID;
const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET;
export class CanvaClient {
    private _accessToken: string;
    private _userId: string;

    constructor(userId: string) {
        this._userId = userId;
    }

    public static async generateLoginUrl(params: { addonUserId: string; nonce: string; addonState: string }) {
        const state = crypto.randomBytes(16).toString("base64url");
        const codeVerifier = crypto.randomBytes(96).toString("base64url");
        const ttl = Math.floor(Date.now() / 1000) + 3600; // 1 hour

        await digestCanvaRepository.createCanvaAuth({ state, codeVerifier, ttl, ...params });

        const scopes = encodeURIComponent([
            "profile:read",
            "collaboration:event",
            "comment:read",
            "design:meta:read",
        ].join(" "));

        const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
        return `https://www.canva.com/api/oauth/authorize?code_challenge_method=s256&response_type=code&client_id=${CANVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scopes}&code_challenge=${codeChallenge}&state=${state}`;
    }

    public static async register(code: string, state: string) {
        const canvaAuth = await digestCanvaRepository.getCanvaAuth(state);
        if (!canvaAuth) {
            throw new Error("Canva auth not found");
        }
        
        const tokenResponse = await axios.post("https://api.canva.com/rest/v1/oauth/token", {
            client_id: CANVA_CLIENT_ID,
            client_secret: CANVA_CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code_verifier: canvaAuth.codeVerifier,
            code,
            grant_type: "authorization_code",
        }, { headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        } });

        const accessToken = tokenResponse?.data?.access_token;
        const refreshToken = tokenResponse?.data?.refresh_token;

        const userResponse = await axios.get("https://www.canva.dev/_api/rest/v1/users/me", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        logger.json("User response", userResponse?.data);

        const userId = userResponse?.data?.team_user?.user_id;

        const userProfileResponse = await axios.get("https://www.canva.dev/_api/rest/v1/users/me/profile", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        logger.json("User profiles response", userProfileResponse?.data);

        const displayName = userProfileResponse?.data?.profile?.display_name;

        const user = await digestCanvaRepository.createCanvaUser({ userId, displayName, refreshToken });
        
        const userMapping = await digestCanvaRepository.createCanvaAddonUserMapping({ addonUserId: canvaAuth.addonUserId, connectUserId: userId });

        return canvaAuth;
    }

    public async getDesign(designId: string): Promise<Canva.Design> {
        const res = await this.makeCall(`https://www.canva.dev/_api/rest/v1/designs/${designId}`) as unknown as { data: { design: Canva.Design } };
        return res?.data?.design;
    }

    public async getDesigns(): Promise<Canva.Design[]> {
        const res = await this.makeCall("https://www.canva.dev/_api/rest/v1/designs") as unknown as { data: { items: Canva.Design[] } };
        return res?.data?.items;
    }

    public async refreshToken() {
        try {
            const user = await digestCanvaRepository.getCanvaUser(this._userId);

            const tokenResponse = await axios.post("https://api.canva.com/rest/v1/oauth/token", {
                client_id: CANVA_CLIENT_ID,
                client_secret: CANVA_CLIENT_SECRET,
                refresh_token: user.refreshToken,
                grant_type: "refresh_token",
            }, { headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            } });

            this._accessToken = tokenResponse?.data?.access_token;
            await digestCanvaRepository.updateCanvaUserRefreshToken(this._userId, tokenResponse?.data?.refresh_token);
        } catch (e) {
            logger.error("Failed to refresh token", e);
            await digestCanvaRepository.updateCanvaUserRefreshToken(this._userId, "");
        }

    }

    private async makeCall(url: string) {
        if (!this._accessToken) {
            throw new Error("Access token is not defined");
        }

        return axios.get(url, {
            headers: {
                Authorization: `Bearer ${this._accessToken}`,
            },
        });
    }
}

