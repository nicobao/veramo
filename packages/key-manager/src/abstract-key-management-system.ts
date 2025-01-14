import { IKey, ManagedKeyInfo, MinimalImportableKey, TKeyType } from '@veramo/core-types'
import { arrayify } from '@ethersproject/bytes'
import { serialize } from '@ethersproject/transactions'
import * as u8a from 'uint8arrays'

/**
 * This base abstract class should be extended to provide cryptographic functions to other Veramo plugins.
 *
 * @public
 */
export abstract class AbstractKeyManagementSystem {
  abstract importKey(args: Exclude<MinimalImportableKey, 'kms'>): Promise<ManagedKeyInfo>

  abstract listKeys(): Promise<Array<ManagedKeyInfo>>

  abstract createKey(args: { type: TKeyType; meta?: any }): Promise<ManagedKeyInfo>

  abstract deleteKey(args: { kid: string }): Promise<boolean>

  /**@deprecated please use `sign({key, alg: 'eth_signTransaction', data: arrayify(serialize(transaction))})` instead */
  async signEthTX({ key, transaction }: { key: Pick<IKey, 'kid'>; transaction: object }): Promise<string> {
    const { v, r, s, from, ...tx } = <any>transaction
    const data = arrayify(serialize(tx))
    const algorithm = 'eth_signTransaction'
    const signedTxHexString = this.sign({ keyRef: key, data, algorithm })
    return signedTxHexString
  }

  /**@deprecated please use `sign({key, data})` instead, with `Uint8Array` data */
  async signJWT({ key, data }: { key: Pick<IKey, 'kid'>; data: string | Uint8Array }): Promise<string> {
    let dataBytes: Uint8Array
    if (typeof data === 'string') {
      try {
        dataBytes = arrayify(data, { allowMissingPrefix: true })
      } catch (e) {
        dataBytes = u8a.fromString(data, 'utf-8')
      }
    } else {
      dataBytes = data
    }
    return this.sign({ keyRef: key, data: dataBytes })
  }

  abstract sign(args: {
    keyRef: Pick<IKey, 'kid'>
    algorithm?: string
    data: Uint8Array
    [x: string]: any
  }): Promise<string>

  abstract sharedSecret(args: {
    myKeyRef: Pick<IKey, 'kid'>
    theirKey: Pick<IKey, 'publicKeyHex' | 'type'>
  }): Promise<string>
}
