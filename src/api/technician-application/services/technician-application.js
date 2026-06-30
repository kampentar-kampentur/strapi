'use strict';

/**
 * technician-application service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::technician-application.technician-application');
