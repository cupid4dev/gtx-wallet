import { BN } from 'bn.js'
import { bnToHex } from '../../../../ui/helpers/utils/conversions.util'
import { NETWORK_TO_NAME_MAP } from './enums'

export const getNetworkDisplayName = (key) => NETWORK_TO_NAME_MAP[key]

export function formatTxMetaForRpcResult (txMeta) {
  const gasPriceParams = {
    ...(txMeta.gasPrice && { gasPrice: bnToHex(new BN(txMeta.gasPrice)) }),
    ...(txMeta.maxFeePerGas && { maxFeePerGas: bnToHex(new BN(txMeta.maxFeePerGas)) }),
    ...(txMeta.maxPriorityFeePerGas && { maxPriorityFeePerGas: bnToHex(new BN(txMeta.maxPriorityFeePerGas)) }),
  }
  return {
    'blockHash': txMeta.txReceipt ? txMeta.txReceipt.blockHash : null,
    'blockNumber': txMeta.txReceipt ? txMeta.txReceipt.blockNumber : null,
    'from': txMeta.txParams.from,
    'gas': txMeta.txParams.gas,
    ...gasPriceParams,
    'hash': txMeta.hash,
    'input': txMeta.txParams.data || '0x',
    'nonce': txMeta.txParams.nonce,
    'to': txMeta.txParams.to,
    'transactionIndex': txMeta.txReceipt ? txMeta.txReceipt.transactionIndex : null,
    'value': txMeta.txParams.value || '0x0',
    'v': txMeta.v,
    'r': txMeta.r,
    's': txMeta.s,
  }
}
