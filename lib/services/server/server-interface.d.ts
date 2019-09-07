import { Router } from "express";
export declare class ServerInterface {
    constructor(router: Router);
    get(path: string, handler: any): void;
    post(path: string, handler: any): void;
}
