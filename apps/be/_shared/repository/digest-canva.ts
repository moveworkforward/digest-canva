import type { Model } from "dynamoose/dist/Model";
import { model, Schema } from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { StageType } from "../consts";
import { logger } from "../logger";
import { CanvaDigest } from "../models/canva";
import { createEncryptionClient } from "../security/encryption-client";
import { createDocumentEncryption, EncryptionSchema } from "../security/document-encryption";

const CanvaAuthScheme = new Schema({
    state: {
        type: String,
        hashKey: true,
    },
    codeVerifier: {
        type: String,
    },
    ttl: {
        type: Number,
    },
});

const CanvaUserScheme = new Schema({
    userId: {
        type: String,
        hashKey: true,
    },
    email: {
        type: String,
    },
    displayName: {
        type: String,
    },
    refreshToken: {
        type: String,
    },
    ttl: {
        type: Number,
    },
});

const CanvaUserNotificationScheme = new Schema({
    userId: {
        type: String,
        hashKey: true,
    },
    notificationId: {
        type: String,
        rangeKey: true,
    },
    createdAt: {
        type: Number,
    },
    designId: {
        type: String,
    },
    type: {
        type: String,
    },
    data: {
        type: String,
    },
    ttl: {
        type: Number,
    },
});

const digestUserEncryptionSchema: EncryptionSchema<CanvaDigest.CanvaUser> = {
    refreshToken: true,
};

export interface DigestCanvaRepositoryType {
    createCanvaAuth: (config: CanvaDigest.CanvaAuth) => Promise<void>;
    getCanvaAuth: (state: string) => Promise<CanvaDigest.CanvaAuth>;
    createCanvaUser: (config: CanvaDigest.CanvaUser) => Promise<CanvaDigest.CanvaUser>;
    updateCanvaUserRefreshToken: (userId: string, refreshToken: string) => Promise<CanvaDigest.CanvaUser>;
    getCanvaUser: (userId: string) => Promise<CanvaDigest.CanvaUser>;
    getCanvaUsers: () => Promise<CanvaDigest.CanvaUser[]>;
    createCanvaUserNotification: (config: CanvaDigest.UserNotification) => Promise<CanvaDigest.UserNotification>;
    getCanvaUserNotifications: (userId: string) => Promise<CanvaDigest.UserNotification[]>;
}

export class DigestCanvaRepository implements DigestCanvaRepositoryType {
    private _stage: StageType;
    private _canvaAuthDbInstance: Model<CanvaDigest.CanvaAuth & Item>;
    private _canvaUserDbInstance: Model<CanvaDigest.CanvaUser & Item>;
    private _canvaUserNotificationDbInstance: Model<CanvaDigest.UserNotification & Item>;

    constructor(stage: StageType) {
        if (!stage) throw new Error("Stage is not defined.");

        this._stage = stage;
        this._canvaAuthDbInstance = model(this.getTableName("auth"), CanvaAuthScheme);
        this._canvaUserDbInstance = model(this.getTableName("users"), CanvaUserScheme);
        this._canvaUserNotificationDbInstance = model(this.getTableName("user_notifications"), CanvaUserNotificationScheme);
    }

    public async createCanvaAuth(config: CanvaDigest.CanvaAuth): Promise<void> {
        logger.json("createCanvaAuth settings: ", config);
        await this._canvaAuthDbInstance.update(config);
    }

    public async getCanvaAuth(state: string): Promise<CanvaDigest.CanvaAuth> {
        logger.debug("getCanvaAuth state: ", state);
        const result = await this._canvaAuthDbInstance.get(state);
        return result as CanvaDigest.CanvaAuth;
    }

    public async createCanvaUser(config: CanvaDigest.CanvaUser): Promise<CanvaDigest.CanvaUser> {
        logger.json("createCanvaUser settings: ", { ...config, refreshToken: "*****" });
        const encryptedConfig = await this.getDocumentEncryption().encrypt(config, digestUserEncryptionSchema);
        return this._canvaUserDbInstance.update(encryptedConfig);
    }

    public async updateCanvaUserRefreshToken(userId: string, refreshToken: string): Promise<CanvaDigest.CanvaUser> {
        logger.debug("updateCanvaUserRefreshToken userId: ", userId);
        return this._canvaUserDbInstance.update({ userId }, { refreshToken });
    }

    public async getCanvaUser(userId: string): Promise<CanvaDigest.CanvaUser> {
        logger.debug("getCanvaUser userId: ", userId);
        const result = await this._canvaUserDbInstance.get(userId);
        return this.getDocumentEncryption().decrypt(result, digestUserEncryptionSchema);
    }

    // TODO: add pagination
    public async getCanvaUsers(): Promise<CanvaDigest.CanvaUser[]> {
        const result = await this._canvaUserDbInstance.scan().exec();
        return await Promise.all(result.map(r => this.getDocumentEncryption().decrypt(r, digestUserEncryptionSchema)));
    }

    public async createCanvaUserNotification(config: CanvaDigest.UserNotification): Promise<CanvaDigest.UserNotification> {
        logger.json("createCanvaUserNotification settings: ", config);
        return this._canvaUserNotificationDbInstance.create(config);
    }

    // TODO: add pagination, time period, index for createdAt, ttl (auto delete)
    public async getCanvaUserNotifications(userId: string): Promise<CanvaDigest.UserNotification[]> {
        // get notifications for a user created in the last 24 hours
        const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
        const result = await this._canvaUserNotificationDbInstance.query("userId").eq(userId).where("createdAt").gt(last24Hours).exec();
        return result;
    }

    private getTableName(tableName: string) {
        return `${this._stage}_digest_canva_${tableName}`;
    }

    private getDocumentEncryption(addonId = "digest-canva") {
        const encryptionClient = createEncryptionClient({
            applicationId: addonId,
            stage: this._stage,
        });
        return createDocumentEncryption(encryptionClient);
    }

}
