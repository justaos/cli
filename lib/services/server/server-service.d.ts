import { ServerInterface } from "./server-interface";
export declare class ServerService {
    constructor(config: any);
    getName(): string;
    start(): Promise<void>;
    stop(): Promise<void>;
    getInterface(): ServerInterface;
}
