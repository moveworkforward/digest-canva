import { DecryptCommand, GenerateDataKeyCommand, KMSClient } from "@aws-sdk/client-kms";
import * as crypto from "crypto";

const region = process.env.REGION || "us-east-1";

interface EncryptionResult {
    encryptedKey: Buffer;
    encryptedValue: Buffer;
}

export interface EncryptionClient {
    encrypt: (plainData: string) => Promise<EncryptionResult>;
    decrypt: (encryptedDataKey: Buffer, encryptedData: Buffer) => Promise<Buffer>;
}

export interface EncryptionClientConfig {
    stage: string;
    applicationId: string;
}

const kmsUnsupportedAliasCharactersPattern = /[^a-zA-Z0-9/_-]/ig;

const getKmsKeyAliasForApplication = (kmsKeyAlias: string) => kmsKeyAlias.replace(kmsUnsupportedAliasCharactersPattern, "_");

const convertCipherBlobToBuffer = (blob: Uint8Array) => {
    return Buffer.isBuffer(blob) ? blob : Buffer.from(blob);
};

export const createEncryptionClient = ({ applicationId, stage }: EncryptionClientConfig): EncryptionClient => {

    const client = new KMSClient({ region });
    const encryptionId = getKmsKeyAliasForApplication(`alias/${stage}_${applicationId}`);

    const generateDataKey = () => {
        const command = new GenerateDataKeyCommand({ KeyId: encryptionId, KeySpec: "AES_128" });
        return client.send(command).then((response) => {
            if (!response.Plaintext || !response.CiphertextBlob) {
                throw new Error("generateDataKey didn't return correct response data");
            }
            return {
                plainKey: convertCipherBlobToBuffer(response.Plaintext),
                encryptedKey: convertCipherBlobToBuffer(response.CiphertextBlob),
            };
        });
    };

    const localEncryptionAlgo = "AES-128-ECB";
    
    const encrypt: EncryptionClient["encrypt"] = async (plainData) => {
        const { plainKey, encryptedKey } = await generateDataKey();
        const cipher = crypto.createCipheriv(localEncryptionAlgo, plainKey, Buffer.alloc(0));
        const plainDataArray = Buffer.from(plainData);
        const encryptedValue = Buffer.concat([cipher.update(plainDataArray), cipher.final()]);

        return {
            plainKey,
            encryptedKey,
            encryptedValue,
        };
    };

    const decrypt: EncryptionClient["decrypt"] = (encryptedKey, encryptedData) => {
        const command = new DecryptCommand({ CiphertextBlob: encryptedKey });
        return client.send(command).then((response) => {
            if (!response.Plaintext) {
                throw new Error("KMS returns undefined Plaintext");
            }
            const deCipher = crypto.createDecipheriv(localEncryptionAlgo,
                convertCipherBlobToBuffer(response.Plaintext),
                Buffer.alloc(0));
            const decryptedData = Buffer.concat([deCipher.update(encryptedData), deCipher.final()]);
            return decryptedData;
        });
    };

    return {
        encrypt,
        decrypt,
    };
};
