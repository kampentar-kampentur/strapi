'use strict';

/**
 * technician service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::technician.technician');
