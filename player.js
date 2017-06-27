/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

// strict mode
'use strict';

// import modules
const Lang = imports.lang;
const Signals = imports.signals;
const Gst = imports.gi.Gst;
const Soup = imports.gi.Soup;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.lib;
const _ = Lib.translate;

// init gstreamer
Gst.init(null, 0);

/**
 * State enum
 *
 * @type {Object}
 */
const State = Object.freeze({
    DEFAULT: 0,
    STOPPED: 1,
    GETTING_METADATA: 2,
    BUFFERING: 3,
    PLAYING: 4,
});

/**
 * Player.Player constructor
 *
 * @param  {Object}
 * @return {Object}
 */
const Player = new Lang.Class({

    Name: 'Player.Player',

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function() {
        this.playbin = Gst.ElementFactory.make('playbin', null);
        this.bus = this.playbin.get_bus();
        this.bus.add_signal_watch();
        this.bus.connect('message', Lang.bind(this, this._handle_bus_message));

        this._state = State.STOPPED;
        this._playlist = null;
        this._tags = null;
    },

    /**
     * Destructor
     *
     * @return {Void}
     */
    destroy: function() {
        this.stop();

        this.bus = null;
        this.playbin = null;
    },

    /**
     * Handle bus message
     *
     * @param  {Object} bus
     * @param  {Object} message
     * @return {Void}
     */
    _handle_bus_message: function(bus, message) {
        if (typeof message !== 'object') return;
        // else if (message.type === Gst.MessageType.ANY) this._handle_bus_message_any(bus, message);
        // else if (message.type === Gst.MessageType.APPLICATION) this._handle_bus_message_application(bus, message);
        // else if (message.type === Gst.MessageType.ASYNC_DONE) this._handle_bus_message_async_done(bus, message);
        // else if (message.type === Gst.MessageType.ASYNC_START) this._handle_bus_message_async_start(bus, message);
         else if (message.type === Gst.MessageType.BUFFERING) this._handle_bus_message_buffering(bus, message);
        // else if (message.type === Gst.MessageType.CLOCK_LOST) this._handle_bus_message_clock_lost(bus, message);
        // else if (message.type === Gst.MessageType.CLOCK_PROVIDE) this._handle_bus_message_clock_provide(bus, message);
        // else if (message.type === Gst.MessageType.DEVICE_ADDED) this._handle_bus_message_device_added(bus, message);
        // else if (message.type === Gst.MessageType.DEVICE_REMOVED) this._handle_bus_message_device_removed(bus, message);
        // else if (message.type === Gst.MessageType.DURATION_CHANGED) this._handle_bus_message_duration_changed(bus, message);
        // else if (message.type === Gst.MessageType.ELEMENT) this._handle_bus_message_element(bus, message);
        else if (message.type === Gst.MessageType.EOS) this._handle_bus_message_eos(bus, message);
        else if (message.type === Gst.MessageType.ERROR) this._handle_bus_message_error(bus, message);
        // else if (message.type === Gst.MessageType.EXTENDED) this._handle_bus_message_extended(bus, message);
        // else if (message.type === Gst.MessageType.HAVE_CONTEXT) this._handle_bus_message_have_context(bus, message);
        // else if (message.type === Gst.MessageType.INFO) this._handle_bus_message_info(bus, message);
        // else if (message.type === Gst.MessageType.LATENCY) this._handle_bus_message_latency(bus, message);
        // else if (message.type === Gst.MessageType.NEED_CONTEXT) this._handle_bus_message_need_context(bus, message);
        // else if (message.type === Gst.MessageType.NEW_CLOCK) this._handle_bus_message_new_clock(bus, message);
        // else if (message.type === Gst.MessageType.PROGRESS) this._handle_bus_message_progress(bus, message);
        // else if (message.type === Gst.MessageType.QOS) this._handle_bus_message_qos(bus, message);
        // else if (message.type === Gst.MessageType.REQUEST_STATE) this._handle_bus_message_request_state(bus, message);
        // else if (message.type === Gst.MessageType.RESET_TIME) this._handle_bus_message_reset_time(bus, message);
        // else if (message.type === Gst.MessageType.SEGMENT_DONE) this._handle_bus_message_segment_done(bus, message);
        // else if (message.type === Gst.MessageType.SEGMENT_START) this._handle_bus_message_segment_start(bus, message);
        else if (message.type === Gst.MessageType.STATE_CHANGED) this._handle_bus_message_state_changed(bus, message);
        // else if (message.type === Gst.MessageType.STATE_DIRTY) this._handle_bus_message_state_dirty(bus, message);
        // else if (message.type === Gst.MessageType.STEP_DONE) this._handle_bus_message_step_done(bus, message);
        // else if (message.type === Gst.MessageType.STEP_START) this._handle_bus_message_step_start(bus, message);
        // else if (message.type === Gst.MessageType.STREAM_START) this._handle_bus_message_stream_start(bus, message);
        // else if (message.type === Gst.MessageType.STREAM_STATUS) this._handle_bus_message_stream_status(bus, message);
        // else if (message.type === Gst.MessageType.STRUCTURE_CHANGE) this._handle_bus_message_structure_change(bus, message);
        else if (message.type === Gst.MessageType.TAG) this._handle_bus_message_tag(bus, message);
        // else if (message.type === Gst.MessageType.TOC) this._handle_bus_message_toc(bus, message);
        // else if (message.type === Gst.MessageType.UNKNOWN) this._handle_bus_message_unknown(bus, message);
        // else if (message.type === Gst.MessageType.WARNING) this._handle_bus_message_warning(bus, message);
    },

    /**
     * Handle bus buffering message:
     * set state, emit state_change, emit
     * buffering
     *
     * @param  {Object} bus
     * @param  {Object} message
     * @return {Void}
     */
    _handle_bus_message_buffering: function(bus, message) {
        let parse = message.parse_buffering();

        // set buffering state
        let old_state = this.state();

        // change state?
        this._state = State.BUFFERING;
        if (old_state !== this.state())
            this.emit('state_changed', {
                from: old_state,
                state: this.state(),
                str: this._state_to_string(this.state()),
            });

        // emit buffering
        this.emit('buffering', {
            percent: parse,
        });

        // still buffering?
        if (parse !== 100)
            return;

        // change state
        this._state = State.PLAYING;
        this.emit('state_changed', {
            from: State.BUFFERING,
            state: this.state(),
            str: this._state_to_string(this.state()),
        });
    },

    /**
     * Handle bus eos message:
     * remove current item from playlist and
     * play next one (if no next item emit
     * eos)
     *
     * @param  {Object} bus
     * @param  {Object} message
     * @return {Void}
     */
    _handle_bus_message_eos: function(bus, message) {
        this.playbin.set_state(Gst.State.NULL);

        this._playlist.shift();
        if (this._playlist.length) {
            this.playbin.set_property('uri', this._playlist[0]);
            this.playbin.set_state(Gst.State.PLAYING);

            return;
        }

        this.emit('eos');
    },

    /**
     * Handle bus error message:
     * remove current item from playlist and
     * play next one (if no next item emit
     * error)
     *
     * @param  {Object} bus
     * @param  {Object} message
     * @return {Void}
     */
    _handle_bus_message_error: function(bus, message) {
        this.playbin.set_state(Gst.State.NULL);

        this._playlist.shift();
        if (this._playlist.length) {
            this.playbin.set_property('uri', this._playlist[0]);
            this.playbin.set_state(Gst.State.PLAYING);

            return;
        }

        let parse = message.parse_error();
        let error = parse[0];
        let debug = parse[1];

        this.emit('error', {
            error: error,
            debug: debug,
        });

        let old_state = this.state();
        this._state = State.STOPPED;

        if (old_state !== this.state())
            this.emit('state_changed', {
                from: old_state,
                state: this.state(),
                str: this._state_to_string(this.state()),
            });
    },

    /**
     * Handle bus state_changed message:
     * check if state really changed and
     * emit signal
     *
     * @param  {Object} bus
     * @param  {Object} message
     * @return {Void}
     */
    _handle_bus_message_state_changed: function(bus, message) {
        let parse = message.parse_state_changed();
        let old_state = parse[0];
        let state = parse[1];
        let pending = parse[2];

        old_state = this.state();
        this._state = this._playbin_state_to_player_state(state);

        if (old_state === this.state())
            return;

        this.emit('state_changed', {
            from: old_state,
            state: this.state(),
            str: this._state_to_string(this.state()),
        });
    },

    /**
     * Handle bus tag message:
     * parse tag list and emit signal
     *
     * @param  {Object} bus
     * @param  {Object} message
     * @return {Void}
     */
    _handle_bus_message_tag: function(bus, message) {
        this._tags = this._tags || {};

        let parse = message.parse_tag();
        let len = parse.n_tags();

        for (var i = 0; i < len; i++) {
            let key = parse.nth_tag_name(i);
            let arr = parse.get_string(key);
            let ok = arr[0];
            let val = arr[1];

            if (ok)
                this._tags[key] = val;
            else
                delete this._tags[key];

            this.emit('tags::' + key, {
                value: ok ? val : null,
            });
        }

        this.emit('tags', {
            tags: this._tags,
        });
    },

    /**
     * Handle parser refresh signal:
     * parse url and get playlist
     *
     * @param  {Object} parser
     * @param  {Object} event
     * @return {Void}
     */
    _handle_parser_refresh: function(parser, event) {
        this._playlist = null;

        // calceled
        if (this.state() <= State.STOPPED)
            return;

        // iterate parsers and try to find the right one
        let validators = [ URLParserASF, URLParserASX, URLParserM3U, URLParserPLS, URLParserRAM, ];
        for (let i in validators) {
            if (validators[i].prototype.validate.call(parser)) {
                this._playlist = validators[i].prototype.playlist.call(parser);
                break;
            }
        }

        // no parser found, not a playlist?
        // add url to playlist, maybe it's valid media stream
        // (playbin will handle error if necessary)
        if (!this._playlist)
            this._playlist = [ event.url ];

        // playlist found, let's try to play it
        this.playbin.set_property('uri', this._playlist[0]);
        this.playbin.set_state(Gst.State.PLAYING);
    },

    /**
     * Conver playbin state to player state
     *
     * @param  {Number} state
     * @return {Number}
     */
    _playbin_state_to_player_state: function(state) {
        if (state === Gst.State.NULL) return State.STOPPED;
        else if (state === Gst.State.READY) return State.BUFFERING;
        else if (state === Gst.State.PAUSED) return State.BUFFERING;
        else if (state === Gst.State.PLAYING) return State.PLAYING;

        return State.DEFAULT;
    },

    /**
     * Conver player state to string
     *
     * @param  {Number} state
     * @return {String}
     */
    _state_to_string: function(state) {
        if (state === State.DEFAULT) return _("DEFAULT");
        else if (state === State.STOPPED) return _("STOPPED");
        else if (state === State.GETTING_METADATA) return _("GETTING_METADATA");
        else if (state === State.BUFFERING) return _("BUFFERING");
        else if (state === State.PLAYING) return _("PLAYING");

        return _("DEFAULT");
    },

    /**
     * Property url getter
     *
     * @return {String}
     */
    get url() {
        return this._url;
    },

    /**
     * Property url setter
     *
     * @param  {String} value
     * @return {Void}
     */
    set url(value) {
        this._url = value;
    },

    /**
     * Property volume getter
     *
     * @return {Number}
     */
    get volume() {
        return this.playbin.volume * 100;
    },

    /**
     * Property volume setter
     *
     * @param  {Number} value
     * @return {Void}
     */
    set volume(value) {
        let old_volume = this.volume;
        this.playbin.volume = value / 100;

        if (old_volume === this.volume)
            return;

        this.emit('volume', {
            value: this.volume,
        });
    },

    /**
     * Get player state
     *
     * @return {Number}
     */
    state: function() {
        return this._state;
    },

    /**
     * Start player:
     * create and refresh parser (parser events
     * will do the rest)
     *
     * @return {Void}
     */
    start: function() {
        if (this.state() > State.STOPPED)
            return;

        let old_state = this.state();
        this._state = State.GETTING_METADATA;

        this.emit('state_changed', {
            from: old_state,
            state: this.state(),
            str: this._state_to_string(this.state()),
        });

        let parser = new URLParser(this.url);
        parser.connect('refresh', Lang.bind(this, this._handle_parser_refresh));
        parser.refresh();
    },

    /**
     * Stop player
     *
     * @return {Void}
     */
    stop: function() {
        if (this.state() <= State.STOPPED)
            return;

        let old_state = this.state();
        this._state = State.STOPPED;

        this._playlist = [];
        this.playbin.set_state(Gst.State.NULL);

        this.emit('state_changed', {
            from: old_state,
            state: this.state(),
            str: this._state_to_string(this.state()),
        });
    },

});

Signals.addSignalMethods(Player.prototype);

/**
 * Player.URLParser constructor
 *
 * @param  {Object}
 * @return {Object}
 */
const URLParser = new Lang.Class({

    Name: 'Player.URLParser',

    /**
     * Constructor
     *
     * @param  {String} url
     * @return {Void}
     */
    _init: function(url) {
        this._url = url;
        this._session = null;
        this._request = null;
        this._status_code = null;
        this._headers = null;
        this._body = null;
        this._error = null;
        this._playlist = null;
    },

    /**
     * Cancel pending request
     *
     * @return {Void}
     */
    cancel: function() {
        if (!this._session)
            return;

        this._session.cancel_message(this._request, Soup.Status.CANCELLED);

        this._request = null;
        this._session = null;
    },

    /**
     * Send request
     *
     * @param  {Boolean} full (optional)
     * @return {Void}
     */
    refresh: function() {
        this.cancel();

        // clear properties
        this._status_code = null;
        this._headers = null;
        this._body = null;
        this._error = null;
        this._playlist = null;

        // init and send request
        this._session = new Soup.SessionAsync();
        this._request = Soup.Message.new('GET', this._url);
        this._request.connect('got_headers', Lang.bind(this, this._handle_request_got_headers));
        this._request.connect('got_chunk', Lang.bind(this, this._handle_request_got_chunk));
        this._session.queue_message(this._request, Lang.bind(this, this._handle_request_finished));
    },

    /**
     * Get url
     *
     * @return {String}
     */
    url: function() {
        return this._url;
    },

    /**
     * Get request headers
     *
     * @param  {String} key (optional)
     * @return {Mixed}
     */
    headers: function(key) {
        if (typeof key !== 'undefined')
            return (typeof this._headers[key] === 'undefined') ? null : this._headers[key];

        return this._headers;
    },

    /**
     * Get Content-Type header
     *
     * @return {String}
     */
    ctype: function() {
        let result = this.headers('Content-Type') || this.headers('Content-type') || this.headers('content-type');
        if (result)
            result = result.split(';')[0];

        return result;
    },

    /**
     * Get Content-Length header
     *
     * @return {String}
     */
    clength: function() {
        let result = this.headers('Content-Length') || this.headers('Content-length') || this.headers('content-length');
        if (result)
            result = result.split(';')[0];

        return result;
    },

    /**
     * Get request body
     *
     * @return {String}
     */
    body: function() {
        return this._body;
    },

    /**
     * Get request error
     *
     * @return {Mixed}
     */
    error: function() {
        return this._error;
    },

    /**
     * Validate url
     *
     * @return {Boolean}
     */
    validate: function() {
        return false;
    },

    /**
     * Parse playlist from url
     *
     * @return {Array}
     */
    playlist: function() {
        return this._playlist;
    },

    /**
     * Handle request got_headers signal:
     * set status code and headers (and error on
     * non 200 status code)
     *
     * @param  {Object} message
     * @return {Void}
     */
    _handle_request_got_headers: function(message) {
        let headers = {};
        message.response_headers.foreach(function(key) {
            headers[key] = message.response_headers.get(key);
        });

        this._status_code = message.status_code;
        this._headers = headers;

        // non OK status?
        if (this._status_code === Soup.Status.OK)
            return;

        this._error = 'Not 200 status code.';
        this.cancel();
    },

    /**
     * Handle request got_chunk signal:
     * cancel request on non text data
     *
     * @param  {Object} message
     * @param  {Object} buffer
     * @return {Void}
     */
    _handle_request_got_chunk: function(message, buffer) {
        try {
            buffer.get_data().toString();
        }
        catch(e) {
            this.cancel();
        }
    },

    /**
     * Handle request finished signal:
     * set body and handle errors - allow cancel
     * and status code bigger than 100 (those
     * status codes are handled by got_headers
     * event))
     *
     * @param  {Object} session
     * @param  {Object} message
     * @return {Void}
     */
    _handle_request_finished: function(session, message) {
        this._body = message.response_body.data;

        // handle errors:
        // allow cancel and status code bigger than 100 (those
        // status codes will be handled by got_headers event)
        if (message.status_code === Soup.Status.NONE) this._error = 'No status available. (Eg, the message has not been sent yet)';
        //if (message.status_code === Soup.Status.CANCELLED) this._error = 'Message was cancelled locally';
        if (message.status_code === Soup.Status.CANT_RESOLVE) this._error = 'Unable to resolve destination host name';
        if (message.status_code === Soup.Status.CANT_RESOLVE_PROXY) this._error = 'Unable to resolve proxy host name';
        if (message.status_code === Soup.Status.CANT_CONNECT) this._error = 'Unable to connect to remote host';
        if (message.status_code === Soup.Status.CANT_CONNECT_PROXY) this._error = 'Unable to connect to proxy';
        if (message.status_code === Soup.Status.SSL_FAILED) this._error = 'SSL/TLS negotiation failed';
        if (message.status_code === Soup.Status.IO_ERROR) this._error = 'A network error occurred, or the other end closed the connection unexpectedly';
        if (message.status_code === Soup.Status.MALFORMED) this._error = 'Malformed data (usually a programmer error)';
        if (message.status_code === Soup.Status.TRY_AGAIN) this._error = 'Used internally';
        if (message.status_code === Soup.Status.TOO_MANY_REDIRECTS) this._error = 'There were too many redirections';
        if (message.status_code === Soup.Status.TLS_FAILED) this._error = 'Used internally';

        // close connection
        this.cancel();

        // emit signal
        this.emit('refresh', {
            url: this._url,
            status_code: this._status_code,
            headers: this._headers,
            body: this._body,
            error: this._error,
        });
    },

});

Signals.addSignalMethods(URLParser.prototype);

const URLParserASF = new Lang.Class({

    Name: 'Player.URLParserASF',
    Extends: URLParser,

    validate: function() {
        if (this.error())
            return false;
        if (!this.body())
            return false;

        // invalid content type
        let valid = [ 'application/octet-stream', 'video/x-ms-asf' ];
        if (valid.indexOf(this.ctype()) === -1)
            return false;

        // check file content
        if (this.body().trim().toLowerCase().substr(0, 11) !== '[reference]')
            return false;

        // test passed
        return true;
    },

    playlist: function() {
        // already parsed
        if (this._playlist)
            return this._playlist;

        // invalid
        if (!URLParserASF.prototype.validate.call(this))
            return this._playlist;

        // parse
        let match, pattern = /^Ref\d+=(.*)/gmi;
        this._playlist = [];

        while ((match = pattern.exec(this.body())) !== null) {
            //if (url.endswith('?MSWMExt=.asf')):
            //    url = re.sub('^http://', 'mms://', url)

            this._playlist.push(match[1]);
        }

        // ...finally
        return this._playlist;
    },

});

const URLParserASX = new Lang.Class({

    Name: 'Player.URLParserASX',
    Extends: URLParser,

    validate: function() {
        if (this.error())
            return false;
        if (!this.body())
            return false;

        // invalid content type
        let valid = [ 'application/octet-stream', 'audio/x-ms-wax', 'video/x-ms-wvx', 'video/x-ms-wmv', 'video/x-ms-asf' ];
        if (valid.indexOf(this.ctype()) === -1)
            return false;

        // chech file content
        if (this.body().trim().toLowerCase().substr(0, 4) !== '<asx')
            return false;

        // test passed
        return true;
    },

    playlist: function() {
        // already parsed
        if (this._playlist)
            return this._playlist;

        // invalid
        if (!URLParserASX.prototype.validate.call(this))
            return this._playlist;

        // parse
        let match, pattern = /<ref\s+?href\s*=\s*["'](.*)?["']/gi;
        this._playlist = [];

        while ((match = pattern.exec(this.body())) !== null) {
            //if (url.endswith('?MSWMExt=.asf')):
            //    url = re.sub('^http://', 'mms://', url)

            this._playlist.push(match[1]);
        }

        // ...finally
        return this._playlist;
    },

});

const URLParserM3U = new Lang.Class({

    Name: 'Player.URLParserM3U',
    Extends: URLParser,

    validate: function() {
        if (this.error())
            return false;
        if (!this.body())
            return false;

        // invalid content type
        let valid = [ 'application/octet-stream', 'audio/mpegurl', 'audio/x-mpegurl' ];
        if (valid.indexOf(this.ctype()) === -1)
            return false;

        // chech file content
        if (!/^https?:\/\/.*/gmi.test(this.body()))
            return false;

        // test passed
        return true;
    },

    playlist: function() {
        // already parsed
        if (this._playlist)
            return this._playlist;

        // invalid
        if (!URLParserM3U.prototype.validate.call(this))
            return this._playlist;

        // parse
        let match = this.body().match(/^https?:\/\/.*/gmi);
        this._playlist = match || [];

        // ...finally
        return this._playlist;
    },

});

const URLParserPLS = new Lang.Class({

    Name: 'Player.URLParserPLS',
    Extends: URLParser,

    validate: function() {
        if (this.error())
            return false;
        if (!this.body())
            return false;

        // invalid content type
        let valid = [ 'application/octet-stream', 'audio/x-scpls', 'application/pls+xml' ];
        if (valid.indexOf(this.ctype()) === -1)
            return false;

        // chech file content
        if (this.body().trim().toLowerCase().substr(0, 10) !== '[playlist]')
            return false;

        // test passed
        return true;
    },

    playlist: function() {
        // already parsed
        if (this._playlist)
            return this._playlist;

        // invalid
        if (!URLParserPLS.prototype.validate.call(this))
            return this._playlist;

        // parse
        let match, pattern = /^File\d+=(.*)/gmi;
        this._playlist = [];

        while ((match = pattern.exec(this.body())) !== null) {
            this._playlist.push(match[1]);
        }

        // ...finally
        return this._playlist;
    },

});

const URLParserRAM = new Lang.Class({

    Name: 'Player.URLParserRAM',
    Extends: URLParser,

    validate: function() {
        if (this.error())
            return false;
        if (!this.body())
            return false;

        // invalid content type
        let valid = [ 'application/octet-stream', 'audio/x-pn-realaudio', 'audio/vnd.rn-realaudio' ];
        if (valid.indexOf(this.ctype()) === -1)
            return false;

        // chech file content
        if (!/^rtsp|https?:\/\/.*/gmi.test(this.body()))
            return false;

        // test passed
        return true;
    },

    playlist: function() {
        // already parsed
        if (this._playlist)
            return this._playlist;

        // invalid
        if (!URLParserRAM.prototype.validate.call(this))
            return this._playlist;

        // parse
        let match = this.body().match(/^rtsp|https?:\/\/.*/gmi);
        this._playlist = match || [];

        // ...finally
        return this._playlist;
    },

});
