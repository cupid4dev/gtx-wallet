/* eslint-disable */
'use strict'

function _interopDefault (ex) {
  return (ex && (typeof ex === 'object') && 'default' in ex) ? ex.default : ex
}
const Bytes = _interopDefault(require('eth-lib/lib/bytes'))
const BigNumber = _interopDefault(require('bignumber.js'))
const RLP = _interopDefault(require('eth-lib/lib/rlp'))
const isString = _interopDefault(require('lodash/isString'))
const isNumber = _interopDefault(require('lodash/isNumber'))
const Hash = _interopDefault(require('eth-lib/lib/hash'))

class Tx {
  signBytes(chainID) {}
  getType() {}
  rlpInput() {}
}

class Coins{
    constructor(thetaWei, tfuelWei){
        this.thetaWei = thetaWei
        this.tfuelWei = tfuelWei
    }

    rlpInput(){

        let rlpInput = [
            (this.thetaWei.isEqualTo(new BigNumber(0))) ? Bytes.fromNat("0x0") : Bytes.fromNumber(this.thetaWei),
            (this.tfuelWei.isEqualTo(new BigNumber(0))) ? Bytes.fromNat("0x0") : Bytes.fromNumber(this.tfuelWei)
        ]

        return rlpInput
    }
}

class TxInput{
    constructor(address, thetaWei, tfuelWei, sequence) {
        this.address = address;
        this.coins = new Coins(thetaWei, tfuelWei);
        this.sequence = sequence;
        this.signature = "";
    }

    setSignature(signature) {
        this.signature = signature;
    }

    rlpInput(){
        let rplInput = [
            this.address.toLowerCase(),
            this.coins.rlpInput(),
            Bytes.fromNumber(this.sequence),
            this.signature
        ];

        return rplInput;
    }
}

class TxOutput {
    constructor(address, thetaWei, tfuelWei) {
        this.address = address;
        this.coins = new Coins(thetaWei, tfuelWei);
    }

    rlpInput(){
        let rplInput = [
            this.address.toLowerCase(),
            this.coins.rlpInput()
        ];

        return rplInput;
    }
}

const TxType = {
    TxTypeCoinbase: 0,
    TxTypeSlash: 1,
    TxTypeSend: 2,
    TxTypeReserveFund: 3,
    TxTypeReleaseFund: 4,
    TxTypeServicePayment: 5,
    TxTypeSplitRule: 6,
    TxTypeSmartContract: 7,
    TxTypeDepositStake: 8,
    TxTypeWithdrawStake: 9
};

class EthereumTx{
    constructor(payload){
        this.nonce = "0x0";
        this.gasPrice = "0x0";
        this.gas = "0x0";
        this.to = "0x0000000000000000000000000000000000000000";
        this.value = "0x0";
        this.input = payload;
    }
    
    rlpInput() {
        let rplInput= [
            Bytes.fromNat(this.nonce),
            Bytes.fromNat(this.gasPrice),
            Bytes.fromNat(this.gas),
            this.to.toLowerCase(),
            Bytes.fromNat(this.value),
            this.input,
        ];

        return rplInput;
    }
}

class SendMultiTx extends Tx{
    constructor(senderAddr, receiverAddresses, thetaWeis, tfuelWeis, totalFeeInTFuelWei, senderSequence){
        super();

        this.fee = new Coins(new BigNumber(0), totalFeeInTFuelWei);

        let txInput = new TxInput(
            senderAddr, 
            thetaWeis === null ? (new BigNumber(0)) : thetaWeis.reduce((accum,e)=>accum.plus(e)), 
            (tfuelWeis === null ? (new BigNumber(0)) : tfuelWeis.reduce((accum,e)=>accum.plus(e))).plus(totalFeeInTFuelWei), 
            senderSequence
        );
        this.inputs = [txInput];

        this.outputs = [];
        if (!receiverAddresses.length 
        || (thetaWeis !== null && !thetaWeis.length)
        || (tfuelWeis !== null && !tfuelWeis.length)
        || (thetaWeis !== null && receiverAddresses.length !== thetaWeis.length)
        || (tfuelWeis !== null && receiverAddresses.length !== tfuelWeis.length)
        ) throw new Error(`Number of receiverAddresses must match number of theta and/or tfuel weis being sent and there must be at least one type of coin being sent.`);
        for (let n = 0; n < receiverAddresses.length; ++n){
            const txOutput = new TxOutput(
                receiverAddresses[n], 
                thetaWeis !== null ? thetaWeis[n] :  (new BigNumber(0)),
                tfuelWeis !== null ? tfuelWeis[n] : (new BigNumber(0))
            );
            this.outputs.push(txOutput);
        }
    }

    setSignature(signature){
        //TODO support multiple inputs
        let input = this.inputs[0];

        input.setSignature(signature);
    }

    signBytes(chainID){
        let input = this.inputs[0];

        // Detach the existing signatures from the input if any, so that we don't sign the signature
        let originalSignature = input.signature;
        input.signature = "";

        let encodedChainID = RLP.encode(Bytes.fromString(chainID));
        let encodedTxType = RLP.encode(Bytes.fromNumber(this.getType()));
        let encodedTx = RLP.encode(this.rlpInput());
        let payload = encodedChainID + encodedTxType.slice(2) + encodedTx.slice(2);

        // For ethereum tx compatibility, encode the tx as the payload
        let ethTxWrapper = new EthereumTx(payload);
        let signedBytes = RLP.encode(ethTxWrapper.rlpInput()); // the signBytes conforms to the Ethereum raw tx format

        // Attach the original signature back to the inputs
        input.signature = originalSignature;

        return signedBytes;
    }

    getType(){
        return TxType.TxTypeSend;
    }

    rlpInput(){
        let numInputs = this.inputs.length;
        let numOutputs = this.outputs.length;
        let inputBytesArray = [];
        let outputBytesArray = [];

        for(let i = 0; i < numInputs; i ++) {
            inputBytesArray[i] = this.inputs[i].rlpInput();
        }

        for (let i = 0; i < numOutputs; i ++) {
            outputBytesArray[i] = this.outputs[i].rlpInput();
        }

        let rlpInput = [
            this.fee.rlpInput(),
            inputBytesArray, 
            outputBytesArray
        ];

        return rlpInput;
    }
}

// /**
//  * Check if string is HEX, requires a 0x in front
//  *
//  * @method isHexStrict
//  *
//  * @param {String} hex to be checked
//  *
//  * @returns {Boolean}
//  */
const isHexStrict = (hex) => {
    return (isString(hex) || isNumber(hex)) && /^(-)?0x[0-9a-f]*$/i.test(hex);
};

/**
 * Convert a hex string to a byte array
 *
 * Note: Implementation from crypto-js
 *
 * @method hexToBytes
 *
 * @param {String} hex
 *
 * @returns {Array} the byte array
 */
const hexToBytes = (hex) => {
    hex = hex.toString(16);

    if (!isHexStrict(hex)) {
        throw new Error(`Given value "${hex}" is not a valid hex string.`);
    }

    hex = hex.replace(/^0x/i, '');
    hex = hex.length % 2 ? '0' + hex : hex;

    let bytes = [];
    for (let c = 0; c < hex.length; c += 2) {
        bytes.push(parseInt(hex.substr(c, 2), 16));
    }

    return bytes;
};

// Convert a byte array to a hex string
const bytesToHex = function(bytes) {
    for (var hex = [], i = 0; i < bytes.length; i++) {
        hex.push((bytes[i] >>> 4).toString(16));
        hex.push((bytes[i] & 0xF).toString(16));
    }
    return hex.join("");
};

BigNumber.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
};

const bnFromString = str => {
    const base = str.slice(0, 2) === "0x" ? 16 : 10;
    const bigNum = new BigNumber(str, base);
    const bigNumWithPad = "0x" + bigNum.pad(2);
    return bigNumWithPad;
};

const elliptic = require("elliptic");
const secp256k1 = new elliptic.ec("secp256k1"); // eslint-disable-line
const SHA3_NULL_S = '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470';

const sha3 = (value) => {
    if (isHexStrict(value) && /^0x/i.test(value.toString())) {
        value = hexToBytes(value);
    }

    const returnValue = Hash.keccak256(value); // jshint ignore:line

    if (returnValue === SHA3_NULL_S) {
        return null;
    } else {
        return returnValue;
    }
};

const encodeSignature = ([v, r, s]) => Bytes.flatten([r, s, v]);

const makeSigner = addToV => (hash, privateKey) => {
  const ecKey = secp256k1.keyFromPrivate(new Buffer(privateKey.slice(2), "hex"));
  const signature = ecKey.sign(new Buffer(hash.slice(2), "hex"), { canonical: true });
  return encodeSignature([
      bnFromString(Bytes.fromNumber(addToV + signature.recoveryParam)), 
      Bytes.pad(32, Bytes.fromNat(`0x${signature.r.toString(16)}`)), 
      Bytes.pad(32, Bytes.fromNat(`0x${signature.s.toString(16)}`))
    ]);
};

const sign = makeSigner(0);

export class ThetaTxSigner {

    static signAndSerializeTx(chainID, tx, privateKey) {
        const signedTx = this.signTx(chainID, tx, privateKey);
        const signedRawBytes = this.serializeTx(signedTx);

        return signedRawBytes;
    }

    static signTx(chainID, tx, privateKey) {
        const txRawBytes = tx.signBytes(chainID);
        const txHash = sha3(txRawBytes);
        const signature = sign(txHash, privateKey);
        tx.setSignature(signature);
        return tx
    }

    static serializeTx(tx) {
        const encodedTxType = RLP.encode(Bytes.fromNumber(tx.getType()));
        const encodedTx = RLP.encode(tx.rlpInput()); // this time encode with signature
        const signedRawBytes = encodedTxType + encodedTx.slice(2);
        return signedRawBytes;
    }
}