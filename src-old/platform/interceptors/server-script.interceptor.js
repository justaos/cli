const Q = require('q');
const vm = require('vm');

class ServerScriptInterceptor {
    constructor(user, as) {
        this.user = user;
        this._as = as;
    }

    executeScript(serverScript, docs) {
        let that = this;
        return new Promise((resolve, reject) => {
            let ctx = vm.createContext({as: that._as, current: docs, resolve, reject});
            vm.runInContext(serverScript.get('script'), ctx);
        })
    }


    async intercept(modelName, operation, when, docs) {
        let that = this;
        let ServerScript = that._as.model('p_server_script');
        ServerScript.deactivateIntercept('ServiceScriptInterceptor');
        let conditions = {ref_collection: modelName, type: when};
        conditions[operation] = true;
        let serverScripts = await ServerScript.find(conditions, null, {sort: {order: 1}}).exec();
        let i = 0;
        for (i = 0; i < serverScripts.length; i++) {
            try {
                if (Array.isArray(docs)) {
                    let j = 0;
                    for (j = 0; j < docs.length; j++) {
                        await this.executeScript(serverScripts[0], docs[j]);
                    }
                } else
                    await this.executeScript(serverScripts[0], docs);
            } catch (err) {
                if (when === 'before') {
                    throw new Error("(ServerScript " + operation + ") ::  " + err);
                }
                return;
            }
        }

        return docs;
    }
}

module.exports = ServerScriptInterceptor;
