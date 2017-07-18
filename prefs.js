/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

// import modules
const Lang = imports.lang;
const Signals = imports.signals;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const GdkPixbuf = imports.gi.GdkPixbuf;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Lib = Me.imports.lib;
const _ = Lib.translate;

/**
 * Extension preferences initialization
 *
 * @return {Void}
 */
function init() {
    Convenience.initTranslations();
}

/**
 * Extension preferences build widget
 *
 * @return {Void}
 */
function buildPrefsWidget() {
    return new Frame();
}

/**
 * Frame constructor
 * extends Gtk.Box
 *
 * @param  {Object}
 * @return {Object}
 */
const Frame = new GObject.Class({

    Name: 'Prefs.Frame',
    GTypeName: 'Frame',
    Extends: Gtk.Box,

    /**
     * Frame initialization
     *
     * @return {Void}
     */
    _init: function() {
        this.parent({
            orientation: Gtk.Orientation.VERTICAL,
            margin: 4,
        });

        this._init_settings();
        this._init_ui();
        this._bind();
    },

    /**
     * Initialize settings
     *
     * @return {Void}
     */
    _init_settings: function() {
        this._settings = Convenience.getSettings();
        this._settings.connect('changed', Lang.bind(this, this._handle_settings_changed));
    },

    /**
     * Create user interface
     *
     * @return {Void}
     */
    _init_ui: function() {
        let css = new Gtk.CssProvider();
        css.load_from_path(Me.path + '/prefs.css');
        Gtk.StyleContext.add_provider_for_screen( Gdk.Screen.get_default(), css, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION );

        let page, notebook = new Gtk.Notebook();
        let ico = GdkPixbuf.Pixbuf.new_from_file_at_scale(Me.path + '/icons/gnome-shell-extension_gnome-radio_default-symbolic.svg', 64, 64, null);

        this.prefs = {};
        page = new Page({ name: 'gnome-shell-extension_gnome-radio_media-preferences-page-settings' });
        this.prefs.volume = new SpinButton('volume', this._settings.get_int('volume'), _("Volume"), _("Adjust player volume"));
        this.prefs.volume.name = 'gnome-shell-extension_gnome-radio_media-preferences-page-settings-row-volume';
        this.prefs.volume.connect('changed', Lang.bind(this, this._handle_widget_change));
        page.add(this.prefs.volume);
        this.prefs.notify_title = new Switch('notify-title', this._settings.get_boolean('notify-title'), _("Notify title change"), _("Display notification on player title change"));
        this.prefs.notify_title.name = 'gnome-shell-extension_gnome-radio_media-preferences-page-settings-row-notify-title';
        this.prefs.notify_title.connect('changed', Lang.bind(this, this._handle_widget_change));
        page.add(this.prefs.notify_title);
        this.prefs.notify_error = new Switch('notify-error', this._settings.get_boolean('notify-error'), _("Notify error"), _("Display notification on player error"));
        this.prefs.notify_error.name = 'gnome-shell-extension_gnome-radio_media-preferences-page-settings-row-notify-error';
        this.prefs.notify_error.connect('changed', Lang.bind(this, this._handle_widget_change));
        page.add(this.prefs.notify_error);
        notebook.append_page(page, new Label({label: _("Settings")}));

        page = new Page({ name: 'gnome-shell-extension_gnome-radio_media-preferences-page-channels' });
        page.add(new Label({label: _("Work in progress...")}));
        notebook.append_page(page, new Label({label: _("Channels")}));

        page = new Page({ name: 'gnome-shell-extension_gnome-radio_media-preferences-page-about' });
        page.add(new Label({ label: Me.metadata.name, name: 'gnome-shell-extension_gnome-radio_media-preferences-page-about-title', }));
        page.add(Gtk.Image.new_from_pixbuf(ico));
        page.add(new Label({ label: Me.metadata.description, name: 'gnome-shell-extension_gnome-radio_media-preferences-page-about-description', }));
        page.add(new Label({ label: _("Version") + ': ' + Me.metadata.version, name: 'gnome-shell-extension_gnome-radio_media-preferences-page-about-version', }));
        page.add(new Label({ label: Me.metadata.maintainer + ' <a href="mailto:' + Me.metadata.email + '">&lt;' + Me.metadata.email + '&gt;</a>', name: 'gnome-shell-extension_gnome-radio_media-preferences-page-about-maintainer', }));
        page.add(new Label({ label: '<a href="' + Me.metadata.url + '">' + Me.metadata.url + '</a>', name: 'gnome-shell-extension_gnome-radio_media-preferences-page-about-webpage', }));
        notebook.append_page(page, new Label({label: _("About")}));

        this.add(notebook);
        this.show_all();
    },

    /**
     * Bind events
     *
     * @return {Void}
     */
    _bind: function() {
        this.connect('destroy', Lang.bind(this, this._handle_destroy));
    },

    /**
     * Widget destroy event handler
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_destroy: function(widget, event) {
        this._settings.run_dispose();
    },

    /**
     * Settings changed event handler
     *
     * @param  {Object} settings
     * @param  {String} key
     * @return {Void}
     */
    _handle_settings_changed: function(settings, key) {
        let value = settings.get_value(key);
        let method, type = value.get_type_string();
        if (type === 'i') method = 'get_int';
        else if (type === 'b') method = 'get_boolean';

        if (method && this.prefs[key])
            this.prefs[key].value = settings[method](key);
    },

    /**
     * Widget change event handler
     *
     * @param  {Object} widget
     * @param  {String} key
     * @param  {Mixed}  value
     * @param  {String} type
     * @return {Void}
     */
    _handle_widget_change: function(widget, key, value, type) {
        this._settings['set_' + type](key, value);
    },

});

/**
 * Page constructor
 * extends Gtk.Box
 *
 * @param  {Object}
 * @return {Object}
 */
const Page = new GObject.Class({

    Name: 'Prefs.Page',
    GTypeName: 'Page',
    Extends: Gtk.Box,

    /**
     * Constructor
     *
     * @param  {Object} options (optional)
     * @return {Void}
     */
    _init: function(options) {
        let o = options || {};
        if (!('orientation' in options)) o.orientation = Gtk.Orientation.VERTICAL;
        if (!('margin' in options)) o.margin = 16;
        if (!('expand' in options)) o.expand = true;

        this.parent(o);
    },

});

/**
 * Label constructor
 * extends Gtk.Label
 *
 * @param  {Object}
 * @return {Object}
 */
const Label = new GObject.Class({

    Name: 'Prefs.Label',
    GTypeName: 'Label',
    Extends: Gtk.Label,

    /**
     * Constructor
     *
     * @param  {Object} options (optional)
     * @return {Void}
     */
    _init: function(options) {
        let o = options || {};
        if (!('label' in options)) o.label = 'undefined';

        this.parent(o);
        this.set_markup(this.get_text());
    },

});

/**
 * Widget constructor
 * extends Gtk.Box
 *
 * @param  {Object}
 * @return {Object}
 */
const Widget = new GObject.Class({

    Name: 'Prefs.Widget',
    GTypeName: 'Widget',
    Extends: Gtk.Box,

    /**
     * Constructor
     *
     * @param  {String} key
     * @param  {String} text
     * @param  {String} tooltip
     * @return {Void}
     */
    _init: function(key, text, tooltip) {
        this.parent({
            orientation: Gtk.Orientation.HORIZONTAL,
            margin: 4,
        });

        this._key = key;
        this._label = new Gtk.Label({ label: text, xalign: 0, tooltip_text: tooltip });
        this._widget = null;

        this.pack_start(this._label, true, true, 0);
    },

    /**
     * Value getter
     *
     * @return {Boolean}
     */
    get value() {
        return this._widget.value;
    },

    /**
     * Value setter
     *
     * @param  {Mixed} value
     * @return {Void}
     */
    set value(value) {
        this._widget.value = value;
    },

    /**
     * Widget change event handler
     *
     * @param  {Object} widget
     * @return {Void}
     */
    _handle_change: function(widget) {
        this.emit('changed', this._key, widget.value, typeof widget.value);
    },

});

Signals.addSignalMethods(Widget.prototype);

/**
 * Switch constructor
 * extends Widget
 *
 * @param  {Object}
 * @return {Object}
 */
const Switch = new GObject.Class({

    Name: 'Prefs.Switch',
    GTypeName: 'Switch',
    Extends: Widget,

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function(key, value, text, tooltip) {
        this.parent(key, text, tooltip);

        this._widget = new Gtk.Switch({ active: value });
        this._widget.connect('notify::active', Lang.bind(this, this._handle_change));
        this.add(this._widget);
    },

    /**
     * Widget change event handler
     *
     * @param  {Object} widget
     * @return {Void}
     */
    _handle_change: function(widget) {
        this.emit('changed', this._key, widget.active, 'boolean');
    },

    /**
     * Value getter
     *
     * @return {Boolean}
     */
    get value() {
        return this._widget.active;
    },

    /**
     * Value setter
     *
     * @param  {Boolean} value
     * @return {Void}
     */
    set value(value) {
        this._widget.active = value;
    },

});

/**
 * SpinButton constructor
 * extends Widget
 *
 * @param  {Object}
 * @return {Object}
 */
const SpinButton = new GObject.Class({

    Name: 'Prefs.SpinButton',
    GTypeName: 'SpinButton',
    Extends: Widget,

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function(key, value, text, tooltip) {
        this.parent(key, text, tooltip);

        this._widget = new Gtk.SpinButton({ adjustment: new Gtk.Adjustment({ lower: 0, upper: 100, step_increment: 1 }), climb_rate: 1.0, digits: 0, snap_to_ticks: true, });
        this._widget.value = value;
        this._widget.connect('value-changed', Lang.bind(this, this._handle_change));
        this.add(this._widget);
    },

    /**
     * Widget change event handler
     *
     * @param  {Object} widget
     * @return {Void}
     */
    _handle_change: function(widget) {
        this.emit('changed', this._key, widget.value, 'int');
    },

});
