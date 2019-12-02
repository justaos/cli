const Q = require('q');
const vm = require('vm');
var cron = require('cron');
const logger = require('../../config/logger');

const jobs = {};


class JobInterceptor {

    constructor(user, as) {
        this.user = user;
        this._as = as;
    }

    scheduleJob(jobRecord) {
        let ctx = vm.createContext({as: this._as});
        var job = new cron.CronJob(jobRecord.get('cron'), () => {
            vm.runInContext(jobRecord.get('script'), ctx);
        }, () => {
            logger.info("stopped");
        });
        job.start();
        jobs[jobRecord.getID()] = job;
    }


    async intercept(modelName, operation, when, docs) {
        if (modelName === 'p_job') {
            if (operation === 'create' && when === 'after') {
                this.scheduleJob(docs);
            } else if (operation === 'delete' && when === 'after') {
                jobs[docs.getID()].stop();
                delete jobs[docs.getID()];
            }
        }
        return docs;
    }
}

module.exports = JobInterceptor;
