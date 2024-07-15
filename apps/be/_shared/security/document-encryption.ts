import { EncryptionClient } from "./encryption-client";

export type EncryptionSchema<T> = {
    [P in keyof T]?: T[P] extends Record<string | number | symbol, any> ? EncryptionSchema<T[P]> : boolean;
};

const processDocument = async <TDocument>(document: TDocument, schema: EncryptionSchema<TDocument>, action: (input: string) => Promise<string>, cycleRefs: WeakMap<any, any> = new WeakMap()) => {

    if (document === null || document === undefined) {
        return document;
    }

    const newDocument = { ...document };
    cycleRefs.set(document, newDocument);

    for (const key of Object.keys(schema)) {
        if (document[key] === undefined)
            continue;
            
        if (schema[key] === true) {
            newDocument[key] = await action(document[key]);
        } else {
            if (cycleRefs.has(document[key])) {
                newDocument[key] = cycleRefs.get(document[key]);
                continue;
            }
            newDocument[key] = await processDocument(document[key], schema[key], action, cycleRefs);
        }
    }
    return newDocument;
};

export interface DocumentEncryption {
    encrypt: <TDocument>(document: TDocument, schema: EncryptionSchema<TDocument>) => Promise<TDocument>;
    decrypt: <TDocument>(document: TDocument, schema: EncryptionSchema<TDocument>) => Promise<TDocument>;
}

// Encrypted Data Key stays in the same field.
// Once encrypted, field has the format from below:
// [DS_{length of the key}.{Encrypted Data Key itself}{Encrypted value}]
const encryptedFieldPattern = /^DS_(\d{1,})\..*/;

const isEncrypted = (data: string) => {
    return encryptedFieldPattern.test(data);
};

const extractDataKeyAndValue = (field: string) => {
    const matches = field.match(encryptedFieldPattern);
    if (!matches || !matches.length) {
        throw new Error("Value doesn't match the patern for encrypted field!");
    }
    const eofHead = field.indexOf(".") + 1;
    const keyLengthGroup = 1;
    const keySize = Number(matches[keyLengthGroup]);
    const encryptedKey = field.slice(eofHead, eofHead + keySize);
    const encryptedValue = field.slice(eofHead + keySize);
    return {
        encryptedKey,
        encryptedValue,
    };
};

// FORMAT of the Field: [DS_{length of the key}.{Encrypted Data Key itself}{Encrypted value}]
export const combineDataKeyAndValue = (encryptedKey: Buffer, encryptedValue: Buffer) => {
    const encryptedBase64Key = encryptedKey.toString("base64");
    return `DS_${encryptedBase64Key.length}.${encryptedBase64Key}${encryptedValue.toString("base64")}`;
};

export const createDocumentEncryption = (encryptionClient: EncryptionClient): DocumentEncryption => {

    const decryptFieldValue = async (value: string) => {
        if (isEncrypted(value)) {
            const { encryptedKey, encryptedValue } = extractDataKeyAndValue(value);
            const decryptedValue = await encryptionClient.decrypt(Buffer.from(encryptedKey, "base64"),
                Buffer.from(encryptedValue, "base64"));
            return decryptedValue.toString();
        }
        return value;
    };

    const encryptFieldValue = async (value: string) => {
        const { encryptedValue, encryptedKey } = await encryptionClient.encrypt(value);
        const encryptedField = combineDataKeyAndValue(encryptedKey, encryptedValue);
        return encryptedField;
    };

    const decrypt: DocumentEncryption["decrypt"] = (document, schema) => {
        return processDocument(document, schema, decryptFieldValue);
    };

    const encrypt: DocumentEncryption["encrypt"] = (document, schema) => {
        return processDocument(document, schema, encryptFieldValue);
    };

    return {
        encrypt,
        decrypt,
    };
};
