import crypto from "crypto";
import { DigestCanvaRepository } from "../repository/digest-canva";
import { StageType } from "../consts";
import axios from "axios";
import logger from "../logger";

const digestCanvaRepository = new DigestCanvaRepository(process.env.STAGE as StageType);

const REDIRECT_URI = "https://api.mwf-idrisovanv.com/digest-canva/auth";
const CANVA_CLIENT_ID = "OC-AZCngpGESzQ0";
const CANVA_CLIENT_SECRET = "cnvcaJG1XePEUUDXa5Tu-5HzUhejuUUwejkJOpeb21UKy_6wd4800087";

export const generateLoginUrl = async () => {
    const state = crypto.randomBytes(16).toString("base64url");
    const codeVerifier = crypto.randomBytes(96).toString("base64url");
    const ttl = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    await digestCanvaRepository.createCanvaAuth({ state, codeVerifier, ttl });

    const scopes = encodeURIComponent([
        "profile:read",
        "collaboration:event",
        "comment:read",
        "design:meta:read",
    ].join(" "));

    const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
    return `https://www.canva.com/api/oauth/authorize?code_challenge_method=s256&response_type=code&client_id=${CANVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scopes}&code_challenge=${codeChallenge}&state=${state}`;
};

export const register = async (code: string, stateWithEmail: string) => {
    const { state, email } = JSON.parse(stateWithEmail);

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

    logger.json("Token response", tokenResponse?.data);

    const accessToken = tokenResponse?.data?.access_token;

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

    const user = await digestCanvaRepository.createCanvaUser({ userId, email, displayName });

    logger.json("User", user);

    return user;
};

