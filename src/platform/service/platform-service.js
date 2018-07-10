const logger = require('../../config/logger');
const ModelSessionFactory = require('../../collection/model-session-fatory');


class PlatformService {

  constructor(user) {
    this.sessionUser = user;
    this.Model = ModelSessionFactory.createModelWithSession(user);
  }

  getModel(modelName) {
    return new this.Model(modelName);
  }

  getMenus(cb) {
    let menuModel = this.getModel('p_menu');
    menuModel.find().exec(function(err, menus) {
      if (err)
        logger.error(err);
      else cb(menus);
    });
  }

  getApplications(cb){
    let applicationModel = this.getModel('p_application');
    applicationModel.find({},null, {sort: {order: 1}}).exec(function(err, applications) {
      if (err)
        logger.error(err);
      else cb(applications);
    });
  }

  getApplicationById(id, cb){
    let applicationModel = this.getModel('p_application');
    applicationModel.findById(id).exec(function(err, application) {
      if (err)
        logger.error(err);
      else cb(application);
    });
  }
}

module.exports = PlatformService;