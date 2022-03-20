import { makeAutoObservable, runInAction, toJS } from "mobx";
import { Store } from "../store";
import { Invoice } from "../../types";

export default class LightningStore {
  private _store: Store;

  invoice: Invoice | null = null;
  socket: WebSocket | null = null;

  constructor(store: Store) {
    makeAutoObservable(this, {}, { deep: false, autoBind: true });

    this._store = store;
  }

  /**
   * Generate Invoice
   */
  async generateInvoice(recieveKey: string, value: number) {
    try {
      const result = await this._store.api.lightningAPI.generateInvoice(
        recieveKey,
        value
      );

      this.invoice = {
        id: result.id,
        memo: result.memo,
        ammountSats: result.num_satoshis,
        createdAt: result.created_at,
        destPubkey: result.dest_pubkey,
        expiresAt: result.expires_at,
        walletId: result.passThru.wallet_id,
        sessionId: result.passThru.sessionId,
        pr: result.payment_request,
      };

      this.listenForPayments(result.id);
    } catch (err) {
      console.log("Error signing up user");
    }
  }

  async listenForPayments(id: string) {
    const socket = await this._store.api.lightningAPI.getEventsSocket(id);
    this.socket = socket;
    this.socket.addEventListener("message", this.handleSocketEvent, true);
  }

  handleSocketEvent(data: any) {
    console.log("data", data);
    this.reset();
  }

  reset() {
    if (this.socket) {
      this.socket.removeEventListener("message", this.handleSocketEvent, true);
      this.socket = null;
      this.invoice = null;
    }
  }
}
