const AnysolsSession = require('../anysols-session');

class BaseService {

    constructor(user) {
        this.sessionUser = user;
        this._as = new AnysolsSession(user);
    }
}

module.exports = BaseService;
