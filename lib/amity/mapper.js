
var is = require('is');

exports.track = function(track, settings){
  var source = settings.externalIdSource || 'ctp.app';
  return {
    properties: flatten(track.properties()),
    workspace_id: settings.workspaceId,
    participant_id: track.userId(),
    participant_id_source: source,
    name: track.event()
  };
};

exports.group = function(group, settings){
  var source = settings.externalIdSource || 'ctp.app';
  var ret = {
    workspace_id: settings.workspaceId,
    participant_id: group.userId(),
    participant_id_source: source,
    account_id: group.groupId(),
    account_id_source: source
  };

  if (group.created()) ret.created_at = group.created();

  proxy('avatar_url');
  proxy('telephone');
  proxy('address');
  proxy('name');
  proxy('url');

  return ret;

  function proxy(field){
    var value = group.proxy('traits.' + field);
    if (value) ret[field] = value;
  }
};

exports.identify = function(identify, settings){
  var ret = {
    participant_id_source: settings.externalIdSource || 'ctp.app',
    workspace_id: settings.workspaceId,
    participant_id: identify.userId()
  };

  if (identify.created()) ret.created_at = identify.created();
  if (identify.name()) ret.full_name = identify.name();
  if (identify.email()) ret.email = identify.email();
  if (identify.avatar()) ret.avatar_url = identify.avatar();
  if (identify.address()) ret.address = identify.address();

  proxy('telephone');
  proxy('birthday');
  proxy('gender');
  proxy('url');

  return ret;

  function proxy(field){
    var value = identify.proxy('traits.' + field);
    if (value) ret[field] = value;
  }
};

/**
 * Flatten a nested object into a single level space-delimited
 * hierarchy.
 *
 * Based on https://github.com/hughsk/flat
 *
 * @param {Object} source
 * @return {Object}
 * @api private
 */

function flatten(source){
  var output = {};

  function step(object, prev) {
    for (var key in object) {
      var value = object[key];
      var newKey = prev ? prev + ' ' + key : key;
      if (!is.array(value) && is.object(value)) return step(value, newKey);
      output[newKey] = value;
    }
  }
  step(source);
  return output;
}