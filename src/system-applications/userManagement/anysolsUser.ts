import AnysolsRecord from "anysols-odm/lib/record/anysolsRecord";
import {validateHash} from "anysols-utils";

const privates = new WeakMap();

export default class AnysolsUser {

    constructor(userRecord: AnysolsRecord) {
        privates.set(this, {userRecord})
    }

    isValidPassword(password: string): boolean {
        return validateHash(password, _getUserRecord(this).get('password'))
    }

    toPlainObject() {
        return {
            username: _getUserRecord(this).get('username')
        }
    }
}

function _getUserRecord(that: AnysolsUser): AnysolsRecord {
    return privates.get(that).userRecord;
}
