import React from 'react';

import Observable from 'services/observable.js';
import Number from 'services/utils/Numbers.js';
/*
  Menus manager service, choose where to generate menu
*/
import Globals from 'services/Globals.js';

class MenusManager extends Observable {
  constructor() {
    super();
    this.setObservableName('menus_manager');

    window.menusService = this;

    this.menus = [];
    this.lastOpen = 0;
    this.willClose = false;
    this.max_level = 0;

    var that = this;
    Globals.window.addEventListener('keydown', function (evt) {
      evt = evt || window.event;
      var isEscape = false;
      if ('key' in evt) {
        isEscape = evt.key === 'Escape' || evt.key === 'Esc';
      } else {
        isEscape = evt.keyCode === 27;
      }
      if (isEscape) {
        that.closeMenu();
      }
    });
  }
  closeMenu() {
    if (this.menus.length == 0) {
      this.willClose = false;
      return;
    }

    if (new Date().getTime() - this.lastOpen < 500) {
      return;
    }
    this.willClose = true;

    if (Globals.isReactNative) {
      this.willClose = false;
      this.menus = [];
    } else {
      this.closeMenuTimeout = setTimeout(() => {
        this.willClose = false;
        this.menus = [];
        this.notify();
      }, 200);
    }

    this.notify();
  }
  openMenu(menu, domRect, positionType, options) {
    this.menus = [];

    if (this.closeMenuTimeout) {
      this.willClose = false;
      clearTimeout(this.closeMenuTimeout);
    }

    if (!options) {
      options = {};
    }

    var position = this.bestPosition(domRect, positionType);

    this.menus.push({
      menu: menu,
      positionType: positionType,
      position: position,
      left: position.left,
      level: 0,
      id: Number.unid(),
      allowClickOut: options.allowClickOut !== undefined ? options.allowClickOut : true,
    });
    this.last_opened_id = Number.unid();
    this.notify();
    this.lastOpen = new Date().getTime();

    return this.last_opened_id;
  }
  openSubMenu(menu, domRect, level, positionType) {
    this.max_level = level + 1;
    this.closeSubMenu(level);
    var position = this.bestPosition(domRect, positionType);
    this.menus.push({
      menu: menu,
      positionType: positionType,
      position: position,
      left: position.left,
      level: level + 1,
      id: Number.unid(),
    });

    this.notify();
  }
  closeSubMenu(level) {
    this.max_level = level;
    this.menus.forEach(item => {
      if (item.level > level) {
        item.willClose = true;
      }
    });
    this.notify();
    setTimeout(() => {
      var new_menus = [];
      this.menus.forEach(item => {
        if (!(item.level > level && item.willClose)) {
          new_menus.push(item);
        }
      });
      this.menus = new_menus;

      this.notify();
    }, 200);
  }

  bestPosition(rect, position) {
    if (Globals.isReactNative) {
      return {};
    }

    var x = rect.right || rect.x;
    var y = rect.y;

    if (position == 'top' || position == 'bottom' || position == 'center') {
      x = rect.x;
      y = rect.bottom || rect.y;
      if (position == 'top') {
        y = rect.top || rect.y;
      }

      return {
        x: x + (rect.width || 0) / 2 - 100,
        y: y,
        left: false,
      };
    }

    var left = false;
    if (rect.right + 200 > document.documentElement.clientWidth) {
      x = (rect.left || rect.x) - 200;
      left = true;
    }
    if (x < 0) {
      x = 0;
      left = false;
    }

    return {
      x: x,
      y: y + (rect.height || 0) / 2,
      left: left,
    };
  }
}

const service = new MenusManager();
export default service;
