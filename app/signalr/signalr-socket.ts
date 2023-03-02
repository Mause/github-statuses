import type { Socket } from "@github/stable-socket";
import { StableSocket } from "@github/stable-socket";
import { fetchJson } from "./fetch";

interface AuthenticatedURLResponse {
  data: {
    authenticated_url: string;
  };
}

interface WsUrlLookupData {
  logStreamWebSocketUrl: string;
}

export enum MessageType {
  Invocation = 1,
  StreamItem = 2,
  Completion = 3,
  StreamInvocation = 4,
  CancelInvocation = 5,
  Ping = 6,
  Close = 7,
}

// https://github.com/dotnet/aspnetcore/blob/main/src/SignalR/docs/specs/HubProtocol.md#overview
type Message = HandshakeRequest | Invocation;

interface HandshakeRequest {
  protocol: string;
  version: number;
}

interface Invocation {
  type: number;
  target: string;
  arguments: unknown[];
}

export interface SocketData<T> {
  target: string;
  type: number;
  arguments: T;
}

export class SignalRSocket extends EventTarget {
  public static readonly RECORD_SEPARATOR = String.fromCharCode(0x1e);
  // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
  public static readonly ABNORMAL_CLOSURE = 1006;
  public static readonly POLICY_VIOLATION = 1008;
  static #instances = new Map<string, SignalRSocket>();

  private globalSocket!: Socket | null;
  private socketUrl!: string;
  private isStreaming = false;
  private xhrConnectionUrl!: string;
  private shouldTryAgainWithNewSocket = false;

  public static getInstance(target: string): SignalRSocket {
    if (!SignalRSocket.#instances.has(target)) {
      SignalRSocket.#instances.set(target, new SignalRSocket(target));
    }
    return SignalRSocket.#instances.get(target)!;
  }

  constructor(private target: string) {
    super();
  }

  public socketDidReceiveMessage(socket: Socket, message: string): void {
    const record = message.split(SignalRSocket.RECORD_SEPARATOR)[0]!;
    const data = JSON.parse(record) as SocketData<unknown>;

    // this.dispatchEvent(new CustomEvent('socketDidReceiveMessage', {detail: data}))

    if (data.type === MessageType.Close) {
      socket.close();
    } else if (data.type === MessageType.Ping) {
      console.log("ping");
    } else {
      console.log({ data });
    }
  }

  // Public methods
  public socketDidOpen() {
    this.handshake();
  }

  public socketDidClose() {
    // Do nothing
  }

  public socketDidFinish() {
    this.globalSocket = null;

    if (this.shouldTryAgainWithNewSocket) {
      this.shouldTryAgainWithNewSocket = false;
      this.startOrContinueStreaming(this.xhrConnectionUrl, true);
    }
  }

  public socketShouldRetry(socket: Socket, code: number): boolean {
    if (code === SignalRSocket.ABNORMAL_CLOSURE) {
      /**
       * AFD (Azure Front Door) abnormally closed the socket. This can happen after the websocket max time limit
       * has been reached which is configured to 10 minutes for Actions. An abnormal closure can also sometimes
       * randomly happen before the max time limit has been reached which stops incoming logs.
       *
       * Retrying with the existing socket is futile, but it is safe to discard the existing socket and create a new one.
       */
      this.shouldTryAgainWithNewSocket = true;
      return false;
    }
    return !this.isFatalStatusCode(code);
  }

  public async startOrContinueStreaming(
    xhrConnectionUrl: string,
    retryingAbnormalClosure = false
  ) {
    if (!this.xhrConnectionUrl) this.xhrConnectionUrl = xhrConnectionUrl;

    if (this.isStreaming && !retryingAbnormalClosure) return;
    this.isStreaming = true;

    await this.tryStartNewStream(this.xhrConnectionUrl);
  }

  public closeExistingSocket() {
    if (this.globalSocket) {
      this.globalSocket.close();
      this.globalSocket = null;
    }
    return;
  }

  public onStreamFailure() {
    this.dispatchEvent(new CustomEvent("onStreamFailure"));
  }

  // Private methods
  private async tryStartNewStream(xhrConnectionUrl: string) {
    try {
      const socketUrl = await this.retrieveSocketURL(xhrConnectionUrl);
      if (!socketUrl) return;
      this.socketUrl = socketUrl;

      this.globalSocket = new StableSocket(this.socketUrl, this, {
        timeout: 4000,
        attempts: 10,
      });
      await this.globalSocket.open();
    } catch (e) {
      console.log({ e });
      this.onStreamFailure();
      throw e;
    }
  }

  private handshake() {
    const { searchParams } = new URL(this.socketUrl); //, window.location.origin)
    const tenantId = searchParams.get("tenantId");
    const runId = searchParams.get("runId");
    if (tenantId && runId) {
      const protocolPayload: HandshakeRequest = {
        protocol: "json",
        version: 1,
      };
      this.sendPayload(protocolPayload);

      const targetPayload: Invocation = {
        arguments: [tenantId, +runId],
        target: this.target,
        type: MessageType.Invocation,
      };
      this.sendPayload(targetPayload);
    }
  }

  private retrieveSocketURL = async (
    xhrUrl: string
  ): Promise<string | null> => {
    const authResult = await fetchJson<AuthenticatedURLResponse>(xhrUrl);
    const authenticatedUrl = authResult?.data["authenticated_url"];
    if (!authenticatedUrl) return null;
    const wsResult = await fetchJson<WsUrlLookupData>(authenticatedUrl);
    return wsResult?.logStreamWebSocketUrl ?? null;
  };

  private isFatalStatusCode(code: number): boolean {
    return code === SignalRSocket.POLICY_VIOLATION;
  }

  private sendPayload(payload: Message) {
    if (this.globalSocket) {
      this.globalSocket.send(
        JSON.stringify(payload) + SignalRSocket.RECORD_SEPARATOR
      );
    }
  }
}
