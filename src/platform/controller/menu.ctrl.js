'use strict';
const MenuService = require('../service/menu.service');
const moment = require('moment');
const url = require('url');

class MenuController {

    getMenus(req, res, next) {
        let ms = new MenuService(req.user);
        ms.getMenus().then(menus => {
            res.render('index', {menus: menus, layout: 'layouts/layout', user: req.user});
        }).catch(function (err) {
            next(err);
        });
    }

    getMenuAndModules(req, res, next) {
        let ms = new MenuService(req.user);
        ms.getMenuAndModules(req.params.id).then(function ({menu, modules}) {
            res.render('pages/menu', {
                menu: menu,
                url: req.query.url,
                modules: modules,
                layout: 'layouts/layout',
                user: req.user
            });
        }).catch(function (err) {
            next(err);
        });
    }

    getMenuHome(req, res, next) {
        let ms = new MenuService(req.user);
        ms.getMenuById(req.params.id).then(menu => {
            res.render('pages/home', {
                menu: menu,
                layout: 'layouts/layout',
                user: req.user
            });
        }).catch(function (err) {
            next(err);
        });
    }
}


module.exports = new MenuController();
