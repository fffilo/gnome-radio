/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

// strict mode
'use strict';

// import modules
const Lang = imports.lang;
const Signals = imports.signals;
const St = imports.gi.St;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const MessageTray = imports.ui.messageTray;
const Util = imports.misc.util;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Config = Me.imports.config;
const Player = Me.imports.player;
const Lib = Me.imports.lib;
const _ = Lib.translate;

/**
 * Icon for each player state
 *
 * @type {Object}
 */
const Icons = Object.freeze({
    DEFAULT: 'gnome-shell-extension_gnome-radio_default-symbolic',
    STOPPED: 'gnome-shell-extension_gnome-radio_stopped-symbolic',
    GETTING_METADATA: 'gnome-shell-extension_gnome-radio_getting_metadata-symbolic',
    BUFFERING: 'gnome-shell-extension_gnome-radio_buffering-symbolic',
    PLAYING: 'gnome-shell-extension_gnome-radio_playing-symbolic',
});

/**
 * Ui.Indicator constructor
 *
 * @param  {Object}
 * @return {Object}
 */
const Indicator = new Lang.Class({

    Name: 'Ui.Indicator',
    Extends: PanelMenu.Button,

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function() {
        this.parent(null, Me.metadata.name);

        this._init_settings();
        this._init_player();
        this._init_ui();
        this._init_state();
    },

    /**
     * Destructor
     *
     * @return {Void}
     */
    destroy: function() {
        this.player.destroy();
        this.player = null;

        this.settings.run_dispose();
        this.settings = null;

        this.parent();
    },

    /**
     * Create settings
     *
     * @return {Void}
     */
    _init_settings: function() {
        this.settings = Convenience.getSettings();
        this.settings.connect('changed::volume', Lang.bind(this, this._handle_settings_changed_volume));
    },

    /**
     * Create player
     *
     * @return {Void}
     */
    _init_player: function() {
        this.player = new Player.Player();
        this.player.connect('buffering', Lang.bind(this, this._handle_player_buffering));
        this.player.connect('eos', Lang.bind(this, this._handle_player_eos));
        this.player.connect('error', Lang.bind(this, this._handle_player_error));
        this.player.connect('volume', Lang.bind(this, this._handle_player_volume));
        this.player.connect('state_changed', Lang.bind(this, this._handle_player_state_changed));
        this.player.connect('tags::title', Lang.bind(this, this._handle_player_tags_title));
    },

    /**
     * Create user interface
     *
     * @return {Void}
     */
    _init_ui: function() {
        this.actor.add_style_class_name('panel-status-button');

        this.icon = new St.Icon({
            icon_name: Icons.STOPPED,
            style_class: 'system-status-icon',
        });
        this.actor.add_actor(this.icon);

        this.media = new MediaMenu(this);
        this.media.connect('click', Lang.bind(this, this._handle_menu_item_media));

        this.channel = new ChannelMenu(this);
        this.channel.connect('click', Lang.bind(this, this._handle_menu_item_channel));

        this.preferences = new PopupMenu.PopupMenuItem('Preferences');
        this.preferences.connect('activate', Lang.bind(this, this._handle_menu_item_preferences));
        this.menu.addMenuItem(this.preferences);

        this.notification = new Notification();
    },

    /**
     * Set player/media last state
     *
     * @return {Void}
     */
    _init_state: function() {
        let data = this.channel.data();

        if (!data || !data.playing || !data.playing.title || !data.playing.url)
            return;

        this.player.url = data.playing.url;
        this.player.volume = this.settings.get_int('volume');
        this.media.title = data.playing.title;
        this.media.enabled = true;
    },

    /**
     * Handle settings volume changed
     *
     * @param  {Object} settings
     * @param  {String} key
     * @return {Void}
     */
    _handle_settings_changed_volume: function(settings, key) {
        if (!this.player)
            return;

        this.player.volume = settings.get_int(key);
    },

    /**
     * Handle player buffering event
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_player_buffering: function(widget, event) {
        this.media.state = _("BUFFERING") + ' ' + event.percent + '%';
    },

    /**
     * Handle player eos event
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_player_eos: function(widget, event) {
        // to do
    },

    /**
     * Handle player error event
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_player_error: function(widget, event) {
        Lib.logError(event.error);

        if (this.settings.get_boolean('notify-error'))
            this.notification.show(this.media.title, _("ERROR"));
    },

    /**
     * Handle player volume event
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_player_volume: function(widget, event) {
        // pass
    },

    /**
     * Handle player state_changed event
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_player_state_changed: function(widget, event) {
        this.icon.icon_name = Icons[event.str];
        this.media.state = event.str;
        this.media.button = event.state <= Player.State.STOPPED ? 'start' : 'stop';

        if (event.state <= Player.State.STOPPED)
            this.media = '...';
    },

    /**
     * Handle player tags::title event
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_player_tags_title: function(widget, event) {
        this.media.tags = event.value || '...';

        if (this.settings.get_boolean('notify-title') && event.value)
            this.notification.show(this.media.title, this.media.tags);
    },

    /**
     * Handle media menu button click
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_menu_item_media: function(widget, event) {
        if (event.button === 'start')
            this.player.start();
        else if (event.button === 'stop')
            this.player.stop();
    },

    /**
     * Handle channel menu subitem click
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_menu_item_channel: function(widget, event) {
        Config.save('playing', {
            title: event.title,
            url: event.url,
        });

        this.player.stop();

        this.media.title = event.title;
        this.media.tags = '...';
        this.media.state = _("STOPPED");
        this.media.button = 'start';
        this.media.enabled = true;

        this.player.url = event.url;
        this.player.start();
    },

    /**
     * Handle preferences menu item click
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_menu_item_preferences: function(widget, event) {
        Util.spawn(['gnome-shell-extension-prefs', Me.metadata.uuid]);
    },

});

/**
 * Ui.MediaMenu constructor
 *
 * @param  {Object}
 * @return {Object}
 */
const MediaMenu = new Lang.Class({

    Name: 'Ui.MediaMenu',
    Extends: PopupMenu.PopupMenuSection,

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function(indicator) {
        this.parent();

        this.indicator = indicator;

        this._init_ui();
        this.enabled = false;
    },

    /**
     * Create user interface
     *
     * @return {Void}
     */
    _init_ui: function() {
        this.indicator.menu.addMenuItem(this);
        this.indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.ui = {};

        this.actor.set_vertical(false);
        this.actor.set_name('gnome-shell-extension_gnome-radio_media-menu');

        this.ui.button = new St.Button({
            name: 'gnome-shell-extension_gnome-radio_media-menu_button',
            style_class: 'system-menu-action',
            can_focus: true
        });
        this.ui.button.connect('clicked', Lang.bind(this, function(widget, event) {
            this._handle_button(widget, event);
        }));
        this.actor.add(this.ui.button);

        this.ui.icon = new St.Icon({
            name: 'gnome-shell-extension_gnome-radio_media-menu_button_icon',
            icon_name: 'media-playback-start-symbolic',
            style_class: 'system-status-icon',
        });
        this.ui.button.set_child(this.ui.icon);

        let vbox = new St.BoxLayout({
            name: 'gnome-shell-extension_gnome-radio_media-menu_desc',
            vertical: true,
        });
        this.actor.add(vbox);

        this.ui.title = new St.Label({
            name: 'gnome-shell-extension_gnome-radio_media-menu_desc_title',
            text: Me.metadata.name,
        });
        vbox.add(this.ui.title);

        this.ui.state = new St.Label({
            name: 'gnome-shell-extension_gnome-radio_media-menu_desc_state',
            text: 'STOPPED',
        });
        vbox.add(this.ui.state);

        this.ui.tags = new St.Label({
            name: 'gnome-shell-extension_gnome-radio_media-menu_desc_tags',
            text: '...',
        });
        vbox.add(this.ui.tags);
    },

    /**
     * Handle button click
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_button: function(widget, event) {
        this.emit('click', {
            button: this.button,
            title: this.title,
            tags: this.tags,
            state: this.state,
        });
    },

    /**
     * Property enabled getter
     *
     * @return {Boolean}
     */
    get enabled() {
        return this.ui.button.get_reactive();
    },

    /**
     * Property enabled setter
     *
     * @param  {Boolean} value
     * @return {Void}
     */
    set enabled(value) {
        this.ui.button.set_reactive(value);
        this.actor[value ? 'remove_style_class_name' : 'add_style_class_name']('disabled');
    },

    /**
     * Property button getter
     *
     * @return {String} start/stop
     */
    get button() {
        return this.ui.icon.get_icon_name() === 'media-playback-start-symbolic' ? 'start' : 'stop';
    },

    /**
     * Property button getter
     *
     * @param  {String} value start/stop
     * @return {Void}
     */
    set button(value) {
        if (value === 'start')
            this.ui.icon.set_icon_name('media-playback-start-symbolic');
        else if (value === 'stop')
            this.ui.icon.set_icon_name('media-playback-stop-symbolic');
    },

    /**
     * Property title getter
     *
     * @return {String}
     */
    get title() {
        return this.ui.title.get_text();
    },

    /**
     * Property title setter
     *
     * @param  {String} value
     * @return {Void}
     */
    set title(value) {
        this.ui.title.set_text(value);
    },

    /**
     * Property state getter
     *
     * @return {String}
     */
    get state() {
        return this.ui.state.get_text();
    },

    /**
     * Property state setter
     *
     * @param  {String} value
     * @return {Void}
     */
    set state(value) {
        this.ui.state.set_text(value);
    },

    /**
     * Property tags getter
     *
     * @return {String}
     */
    get tags() {
        return this.ui.tags.get_text();
    },

    /**
     * Property tags setter
     *
     * @param  {String} value
     * @return {Void}
     */
    set tags(value) {
        this.ui.tags.set_text(value);
    },

});

Signals.addSignalMethods(MediaMenu.prototype);

/**
 * Ui.ChannelMenu constructor
 *
 * @param  {Object}
 * @return {Object}
 */
const ChannelMenu = new Lang.Class({

    Name: 'Ui.MediaMenu',
    Extends: PopupMenu.PopupMenuSection,

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function(indicator) {
        this.parent();

        this.indicator = indicator;

        this._init_ui();
        this.reload();
    },

    /**
     * Create user interface
     *
     * @return {Void}
     */
    _init_ui: function() {
        this.indicator.menu.addMenuItem(this);
        this.indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    },

    /**
     * Handle subitem click
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_menu_item: function(widget, event) {
        this.emit('click', {
            title: widget.label.text,
            url: widget.url,
        });
    },

    /**
     * Empty menu items and append
     * disabled error message
     *
     * @param  {String} message
     * @return {Void}
     */
    _error: function(message) {
        let item = new PopupMenu.PopupMenuItem(message);
        item.setSensitive(false);

        this.removeAll();
        this.addMenuItem(item);

        this.emit('error', {
            message: message
        });
    },

    /**
     * Get channel list from json file
     * and refresh menu list
     *
     * @return {Void}
     */
    reload: function() {
        this.removeAll();
        this._data = null;

        let data;
        try {
            data = Config.load();
        }
        catch(e) {
            this._error(e);
            return;
        }

        try {
            for (var i in data.categories) {
                let category = data.categories[i];
                let channels = category.channels;

                let item = new PopupMenu.PopupSubMenuMenuItem(category.title);
                this.addMenuItem(item);

                for (var j in channels) {
                    let channel = channels[j];
                    let title = channel.title;
                    let url = channel.url;

                    if (!title || !url)
                        continue;

                    let subitem = new PopupMenu.PopupMenuItem(title);
                    subitem.url = url;
                    subitem.connect('activate', Lang.bind(this, function(widget, event) {
                        this._handle_menu_item(widget, event);
                    }));
                    item.menu.addMenuItem(subitem);
                }
            }
        }
        catch(e) {
            this._error('Invalid config.json format', e);
            return;
        }

        if (!data.categories.length) {
            let item = new PopupMenu.PopupMenuItem('Empty config.json list');
            item.setSensitive(false);
            this.addMenuItem(item);
        }

        this._data = data;

        this.emit('refresh');
    },

    /**
     * Get data from config.json
     *
     * @return {Object}
     */
    data: function() {
        return this._data;
    },

});

Signals.addSignalMethods(ChannelMenu.prototype);

/**
 * Ui.Notification constructor
 *
 * @param  {Object}
 * @return {Object}
 */
const Notification = new Lang.Class({

    Name: 'Ui.Notification',

    /**
     * Constructor
     *
     * @param  {String} title
     * @param  {String} icon
     * @return {Void}
     */
    _init: function(title, icon) {
        this._title = title || Me.metadata.name;
        this._icon = icon || Icons.DEFAULT;

        this._source = null;
    },

    /**
     * Prepare source
     *
     * @return {Void}
     */
    _prepare: function() {
        if (this._source !== null)
            return;

        this._source = new MessageTray.Source(this._title, this._icon);
        this._source.connect('destroy', Lang.bind(this, this._handle_destroy));

        Main.messageTray.add(this._source);
    },

    /**
     * Get existing notification from
     * source or create new one
     *
     * @param  {String} title
     * @param  {String} message
     * @return {Object}
     */
    _notification: function(title, message) {
        let result = null;
        if (this._source.notifications.length) {
            result = this._source.notifications[0];
            result.update(title, message, {
                clear: true
            });
        }
        else {
            result = new MessageTray.Notification(this._source, title, message);
            result.setTransient(true);
            result.setResident(false);
        }

        return result;
    },

    /**
     * Handle source destroy event:
     * clear source
     *
     * @return {Void}
     */
    _handle_destroy: function() {
        this._source = null;
    },

    /**
     * Show notification
     *
     * @param  {String} title
     * @param  {String} message
     * @return {Void}
     */
    show: function(title, message) {
        this._prepare();
        this._source.notify(this._notification(title, message));
    },

});
