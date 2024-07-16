import type { Model } from "dynamoose/dist/Model";
import { model, Schema } from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { StageType } from "../consts";
import { logger } from "../logger";
import { CanvaDigest } from "../models/canva";

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
    ttl: {
        type: Number,
    },
});

const CanvaUserNotificationScheme = new Schema({
    userId: {
        type: String,
        hashKey: true,
    },
    createdAt: {
        type: Number,
        rangeKey: true,
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

export interface DigestCanvaRepositoryType {
    createCanvaAuth: (config: CanvaDigest.CanvaAuth) => Promise<void>;
    getCanvaAuth: (state: string) => Promise<CanvaDigest.CanvaAuth>;
    createCanvaUser: (config: CanvaDigest.CanvaUser) => Promise<CanvaDigest.CanvaUser>;
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
        logger.json("createCanvaUser settings: ", config);
        return this._canvaUserDbInstance.update(config);
    }

    public async getCanvaUser(userId: string): Promise<CanvaDigest.CanvaUser> {
        logger.debug("getCanvaUser userId: ", userId);
        const result = await this._canvaUserDbInstance.get(userId);
        return result as CanvaDigest.CanvaUser;
    }

    // TODO: add pagination
    public async getCanvaUsers(): Promise<CanvaDigest.CanvaUser[]> {
        const result = await this._canvaUserDbInstance.scan().exec();
        return result as CanvaDigest.CanvaUser[];
    }

    public async createCanvaUserNotification(config: CanvaDigest.UserNotification): Promise<CanvaDigest.UserNotification> {
        logger.json("createCanvaUserNotification settings: ", config);
        return this._canvaUserNotificationDbInstance.update(config);
    }

    // TODO: add pagination and time period
    public async getCanvaUserNotifications(userId: string): Promise<CanvaDigest.UserNotification[]> {
        // get notifications for a user created in the last 24 hours
        const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
        const result = await this._canvaUserNotificationDbInstance.query("userId").eq(userId).where("createdAt").gt(last24Hours).exec();
        return result as CanvaDigest.UserNotification[];
    }

    private getTableName(tableName: string) {
        return `${this._stage}_digest_canva_${tableName}`;
    }

}
