import fs from "fs";
import { SlpAction } from "grpc-bchrpc-node";

const burnedInputsFile = `BURNED_INPUTS.csv`;
const invalidOutputsFile = `INVALID_OUTPUTS.csv`;

class _Logger {
    public static Instance() {
        return this._instance || (this._instance = new _Logger());
    }
    private static _instance: _Logger;

    constructor() {
        if (!fs.existsSync(burnedInputsFile)) {
            fs.appendFileSync(burnedInputsFile, "txid, index, height, address, amount, action\n");
        }
        if (!fs.existsSync(invalidOutputsFile)) {
            fs.appendFileSync(invalidOutputsFile, "txid, index, height, address, amount, action\n");
        }
    }

    public AddInputBurnCase(action: SlpAction, blockIndex: number, txidHex: string, index: number, address: string, amount: string) {
        const actionStr = getSlpActionString(action);
        fs.appendFileSync(
            burnedInputsFile,
            `${txidHex}, ${index}, ${blockIndex}, ${address}, ${amount}, ${actionStr}\n`
        );
    }

    public AddInvalidOutputCase(action: SlpAction, blockIndex: number, txidHex: string, index: number, address: string, amount: string) {
        const actionStr = getSlpActionString(action);
        fs.appendFileSync(
            invalidOutputsFile,
            `${txidHex}, ${index}, ${blockIndex}, ${address}, ${amount}, ${actionStr}\n`
        );
    }
}

export const getSlpActionString = (action: SlpAction) => {
    switch (action) {
        case SlpAction.NON_SLP:
            return "NON_SLP";
        case SlpAction.NON_SLP_BURN:
            return "NON_SLP_BURN";
        case SlpAction.SLP_NFT1_GROUP_GENESIS:
            return "SLP_NFT1_GROUP_GENESIS";
        case SlpAction.SLP_NFT1_GROUP_MINT:
            return "SLP_NFT1_GROUP_MINT";
        case SlpAction.SLP_NFT1_GROUP_SEND:
            return "SLP_NFT1_GROUP_SEND";
        case SlpAction.SLP_NFT1_UNIQUE_CHILD_GENESIS:
            return "SLP_NFT1_UNIQUE_CHILD_GENESIS";
        case SlpAction.SLP_NFT1_UNIQUE_CHILD_SEND:
            return "SLP_NFT1_UNIQUE_CHILD_SEND";
        case SlpAction.SLP_PARSE_ERROR:
            return "SLP_PARSE_ERROR";
        case SlpAction.SLP_UNSUPPORTED_VERSION:
            return "SLP_UNSUPPORTED_VERSION";
        case SlpAction.SLP_V1_GENESIS:
            return "SLP_V1_GENESIS";
        case SlpAction.SLP_V1_MINT:
            return "SLP_V1_MINT";
        case SlpAction.SLP_V1_SEND:
            return "SLP_V1_SEND";
        default:
            throw Error("unknown burn flag");
    }

}

export const Logger = _Logger.Instance();
