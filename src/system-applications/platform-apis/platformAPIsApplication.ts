import {Logger} from "anysols-utils/lib";

const privates = new WeakMap();

export default class PlatformAPIsApplication {

    constructor(config: any, logger: any | null, services: any) {
        privates.set(this, {config, services});
    }

    static getName() {
        return "platform_apis"
    }

    async start() {
        const that = this;
        _getService(that).server.get('/api/platform/collection/:collection', {authenticate: true}, (req: any, res: any, next: any) => {
            let col = _getService(that).core.collection(req.params.collection);
            col.find({}).toArray().then((records: any) => {
                const recObjs: any[] = [];
                records.forEach((rec: any) => {
                    recObjs.push(rec.toObject());
                });
                res.send(recObjs);
            }).catch((err: Error) => {
                next(err);
            });
        });
    }

    async stop() {

    }

}

const logger = new Logger(PlatformAPIsApplication.name);


function _getConfig(that: PlatformAPIsApplication) {
    return privates.get(that).config;
}

function _getService(that: PlatformAPIsApplication) {
    return privates.get(that).services;
}
