'use strict';
const _ = require('lodash'),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename),
  sinon = require('sinon'),
  usersList = require('./users-list');

describe(_.startCase(filename), function () {
  let sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();

    sandbox.stub(usersList);
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('delete', function () {
    const userPayload = [{ type: 'del', key: '/_users/someUser' } ];

    it('calls the removeUsers function', function () {
      return lib(userPayload)
        .then(function () {
          sinon.assert.calledOnce(usersList.removeUsers);
        });
    });

    it('does nothing if no users to remove', function () {
      return lib([])
        .then(function () {
          sinon.assert.notCalled(usersList.removeUsers);
        });
    });
  });
});
