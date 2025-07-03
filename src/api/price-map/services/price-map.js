'use strict';

/**
 * price-map service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::price-map.price-map');
