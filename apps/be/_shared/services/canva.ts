import crypto from "crypto";
import { DigestCanvaRepository } from "../repository/digest-canva";
import { StageType } from "../consts";
import axios from "axios";

const digestCanvaRepository = new DigestCanvaRepository(process.env.STAGE as StageType);

const REDIRECT_URI = "https://api.mwf-idrisovanv.com/digest-canva/auth";
const CANVA_CLIENT_ID = "OC-AZCngpGESzQ0";
const CANVA_CLIENT_SECRET = "cnvcaJG1XePEUUDXa5Tu-5HzUhejuUUwejkJOpeb21UKy_6wd4800087";

export const generateLoginUrl = async () => {
    const state = crypto.randomBytes(16).toString("base64url");
    const codeVerifier = crypto.randomBytes(96).toString("base64url");
    const ttl = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    await digestCanvaRepository.createCanvaAuth({ state, codeVerifier, ttl });

    const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
    return `https://www.canva.com/api/oauth/authorize?code_challenge_method=s256&response_type=code&client_id=OC-AZCngpGESzQ0&redirect_uri=https%3A%2F%2Fapi.mwf-idrisovanv.com%2Fdigest-canva%2Fauth&scope=collaboration:event%20comment:read%20profile:read&code_challenge=${codeChallenge}&state=${state}`;
};

export const generateAccessToken = async (code: string, state: string) => {
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

    return tokenResponse;
};

