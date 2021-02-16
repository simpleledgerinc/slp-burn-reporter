import * as dotenv from "dotenv";
dotenv.config();
import { GrpcClient, SlpAction, SlpTransactionInfo } from "grpc-bchrpc-node";
import bchaddr from "bchaddrjs-slp";
import { Slp } from "slp-validate";
import { PbState } from "./state";
import { getSlpActionString, Logger } from "./log";

const client = new GrpcClient({
    url: process.env.BCHD_GRPC_URL,
    rootCertPath: process.env.BCHD_GRPC_CERT
});

const args = process.argv;

const main = async () => {

    // figure out the first block to start indexing on
    let lowestHeight = PbState.bchdBlock;

    let bestBlock = (await client.getBlockchainInfo()).getBestHeight();
    while (lowestHeight < bestBlock) {
        await processBlock(lowestHeight + 1);
        PbState.write();

        // increase counters after processing block
        lowestHeight++;
        if (lowestHeight > PbState.bchdBlock) {
            PbState.bchdBlock++;
        }
        bestBlock = (await client.getBlockchainInfo()).getBestHeight();
    }

    console.log("slp-comps has caught up to tip, exiting.");
};

const processBlock = async (blockIndex: number) => {
    const tokenIdHex = process.env.TOKEN_ID!;
    console.log(`Processing block ${blockIndex}`);
    const res = await client.getBlock({ index: blockIndex, fullTransactions: true });
    const block = res.getBlock()!.getTransactionDataList();

    // loop through block
    for (const txnPb of block) {
        const txid = Buffer.from(txnPb.getTransaction()!.getHash_asU8().slice().reverse()).toString("hex");
        const txn = txnPb.getTransaction()!;
        const slpInfo = txnPb.getTransaction()!.getSlpTransactionInfo()!;
        const action = slpInfo.getSlpAction();

        if (action === SlpAction.NON_SLP_BURN || (action !== SlpAction.NON_SLP && slpInfo.getValidityJudgement() === SlpTransactionInfo.ValidityJudgement.UNKNOWN_OR_INVALID)) {

            // log the burned inputs
            for (const input of txn.getInputsList()) {
                if (input.getSlpToken()) {
                    const _tokenIdHex = Buffer.from(input.getSlpToken()!.getTokenId_asU8()).toString("hex");
                    const address = bchaddr.toSlpAddress(input.getSlpToken()!.getAddress());
                    const amount = input.getSlpToken()!.getAmount();
                    if (_tokenIdHex === tokenIdHex) {
                        console.log(`Found token input burn for ${address}, ${amount}, ${getSlpActionString(action)}`);
                        Logger.AddInputBurnCase(action, blockIndex, txid, input.getIndex(), address, amount);
                    } else {
                        console.log(`Skipped token input burn for ${address}, ${amount}, ${getSlpActionString(action)}`);
                    }
                }
            }

            // log the intended outputs
            if (action === SlpAction.SLP_V1_SEND || action === SlpAction.SLP_NFT1_GROUP_SEND) {
                const _tokenIdHex = Buffer.from(slpInfo.getTokenId_asU8()).toString("hex");
                if (tokenIdHex === _tokenIdHex) {
                    const outputs = txn.getOutputsList()!;
                    const slpMsg = Slp.parseSlpOutputScript(Buffer.from(outputs[0]!.getPubkeyScript_asU8()));
                    for (const output of outputs) {
                        if (output.getIndex() === 0) {
                            continue;
                        }
                        if (output.getIndex() > slpMsg.sendOutputs!.length-1) {
                            continue;
                        }
                        const address = bchaddr.toSlpAddress(output.getAddress());
                        const amount = slpMsg.sendOutputs![output.getIndex()].toFixed();
                        console.log(`Found invalid sent output ${address}, ${amount}, ${getSlpActionString(action)}`);
                        Logger.AddInvalidOutputCase(action, blockIndex, txid, output.getIndex(), address, amount);
                    }
                }
            }
        }
    }
};

main();
