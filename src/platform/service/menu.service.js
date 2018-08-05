const Q = require('q');

const BaseService = require('./base.service');
const dsUtils = require('../../utils/ds-utils');


class MenuService extends BaseService {

    constructor(user) {
        super(user);
    }

    async getMenus() {
        let Menu = this._as.model('p_menu');
        let menus = await Menu.find().exec();
        return this.filterBasedOnAccess('p_menu', menus);
    }

    filterBasedOnAccess(type, records) {
        let that = this;
        let recordIDs = records.map(record => record.id);
        let filteredRecords = [];

        return new Promise((resolve, reject) => {
            that.getACLs(type, recordIDs).then(function (acls) {
                let promises = [];
                records.forEach(function (record) {
                    let dfd = Q.defer();
                    promises.push(dfd.promise);
                    let aclRolesForMenu = acls.filter(acl => acl.get('record_id') === record.getID()).map(acl => acl.id);
                    that.recordHasAccess(aclRolesForMenu).then(function (access) {
                        if (access)
                            filteredRecords.push(record);
                        dfd.resolve();
                    });
                });
                Q.all(promises).then(function () {
                    resolve(filteredRecords);
                });
            });
        });
    }

    async recordHasAccess(aclIDs) {
        if (aclIDs.length) {
            let AclRole = this._as.model('p_acl_role');
            let aclRoles = await AclRole.find({acl: aclIDs[0]}).exec();
            aclRoles = aclRoles.map(aclRole => aclRole.toObject());
            return await this.hasAccess(aclRoles)
        } else {
            return true;
        }
    }

    getACLs(type, recordIDs) {
        let Acl = this._as.model('p_acl');
        return Acl.find({type: type, record_id: {$in: recordIDs}}).exec();
    }

    hasAccess(aclRoles) {
        let that = this;
        if (that.sessionUser.hasRole('admin') || !aclRoles.length)
            return true;
        let flag = false;
        aclRoles.forEach(function (aclRole) {
            if (that.sessionUser.hasRoleId(aclRole.role.toString())) {
                flag = true;
            }
        });
        return flag;
    }

    getMenuById(id) {
        return this._as.model('p_menu').findById(id).exec();
    }

    async getMenuAndModules(menuId) {
        let that = this;
        let menu = await this.getMenuById(menuId);
        let modules = await this._as.model('p_module').find({ref_menu: menuId}, null, {sort: {order: 1}}).exec();
        if (menu) {
            modules = modules.map(module => module.toObject());
            modules = await that.filterBasedOnAccess('p_module', modules);
            return {menu, modules: dsUtils.flatToHierarchy(modules)};
        }
        throw new Error("Menu not found");
    }

}

module.exports = MenuService;