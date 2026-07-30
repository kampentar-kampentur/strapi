'use strict';

/**
 * website-lead service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::website-lead.website-lead');
