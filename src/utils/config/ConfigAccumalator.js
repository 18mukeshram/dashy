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

    // Local user preferences for theme, layout, iconSize are disabled to enforce global config
    // Ensure background image from conf is always respected
    if (appConfigFile.backgroundImg) {
      usersAppConfig.backgroundImg = appConfigFile.backgroundImg;
    }
    if (appConfigFile.auth) usersAppConfig.auth = appConfigFile.auth;
    return usersAppConfig;
  }

  /* Page Info */
  pageInfo() {
    const filePageInfo = (this.conf && this.conf.pageInfo) ? this.conf.pageInfo : {};
    return { ...defaultPageInfo, ...filePageInfo };
  }

  /* Sections */
  sections() {
    let sections = [];
    // Prioritize file config sections from conf.yml
    if (this.conf && Array.isArray(this.conf.sections) && this.conf.sections.length > 0) {
      sections = this.conf.sections;
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
