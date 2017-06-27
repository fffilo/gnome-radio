/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

// strict mode
'use strict';

// import modules
const GLib = imports.gi.GLib;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

// private properties
const _path = GLib.get_home_dir() + '/.' + Me.metadata.uuid;
const _filename = 'config.json';
const _fallback = Me.path + '/' + _filename;

/**
 * Load data from json file
 *
 * @param  {String} key (optional)
 * @return {Mixed}
 */
const load = function(key) {
    let path = _path;
    if (!GLib.file_test(path, GLib.FileTest.EXISTS))
        path = _fallback;

    let data;
    try {
        let result = GLib.file_get_contents(path)
        let ok = result[0];
        let content = result[1];
        data = content;
    }
    catch(e) {
        global.logError(e);
        throw 'Failed to load ' + _filename;
    }

    try {
        data = JSON.parse(data);
    }
    catch(e) {
        throw 'Failed to parse ' + _filename;
    }

    if (typeof key !== 'undefined')
        data = data[key];

    return data;
}

/**
 * Save data to json file
 *
 * @param  {String}  key
 * @param  {Mixed}   value
 * @return {Boolean}
 */
const save = function(key, value) {
    let data = load();
    data[key] = value;
    data = JSON.stringify(data, null, 4);

    return GLib.file_set_contents(_path, data);
}
