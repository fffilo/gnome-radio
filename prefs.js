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
const Config = Me.imports.config;
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
    return new Widget();
}

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
     * Widget initialization
     *
     * @return {Void}
     */
    _init: function() {
        this.parent({ orientation: Gtk.Orientation.VERTICAL, });

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
        this.settings = Convenience.getSettings();
        this.settings.connect('changed', Lang.bind(this, this._handle_settings_changed));
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

        let notebook = new Gtk.Notebook();
        this.ui = {};
        notebook.append_page(this._page_settings(), new Gtk.Label({ label: _("Settings"), }));
        notebook.append_page(this._page_channels(), new Gtk.Label({ label: _("Channels"), }));
        notebook.append_page(this._page_about(), new Gtk.Label({ label: _("About"), }));
        this.add(notebook);

        this.show_all();
    },

    /**
     * Create new page
     *
     * @return {Object}
     */
    _page: function() {
        let page = new Box();
        page.expand = true;
        page.get_style_context().add_class('page');

        return page;
    },

    /**
     * Create new settings page
     *
     * @return {Object}
     */
    _page_settings: function() {
        this.ui.settings = {};
        this.ui.settings.page = this._page();
        this.ui.settings.page.get_style_context().add_class('page_settings');

        this.ui.settings.volume = new InputSpinButton('volume', this.settings.get_int('volume'), _("Volume"), _("Adjust player volume"));
        this.ui.settings.volume.name = 'gnome-shell-extension_gnome-radio_media-preferences-page-settings-row-volume';
        this.ui.settings.volume.connect('changed', Lang.bind(this, this._handle_widget_change));
        this.ui.settings.page.actor.add(this.ui.settings.volume);

        this.ui.settings.notify_title = new InputSwitch('notify-title', this.settings.get_boolean('notify-title'), _("Notify title change"), _("Display notification on player title change"));
        this.ui.settings.notify_title.name = 'gnome-shell-extension_gnome-radio_media-preferences-page-settings-row-notify-title';
        this.ui.settings.notify_title.connect('changed', Lang.bind(this, this._handle_widget_change));
        this.ui.settings.page.actor.add(this.ui.settings.notify_title);

        this.ui.settings.notify_error = new InputSwitch('notify-error', this.settings.get_boolean('notify-error'), _("Notify error"), _("Display notification on player error"));
        this.ui.settings.notify_error.name = 'gnome-shell-extension_gnome-radio_media-preferences-page-settings-row-notify-error';
        this.ui.settings.notify_error.connect('changed', Lang.bind(this, this._handle_widget_change));
        this.ui.settings.page.actor.add(this.ui.settings.notify_error);

        return this.ui.settings.page;
    },

    /**
     * Create new channels page
     *
     * @return {Object}
     */
    _page_channels: function() {
        this.ui.channels = {};
        this.ui.channels.page = this._page();
        this.ui.channels.page.get_style_context().add_class('page_channels');
        this.ui.channels.page.actor.set_orientation(Gtk.Orientation.HORIZONTAL);

        let scroll = new Scroll();
        this.ui.channels.treeview = new Channels();
        let select = this.ui.channels.treeview.get_selection();
        select.connect('changed', Lang.bind(this, this._handle_channel_treeview_selection_changed));
        scroll.actor.add(this.ui.channels.treeview);
        this.ui.channels.page.actor.add(scroll);

        let box = new Box();
        box.get_style_context().add_class('buttons');
        this.ui.channels.page.actor.add(box);

        this.ui.channels.btnCategory = new Gtk.Button({ label: _("Add Category"), });
        this.ui.channels.btnCategory.connect('clicked', Lang.bind(this, this._handle_channels_button_category_click));
        box.actor.add(this.ui.channels.btnCategory);

        this.ui.channels.btnChannel = new Gtk.Button({ label: _("Add Channel"), });
        this.ui.channels.btnChannel.connect('clicked', Lang.bind(this, this._handle_channels_button_channel_click));
        box.actor.add(this.ui.channels.btnChannel);

        this.ui.channels.btnEdit = new Gtk.Button({ label: _("Edit"), });
        this.ui.channels.btnEdit.connect('clicked', Lang.bind(this, this._handle_channels_button_edit_click));
        box.actor.add(this.ui.channels.btnEdit);

        this.ui.channels.btnRemove = new Gtk.Button({ label: _("Remove"), });
        this.ui.channels.btnRemove.connect('clicked', Lang.bind(this, this._handle_channels_button_remove_click));
        box.actor.add(this.ui.channels.btnRemove);

        this.ui.channels.separator = new Box();
        this.ui.channels.separator.get_style_context().add_class('separator');
        box.actor.add(this.ui.channels.separator);

        this.ui.channels.btnReorderUp = new Gtk.Button({ label: _("Up"), });
        this.ui.channels.btnReorderUp.connect('clicked', Lang.bind(this, this._handle_channels_button_reorder_up_click));
        box.actor.add(this.ui.channels.btnReorderUp);

        this.ui.channels.btnReorderDown = new Gtk.Button({ label: _("Down"), });
        this.ui.channels.btnReorderDown.connect('clicked', Lang.bind(this, this._handle_channels_button_reorder_down_click));
        box.actor.add(this.ui.channels.btnReorderDown);

        this.ui.channels.treeview.refresh();
        this._handle_channel_treeview_selection_changed(select);

        return this.ui.channels.page;
    },

    /**
     * Create new about page
     *
     * @return {Object}
     */
    _page_about: function() {
        this.ui.about = {};
        this.ui.about.page = this._page();
        this.ui.about.page.get_style_context().add_class('page_about');

        this.ui.about.title = new Label({ label: Me.metadata.name, });
        this.ui.about.title.get_style_context().add_class('title');
        this.ui.about.page.actor.add(this.ui.about.title);

        let ico = GdkPixbuf.Pixbuf.new_from_file_at_scale(Me.path + '/icons/gnome-shell-extension_gnome-radio_default-symbolic.svg', 64, 64, null);
        this.ui.about.icon = Gtk.Image.new_from_pixbuf(ico);
        this.ui.about.icon.get_style_context().add_class('icon');
        this.ui.about.page.actor.add(this.ui.about.icon);

        this.ui.about.desc = new Label({ label: Me.metadata.description, });
        this.ui.about.desc.get_style_context().add_class('description');
        this.ui.about.page.actor.add(this.ui.about.desc);

        this.ui.about.version = new Label({ label: _("Version") + ': ' + Me.metadata.version, });
        this.ui.about.version.get_style_context().add_class('version');
        this.ui.about.page.actor.add(this.ui.about.version);

        this.ui.about.author = new Label({ label: Me.metadata.maintainer + ' <a href="mailto:' + Me.metadata.email + '">&lt;' + Me.metadata.email + '&gt;</a>', });
        this.ui.about.author.get_style_context().add_class('author');
        this.ui.about.page.actor.add(this.ui.about.author);

        this.ui.about.webpage = new Label({ label: '<a href="' + Me.metadata.url + '">' + Me.metadata.url + '</a>', });
        this.ui.about.webpage.get_style_context().add_class('webpage');
        this.ui.about.page.actor.add(this.ui.about.webpage);

        return this.ui.about.page;
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
     * Open category edit dialog
     * and get response
     *
     * @return {Object}
     */
    _dialog_category: function(category, title) {
        if (typeof category === 'undefined') category = _("Unknown Category");
        if (typeof title === 'undefined') title = _("New Category Title");

        let response, dialog = new DialogInput(this, 'category', _("Parent Category"), category, 'title', _("Title"), title);
        dialog._items[0].widget._widget.set_sensitive(false);
        while (response = dialog.run()) {
            if (response && !response.title.trim())
                continue;

            break;
        }
        dialog.destroy();

        return response;
    },

    /**
     * Open channel edit dialog
     * and get response
     *
     * @return {Object}
     */
    _dialog_channel: function(category, title, url) {
        if (typeof category === 'undefined') category = _("Unknown Category");
        if (typeof title === 'undefined') title = _("New Channel Title");
        if (typeof url === 'undefined') url = 'http://';

        let response, dialog = new DialogInput(this, 'category', _("Parent Category"), category, 'title', _("Title"), title, 'url', 'URL', url);
        dialog._items[0].widget._widget.set_sensitive(false);
        while (response = dialog.run()) {
            if (response && (!response.title.trim() || !response.url.trim()))
                continue;

            break;
        }
        dialog.destroy();

        return response;
    },

    /**
     * Widget destroy event handler
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_destroy: function(widget, event) {
        this.ui.channels.treeview.save();
        this.settings.run_dispose();
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

        if (method && this.ui.settings[key])
            this.ui.settings[key].value = settings[method](key);
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
        let old_value = this.settings['get_' + type](key);

        if (old_value != value)
            this.settings['set_' + type](key, value);
    },

    /**
     * Treeview selection change event handler
     *
     * @param  {Object} widget
     * @return {Void}
     */
    _handle_channel_treeview_selection_changed: function(widget) {
        let [any, model, iter] = widget.get_selected();
        let prev = any ? model.iter_previous(iter.copy()) : false;
        let next = any ? model.iter_next(iter.copy()) : false;

        // set button sensitivity (enable/disable) if selection exists
        this.ui.channels.btnCategory.set_sensitive(true);
        this.ui.channels.btnChannel.set_sensitive(any);
        this.ui.channels.btnEdit.set_sensitive(any);
        this.ui.channels.btnRemove.set_sensitive(any);
        this.ui.channels.btnReorderUp.set_sensitive(prev);
        this.ui.channels.btnReorderDown.set_sensitive(next);
    },

    /**
     * Add category button click event handler
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_channels_button_category_click: function(widget, event) {
        let response = this._dialog_category('');
        if (!response)
            return;

        // append and select
        let treeview = this.ui.channels.treeview;
        let select = treeview.get_selection();
        let model = treeview.get_model();
        let item = model.append(null);
        model.set(item, [0,1,2], [false, response.title, '']);
        select.select_iter(item);
    },

    /**
     * Add channel button click event handler
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_channels_button_channel_click: function(widget, event) {
        let treeview = this.ui.channels.treeview;
        let select = treeview.get_selection();
        let [any, model, iter] = select.get_selected();
        if (!any)
            return;

        // selection cell values
        let is_channel = model.get_value(iter, 0);
        let title = model.get_value(iter, 1);
        let url = model.get_value(iter, 2);

        // category is current selection or parent node
        let pok, piter, category = title;
        if (is_channel) {
            [pok, piter] = model.iter_parent(iter);
            category = model.get_value(piter, 1);
            treeview.expand_to_path(model.get_path(iter));
        }

        // dialog
        let response = this._dialog_channel(category);
        if (!response)
            return;

        // append and select
        let item = model.append(piter || iter);
        model.set(item, [0,1,2], [true, response.title, response.url]);
        treeview.expand_to_path(model.get_path(item));
        select.select_iter(item);
    },

    /**
     * Edit button click event handler
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_channels_button_edit_click: function(widget, event) {
        let treeview = this.ui.channels.treeview;
        let select = treeview.get_selection();
        let [any, model, iter] = select.get_selected();
        if (!any)
            return;

        // selection cell values
        let is_channel = model.get_value(iter, 0);
        let title = model.get_value(iter, 1);
        let url = model.get_value(iter, 2);

        // category is selection or root node
        let pok, piter, category = '';
        if (is_channel) {
            [ok, piter] = model.iter_parent(iter);
            category = model.get_value(piter, 1);
        }

        // dialog
        let response = is_channel ? this._dialog_channel(category, title, url) : this._dialog_category(category, title);
        if (!response)
            return;

        // edit
        model.set_value(iter, 1, response.title || title);
        model.set_value(iter, 2, response.url || url);
    },

    /**
     * Remove button click event handler
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_channels_button_remove_click: function(widget, event) {
        let treeview = this.ui.channels.treeview;
        let select = treeview.get_selection();
        let [any, model, iter] = select.get_selected();
        if (!any)
            return;

        // selection cell values
        let is_channel = model.get_value(iter, 0);
        let title = model.get_value(iter, 1);
        let url = model.get_value(iter, 2);

        // message
        let msg = _("Sure you want to remove channel \"%s\"?").format(title);
        if (!is_channel) msg = _("Sure you want to remove category \"%s\" with all it's channels?").format(title);

        // dialog
        let dialog = new DialogYesNo(this, msg);
        if (dialog.run())
            model.remove(iter);
        dialog.destroy();
    },

    /**
     * OrderUp button click event handler
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_channels_button_reorder_up_click: function(widget, event) {
        this._handle_channel_treeview_selection_changed(this.ui.channels.treeview.selection_reorder_up());
    },

    /**
     * OrderDown button click event handler
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_channels_button_reorder_down_click: function(widget, event) {
        this._handle_channel_treeview_selection_changed(this.ui.channels.treeview.selection_reorder_down());
    },

});

/**
 * Box constructor
 * extends Gtk.Frame
 *
 * used so we can use padding
 * property in css
 *
 * to add widget to Box use
 * actor
 *
 * @param  {Object}
 * @return {Object}
 */
const Box = new GObject.Class({

    Name: 'Prefs.Box',
    GTypeName: 'PrefsBox',
    Extends: Gtk.Frame,

    _init: function() {
        this.parent();

        this.actor = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, });
        this.actor.get_style_context().add_class('actor');
        this.add(this.actor);
    },

});

/**
 * Scroll constructor
 * extends Box
 *
 * @param  {Object}
 * @return {Object}
 */
const Scroll = new GObject.Class({

    Name: 'Prefs.Scroll',
    GTypeName: 'PrefsScroll',
    Extends: Box,

    /**
     * Constructor
     *
     * @param  {Object} options (optional)
     * @return {Void}
     */
    _init: function(options) {
        this.parent();
        this.expand = true;

        this.actor.destroy();
        this.actor = new Gtk.ScrolledWindow();
        this.actor.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
        this.actor.get_style_context().add_class('actor');
        this.add(this.actor);
    },

});

/**
 * Label constructor
 * extends Gtk.Label
 *
 * just a common Gtk.Label object
 * with markup and line wrap
 *
 * @param  {Object}
 * @return {Object}
 */
const Label = new GObject.Class({

    Name: 'Prefs.Label',
    GTypeName: 'PrefsLabel',
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
        this.set_line_wrap(true);
        this.set_justify(Gtk.Justification.CENTER);
    },

});

/**
 * DialogInfo constructor
 * extends Gtk.MessageDialog
 *
 * @param  {Object}
 * @return {Object}
 */
const DialogInfo = new GObject.Class({

    Name: 'Prefs.DialogInfo',
    GTypeName: 'PrefsDialogInfo',
    Extends: Gtk.MessageDialog,

    _init: function(widget, text) {
        this.parent({
            transient_for: widget.get_toplevel(),
            modal: true,
            buttons: Gtk.ButtonsType.OK,
            message_type: Gtk.MessageType.INFO,
            text: text,
        });
    },

    run: function() {
        return this.parent() === Gtk.ResponseType.OK;
    },

});

/**
 * DialogWarning constructor
 * extends Gtk.MessageDialog
 *
 * @param  {Object}
 * @return {Object}
 */
const DialogWarning = new GObject.Class({

    Name: 'Prefs.DialogWarning',
    GTypeName: 'PrefsDialogWarning',
    Extends: Gtk.MessageDialog,

    _init: function(widget, text) {
        this.parent({
            transient_for: widget.get_toplevel(),
            modal: true,
            buttons: Gtk.ButtonsType.OK,
            message_type: Gtk.MessageType.WARNING,
            text: text,
        });
    },

    run: function() {
        return this.parent() === Gtk.ResponseType.OK;
    },

});

/**
 * DialogError constructor
 * extends Gtk.MessageDialog
 *
 * @param  {Object}
 * @return {Object}
 */
const DialogError = new GObject.Class({

    Name: 'Prefs.DialogError',
    GTypeName: 'PrefsDialogError',
    Extends: Gtk.MessageDialog,

    _init: function(widget, text) {
        this.parent({
            transient_for: widget.get_toplevel(),
            modal: true,
            buttons: Gtk.ButtonsType.OK,
            message_type: Gtk.MessageType.ERROR,
            text: text,
        });
    },

    run: function() {
        return this.parent() === Gtk.ResponseType.OK;
    },

});

/**
 * DialogYesNo constructor
 * extends Gtk.MessageDialog
 *
 * @param  {Object}
 * @return {Object}
 */
const DialogYesNo = new GObject.Class({

    Name: 'Prefs.DialogYesNo',
    GTypeName: 'PrefsDialogYesNo',
    Extends: Gtk.MessageDialog,

    _init: function(widget, text) {
        this.parent({
            transient_for: widget.get_toplevel(),
            modal: true,
            buttons: Gtk.ButtonsType.YES_NO,
            message_type: Gtk.MessageType.QUESTION,
            text: text,
        });
    },

    run: function() {
        return this.parent() === Gtk.ResponseType.YES;
    },

});

/**
 * DialogInput constructor
 * extends Gtk.MessageDialog
 *
 * @param  {Object}
 * @return {Object}
 */
const DialogInput = new GObject.Class({

    Name: 'Prefs.DialogInput',
    GTypeName: 'PrefsDialogInput',
    Extends: Gtk.MessageDialog,

    _init: function(widget, id, label, value) {
        this.parent({
            transient_for: widget.get_toplevel(),
            modal: true,
            buttons: Gtk.ButtonsType.OK_CANCEL,
            message_type: Gtk.MessageType.OTHER,
        });

        let box = this.get_message_area();
        this._items = [];

        for (let i = 1; i < arguments.length; i += 3) {
            let item = {
                id: arguments[i + 0],
                label: arguments[i + 1],
                value: arguments[i + 2],
            }
            item.widget = new InputText(item.id, item.value, item.label);
            this._items.push(item);

            box.add(item.widget);
        }
        box.show_all();
    },

    run: function() {
        if (this.parent() === Gtk.ResponseType.OK) {
            let result = {};
            for (let i in this._items) {
                let key = this._items[i].id;
                let val = this._items[i].widget.value;

                result[key] = val;
            }

            return result;
        }

        return false;
    }

});

/**
 * Channels constructor
 * extends Gtk.TreeView
 *
 * @param  {Object}
 * @return {Object}
 */
const Channels = new GObject.Class({

    Name: 'Prefs.Channels',
    GTypeName: 'PrefsChannels',
    Extends: Gtk.TreeView,

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function() {
        let model = new Gtk.TreeStore();
        model.set_column_types([
            GObject.TYPE_BOOLEAN,   // is channel
            GObject.TYPE_STRING,    // title
            GObject.TYPE_STRING,    // url
        ]);

        this.parent({
            model: model,
            headers_visible: false,
            enable_search: false,
            reorderable: true,
            hexpand: true,
            vexpand: true
        });

        this._ui();
    },

    /**
     * Create columns
     *
     * @return {Void}
     */
    _ui: function() {
        this.set_search_column(-1);
        this.unset_rows_drag_source();
        this.unset_rows_drag_dest();

        let column = new Gtk.TreeViewColumn();
        this.append_column(column);

        let text = new Gtk.CellRendererText();
        column.pack_start(text, true);
        column.set_cell_data_func(text, Lang.bind(this, this._cell_render));
    },

    /**
     * Cell render method
     *
     * @param  {Object} column
     * @param  {Object} cell
     * @param  {Object} model
     * @param  {Object} iter
     * @return {Void}
     */
    _cell_render: function(column, cell, model, iter) {
        cell.editable = false;
        cell.text = model.get_value(iter, 1);
    },

    /**
     * Append selected row after next one
     *
     * @return {Object}
     */
    selection_reorder_down: function() {
        let select = this.get_selection();
        let [any, model, iter] = select.get_selected();
        if (!any)
            return;

        let item = iter.copy();
        if (!model.iter_next(item))
            return;

        model.move_after(iter, item);

        return select;
    },

    /**
     * Append selected row before previous one
     *
     * @return {Object}
     */
    selection_reorder_up: function() {
        let select = this.get_selection();
        let [any, model, iter] = select.get_selected();
        if (!any)
            return;

        let item = iter.copy();
        if (!model.iter_previous(item))
            return;

        model.move_before(iter, item);

        return select;
    },

    /**
     * Refresh treeview data
     *
     * @return {Void}
     */
    refresh: function() {
        let data = Config.load();
        let model = this.get_model();
        let select = this.get_selection();
        model.clear();

        try {
            for (var i in data.categories) {
                let category = data.categories[i];
                let channels = category.channels;

                // append category
                let catiter = model.append(null);
                model.set(catiter, [0,1,2], [false, category.title, '']);

                for (var j in channels) {
                    let title = channels[j].title;
                    let url = channels[j].url;

                    // append channel
                    let chaniter = model.append(catiter);
                    model.set(chaniter, [0,1,2], [true, title || '', url || '']);

                    // select
                    /*
                    if (data.playing && data.playing.title === title && data.playing.url === url) {
                        let path = model.get_path(chaniter);
                        this.expand_to_path(path);

                        let select = this.get_selection();
                        select.select_iter(chaniter);
                    }
                    */
                }
            }
        }
        catch(e) {
            Lib.logError(e);
        }
    },

    /**
     * Save current treview to json file
     *
     * @return {Void}
     */
    save: function() {
        // to do...
    },

});

/**
 * Input constructor
 * extends Box
 *
 * horizontal Gtk.Box object with label
 * and widget for editing settings
 *
 * @param  {Object}
 * @return {Object}
 */
const Input = new GObject.Class({

    Name: 'Prefs.Input',
    GTypeName: 'PrefsInput',
    Extends: Box,

    /**
     * Constructor
     *
     * @param  {String} key
     * @param  {String} text
     * @param  {String} tooltip
     * @return {Void}
     */
    _init: function(key, text, tooltip) {
        this.parent();
        this.actor.set_orientation(Gtk.Orientation.HORIZONTAL);

        this._key = key;
        this._label = new Gtk.Label({ label: text, xalign: 0, tooltip_text: tooltip || '' });
        this._widget = null;

        this.actor.pack_start(this._label, true, true, 0);
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
     * Input change event handler
     *
     * @param  {Object} widget
     * @return {Void}
     */
    _handle_change: function(widget) {
        this.emit('changed', this._key, widget.value, typeof widget.value);
    },

});

Signals.addSignalMethods(Input.prototype);

/**
 * InputText constructor
 * extends Input
 *
 * @param  {Object}
 * @return {Object}
 */
const InputText = new GObject.Class({

    Name: 'Prefs.InputText',
    GTypeName: 'PrefsInputText',
    Extends: Input,

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function(key, value, text, tooltip) {
        this.parent(key, text, tooltip);

        this._widget = new Gtk.Entry({ text: value });
        this._widget.connect('notify::active', Lang.bind(this, this._handle_change));
        this.actor.add(this._widget);
    },

    /**
     * Input change event handler
     *
     * @param  {Object} widget
     * @return {Void}
     */
    _handle_change: function(widget) {
        this.emit('changed', this._key, widget.active, 'string');
    },

    /**
     * Value getter
     *
     * @return {Boolean}
     */
    get value() {
        return this._widget.text;
    },

    /**
     * Value setter
     *
     * @param  {Boolean} value
     * @return {Void}
     */
    set value(value) {
        this._widget.text = value;
    },

});


/**
 * InputSwitch constructor
 * extends Input
 *
 * @param  {Object}
 * @return {Object}
 */
const InputSwitch = new GObject.Class({

    Name: 'Prefs.InputSwitch',
    GTypeName: 'PrefsInputSwitch',
    Extends: Input,

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function(key, value, text, tooltip) {
        this.parent(key, text, tooltip);

        this._widget = new Gtk.Switch({ active: value });
        this._widget.connect('notify::active', Lang.bind(this, this._handle_change));
        this.actor.add(this._widget);
    },

    /**
     * Input change event handler
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
 * InputSpinButton constructor
 * extends Input
 *
 * @param  {Object}
 * @return {Object}
 */
const InputSpinButton = new GObject.Class({

    Name: 'Prefs.InputSpinButton',
    GTypeName: 'PrefsInputSpinButton',
    Extends: Input,

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
        this.actor.add(this._widget);
    },

    /**
     * Input change event handler
     *
     * @param  {Object} widget
     * @return {Void}
     */
    _handle_change: function(widget) {
        this.emit('changed', this._key, widget.value, 'int');
    },

});
