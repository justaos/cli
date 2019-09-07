const Q = require('q');
const logger = require('../../config/logger');

const BaseService = require('./base.service');
const fileUtils = require('../../utils/file-utils');
const constants = require('../platform-constants');

let defaultFields = fileUtils.readJsonFileSync(constants.path.DEFAULT_FIELDS);

function findDefaultField(fieldName) {
    let i = 0;
    for (i = 0; i < defaultFields.length; i++) {
        if (defaultFields[i].name === fieldName) {
            return defaultFields[i];
        }
    }
}

class ViewService extends BaseService {

    constructor(user, collectionName) {
        super(user);
        this.collectionName = collectionName;
    }

    createDefaultView() {
        let that = this;
        let Collection = this._as.model('p_collection');
        let Field = this._as.model('p_field');
        let View = this._as.model('p_view');
        let promises = [];
        promises.push(Collection.findOne({name: this.collectionName}).exec());
        promises.push(Field.find({ref_collection: this.collectionName}, null, {sort: {order: 1}}).exec());
        promises.push(View.findOne({name: 'default_view'}).exec());
        Q.all(promises).then(function (res) {
            //sort fields based on order
            that.createDefaultFormView(res[0], res[1], res[2]);
            that.createDefaultListView(res[0], res[1], res[2]);
        })
    }

    async createDefaultFormView(collection, fields, defaultView) {
        logger.info('view.service (createDefaultFormView) ::', collection.get('name'));
        let Form = this._as.model('p_form');
        let FormSection = this._as.model('p_form_section');
        let FormElement = this._as.model('p_form_element');

        let formRecord = await Form.findOne({
            ref_collection: collection.get('name'),
            view: defaultView.getID()
        }).exec();

        if (!formRecord) {
            let formRecord = await (new Form({
                ref_collection: collection.get('name'),
                view: defaultView.getID()
            }).save());

            let formSection = await (new FormSection({
                form: formRecord.getID(),
                name: "default",
                column_type: 'single_column'
            }).save());

            fields.forEach(function (field, index) {
                if (!findDefaultField(field.get('name'))) {
                    new FormElement({
                        form_section: formSection.getID(),
                        element: field.get('name'),
                        order: (index + 1) * 100,
                        type: 'element'
                    }).save();
                }
            });
        }
    }

    async createDefaultListView(collection, fields, defaultView) {
        logger.info('view.service (createDefaultListView) ::', collection.get('name'));
        let List = this._as.model('p_list');
        let ListElement = this._as.model('p_list_element');

        let listRecord = await List.findOne({
            ref_collection: collection.get('name'),
            view: defaultView.getID()
        }).exec();

        if (!listRecord) {
            listRecord = await (new List({
                ref_collection: collection.get('name'),
                view: defaultView.getID()
            }).save());

            fields.forEach(function (field, index) {
                if (!findDefaultField(field.get('name')) && field.get('type') !== "password" && field.get('type') !== "script") {
                    new ListElement({
                        list: listRecord.getID(),
                        element: field.get('name'),
                        order: (index + 1) * 100,
                        type: 'element'
                    }).save();
                }
            });
        }

    }
}

module.exports = ViewService;