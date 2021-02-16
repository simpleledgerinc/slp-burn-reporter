## slp-burn-reporter

This script will scan the blockchain for burned slp tokens for a specific Token ID.  The scan stores two csv files, BURNED_INPUTS.csv and INVALID_OUTPUTS.csv.  BURNED_INPUTS.csv contains individual inputs that were burned in an invalid slp transaction or in a non-slp transaction.  INVALID_OUTPUTS.csv contains individual outputs involved in an invalid SLP Send transaction.

## Get Started

Running this application requires running BCHD ["slp-index"](https://github.com/simpleledgerinc/bchd/releases) locally.  Start bchd using: `bchd --slpindex --grpclisten=0.0.0.0`.

Next, rename the file named `example.env` to `.env`, and set the following variables:

* `TOKEN_ID`    - i.e., the token id for the SLP token of interest
* `START_BLOCK` - i.e., whatever block you want to start scanning
* `BCHD_GRPC_URL`   - ex. `localhost:8335`
* `BCHD_GRPC_CERT`  - ex. `/home/<user>/.bchd/rpc.cert`

After `.env` is updated, start the script using:

```
$ npm i
$ npm start
```

NOTE: Each time you change the `TOKEN_ID` or if you want to start the scan over you must delete the `./state` file.
