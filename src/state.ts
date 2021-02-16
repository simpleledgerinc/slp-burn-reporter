import * as dotenv from "dotenv";
dotenv.config();

import fs from "fs";

const protons = require("protons");
const pb = protons(`
    syntax = "proto3";
    message PersistedCache {
        uint32 bchdBlock = 1;
    }
`);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface IPbCache {
    bchdBlock: number;
}

class _PbState {
    public static Instance() {
        return this._instance || (this._instance = new _PbState());
    }

    private static _instance: _PbState;

    public bchdBlock: number = parseInt(process.env.START_BLOCK!, 10) - 1;

    constructor() {
        let file: Buffer;
        try {
            fs.writeFileSync(".state_lock", Buffer.from([0]));
            file = fs.readFileSync("state");
        } catch (_) {
            return;
        } finally {
            try {
                fs.unlinkSync(".state_lock");
            } catch (_) { }
        }

        const _pb = pb.PersistedCache.decode(file);
        const _bchdBlock = _pb.getBchdBlock() as number;
        if (_bchdBlock) {
            this.bchdBlock = _bchdBlock;
        }
    }

    public async write() {
        const pbuf = pb.PersistedCache.encode({
            bchdBlock: this.bchdBlock
        } as IPbCache);

        if (fs.existsSync(".state_lock")) {
            while (fs.existsSync(".state_lock")) {
                await sleep(25);
            }
        }
        try {
            fs.writeFileSync(".state_lock", Buffer.from([0]));
            try {
                fs.unlinkSync("state");
            } catch (_) { }
            fs.writeFileSync("state", pbuf);
        } catch (error) {
            throw error;
        } finally {
            try {
                fs.unlinkSync(".state_lock");
            } catch (_) { }
        }
    }
}

export const PbState = _PbState.Instance();
