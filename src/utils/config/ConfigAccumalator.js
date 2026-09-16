/**
 * Reads the users config from `conf.yml`, and combines it with any local preferences
 * Also ensures that any missing attributes are populated with defaults, and the
 * object is structurally sound, to avoid any error if the user is missing something
 * The main config object is made up of three parts: appConfig, pageInfo and sections
 * For anything other than these three sections, please see @utils/ConfigHelpers.js
 */
import {
  localStorageKeys,
  appConfig as defaultAppConfig,
  pageInfo as defaultPageInfo,
  iconSize as defaultIconSize,
  layout as defaultLayout,
  theme as defaultTheme,
} from '@/utils/config/defaults';
import ErrorHandler from '@/utils/logging/ErrorHandler';
import { applyItemId } from '@/utils/config/SectionHelpers';
import $store from '@/store';

export default class ConfigAccumulator {
  constructor() {
    this.conf = $store.state.config;
  }

  pages() {
    return this.conf.pages;
  }

  /* App Config */
  appConfig() {
    let appConfigFile = {};
    if (this.conf && this.conf.appConfig) {
      appConfigFile = this.conf.appConfig;
    }
    let usersAppConfig = { ...defaultAppConfig, ...appConfigFile };

    // Local user preferences for theme, layout, iconSize
    if (localStorage[localStorageKeys.LAYOUT_ORIENTATION]) {
      usersAppConfig.layout = localStorage[localStorageKeys.LAYOUT_ORIENTATION];
    }
    if (localStorage[localStorageKeys.ICON_SIZE]) {
      usersAppConfig.iconSize = localStorage[localStorageKeys.ICON_SIZE];
    }
    if (localStorage[localStorageKeys.THEME]) {
      usersAppConfig.theme = localStorage[localStorageKeys.THEME];
    }
    // Ensure background image from conf is always respected
    if (appConfigFile.backgroundImg) {
      usersAppConfig.backgroundImg = appConfigFile.backgroundImg;
    }
    if (appConfigFile.auth) usersAppConfig.auth = appConfigFile.auth;
    return usersAppConfig;
  }

  /* Page Info */
  pageInfo() {
    let localPageInfo = {};
    if (localStorage[localStorageKeys.PAGE_INFO]) {
       
      try { localPageInfo = JSON.parse(localStorage[localStorageKeys.PAGE_INFO]); }
      catch { ErrorHandler('Malformed pageInfo data in local storage'); }
    }
    const filePageInfo = (this.conf && this.conf.pageInfo) ? this.conf.pageInfo : {};
    return { ...defaultPageInfo, ...filePageInfo, ...localPageInfo };
  }

  /* Sections */
  sections() {
    let sections = [];
    // Prioritize file config sections from conf.yml
    if (this.conf && Array.isArray(this.conf.sections) && this.conf.sections.length > 0) {
      sections = this.conf.sections;
    } else {
      const localSections = localStorage[localStorageKeys.CONF_SECTIONS];
      if (localSections) {
        try {
          const json = JSON.parse(localSections);
          if (json.length >= 1) sections = json;
        } catch {
          ErrorHandler('Malformed section data in local storage');
        }
      }
    }
    // Apply a unique ID to each item
    sections = applyItemId(sections);
    return sections;
  }

  /* Complete config */
  config() {
    return {
      appConfig: this.appConfig(),
      pageInfo: this.pageInfo(),
      sections: this.sections(),
      pages: this.pages(),
    };
  }
}
