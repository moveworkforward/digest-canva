import type { Model } from "dynamoose/dist/Model";
import { model, Schema } from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { StageType } from "../consts";
import { logger } from "../logger";
import { Canva } from "../models/canva";

export interface DigestCanvaRepositoryType {
    createCanvaAuth: (config: Canva.CanvaAuth) => Promise<void>;
    getCanvaAuth: (state: string) => Promise<Canva.CanvaAuth>;
    createCanvaUser: (config: Canva.CanvaUser) => Promise<void>;
}

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
    email: {
        type: String,
        hashKey: true,
    },
});

export class DigestCanvaRepository implements DigestCanvaRepositoryType {
    private _stage: StageType;
    private _canvaAuthDbInstance: Model<Canva.CanvaAuth & Item>;
    private _canvaUserDbInstance: Model<Canva.CanvaUser & Item>;

    constructor(stage: StageType) {
        if (!stage) throw new Error("Stage is not defined.");

        this._stage = stage;
        this._canvaAuthDbInstance = model(this.getTableName("auth"), CanvaAuthScheme);
        this._canvaUserDbInstance = model(this.getTableName("users"), CanvaUserScheme);
    }

    public async createCanvaAuth(config: Canva.CanvaAuth): Promise<void> {
        logger.json("createCanvaAuth settings: ", config);
        await this._canvaAuthDbInstance.update(config);
    }

    public async getCanvaAuth(state: string): Promise<Canva.CanvaAuth> {
        logger.debug("getCanvaAuth state: ", state);
        const result = await this._canvaAuthDbInstance.get(state);
        return result as Canva.CanvaAuth;
    }

    public async createCanvaUser(config: Canva.CanvaUser): Promise<void> {
        logger.json("createCanvaUser settings: ", config);
        await this._canvaUserDbInstance.update(config);
    }

    private getTableName(tableName: string) {
        return `${this._stage}_digest_canva_${tableName}`;
    }

}
