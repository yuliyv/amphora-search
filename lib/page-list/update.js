'use strict';
const clayutils = require('clayutils'),
  utils = require('./utils'),
  userOrRobot = require('../services/clay-user'),
  create = require('./create');


/**
 * validate requests coming into _pageList
 * @param  {string} uriOrUrl
 * @param  {object} data
 */
function validateRequest(uriOrUrl, data) {
  if (!uriOrUrl || !data) {
    let err = new Error('`_pagelist` endpoint cannot update a page without a url and value');

    err.code = 400;
    throw err;
  }
}

/**
 * add archive/unarchive to the history if we're doing that to a page
 * @param {object} oldPage
 * @param {object} newPage
 * @param {object} user
 */
function setArchiveState(oldPage, newPage, user) {
  if (!oldPage.archived && newPage.archived) {
    newPage.history.push({ action: 'archive', timestamp: new Date(), users: [userOrRobot(user)] });
  } else if (oldPage.archived && !newPage.archived) {
    newPage.history.push({ action: 'unarchive', timestamp: new Date(), users: [userOrRobot(user)] });
  }
}

/**
 * update the page if it already exists in the pages list,
 * otherwise create it and give it the appropriate data
 * @param {string} uriOrUrl may be a public url, page/preview url, or uri
 * @param {object} data may contain properties that will be added to the page's entry in the list
 * @param {object} user
 * @return {Promise} page entry, after adding those properties (undefined if no page found)
 */
function update({ uriOrUrl, data, user }) {
  validateRequest(uriOrUrl, data);

  return utils.findPage(uriOrUrl)
    .then(function (existingPage) {
      if (existingPage) {
        // if we're archiving or unarchiving, record that in the page history
        setArchiveState(existingPage, data, user);

        return utils.updatePage(existingPage.uri, data).then(function () {
          return { uri: existingPage.uri, value: data };
        });
      } else if (clayutils.isPage(uriOrUrl)) {
        // page doesn't exist! create it (since we have a /_pages/id uri), then update it with the data we want
        return create({ uri: uriOrUrl, user })
          .then(() => {
            setArchiveState({}, data, user);
            return utils.updatePage(uriOrUrl, data, user);
          })
          .then(() => ({ uri: uriOrUrl, value: data }));
      } else {
        throw new Error(`Cannot create page with uri "${uriOrUrl}"`);
      }
    });
}

module.exports.update = update; // not default export, so we can mock it to test _pagelist route
