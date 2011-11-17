(function($, undefined) {
    var kendo = window.kendo,
        ui = kendo.ui,
        mobile = kendo.mobile,
        support = kendo.support,
        touch = support.touch,
        os = support.mobileOS,
        TOGGLE = "toggle",
        SNAP = "snap",
        MOUSEDOWN = touch ? "touchstart" : "mousedown",
        MOUSEMOVE = touch ? "touchmove" : "mousemove",
        MOUSEUP = touch ? "touchend" : "mouseup",
        handleSelector = ".km-switch-handle",
        bindSelectors = ".km-checkbox",
        TRANSFORMSTYLE = support.transitions.css + "transform",
        extend = $.extend,
        proxy = $.proxy,
        switchAnimation = {
            all: {
                handle: handleSelector,
                animators: ".km-switch-handle,.km-switch-background",
                effects: "slideTo",
                duration: 200
            },
            android: {
                effects: {},
                duration: 0
            },
            meego: {
                effects: "slideTo",
                duration: 200
            }
        };
    switchAnimation = os.name in switchAnimation ? switchAnimation[os.name] : switchAnimation.all;

    function limitValue(value, minLimit, maxLimit) {
        return Math.max( minLimit, Math.min( maxLimit, value));
    }

    function getAxisLocation(e, element, axis) {
        return kendo.touchLocation(e)[axis] - element.offset()[axis == "x" ? "left" : "top"]
    }

    var SlidingHelper = ui.MobileWidget.extend({
        init: function (element, options) {
            var that = this;

            ui.MobileWidget.fn.init.call(that, element, options);

            if (!that.options.handle) return;

            that.axis = that.options.axis;

            that._startProxy = proxy(that._start, that);
            that._moveProxy = proxy(that._move, that);
            that._stopProxy = proxy(that._stop, that);

            element
                .bind(MOUSEDOWN, that._startProxy)
                .bind(MOUSEDOWN, proxy(that._prepare, that));
            that.bind([ SNAP ], options);
        },

        options: {
            axis: "x",
            snaps: 2
        },

        _start: function (e) {
            var that = this,
                handle = $(that.options.handle);

            e.preventDefault();
            e.stopPropagation();

            that.initialLocation = getAxisLocation(e, that.element, that.axis);
            that.width = that.element.outerWidth();
            that.halfWidth = handle.outerWidth() / 2;
            that.animators = extend({ animators: that.animators }, that.options).animators;
            that.constrain = that.width - handle.outerWidth(true);
            that.location = limitValue(that.initialLocation, that.halfWidth, that.constrain + that.halfWidth);

            $(document)
                .bind(MOUSEMOVE, that._moveProxy)
                .bind(MOUSEUP, that._stopProxy);
        },

        _move: function (e) {
            var that = this,
                axis = that.axis,
                location = getAxisLocation(e, that.element, that.axis);

            that.location = limitValue(location, that.halfWidth, that.constrain + that.halfWidth);
            that.animators.css(TRANSFORMSTYLE, "translate" + axis + "(" + (that.location - that.halfWidth) + "px)"); // TODO: remove halfWidth
        },

        _stop: function (e) {
            var that = this,
                snaps = that.options.snaps,
                snapPart = that.width / (snaps - 1);

            e.preventDefault();
            e.stopPropagation();

            if (Math.abs(that.initialLocation - getAxisLocation(e, that.element, that.axis)) > 2) {
                that.trigger(SNAP, { snapTo: Math.round(that.location / snapPart) });
            } else if (snaps == 2) {
                that.trigger(SNAP, { snapTo: !that.input[0].checked });
            }

            $(document)
                .unbind(MOUSEMOVE, that._moveProxy)
                .unbind(MOUSEUP, that._stopProxy);
        }
    });

    var Toggle = SlidingHelper.extend({
        init: function (element, options) {
            var that = this;

            SlidingHelper.fn.init.call(that, element, options);

            element = that.element;
            options = that.options;

            that._toggleProxy = proxy(that._toggle, that);
            that._triggerProxy = proxy(that._trigger, that);

            that.bind([
                TOGGLE
            ], options);
        },

        enable: function(enable) {
            enable = typeof enable === "boolean" ? enable : true;
            var that = this;

            if (enable) {
                that.element.removeClass("km-state-disabled");
                that.input.removeAttr("disabled");
                that.element.delegate("input[type=checkbox]", "change", that._toggleProxy)
                            .delegate(handleSelector, MOUSEDOWN + " " + MOUSEUP, that._triggerProxy);
                that.element.filter(bindSelectors).bind(MOUSEDOWN + " " + MOUSEUP, that._triggerProxy);
            } else {
                that.element.undelegate("input[type=checkbox]", "change", that._toggleProxy)
                            .undelegate(handleSelector, MOUSEDOWN + " " + MOUSEUP, that._triggerProxy);
                that.element.filter(bindSelectors).unbind(MOUSEDOWN + " " + MOUSEUP, that._triggerProxy);
                that.input.attr("disabled");
                that.element.addClass("km-state-disabled");
            }
        },

        disable: function() {
            this.enable(false);
        },

        toggle: function(toggle) {
            var input = this.input,
                checked = input[0].checked;

            if (toggle != checked && !this.handle.data("animating") && !input.attr("disabled")) {
                input[0].checked = typeof(toggle) === "boolean" ? toggle : !checked;
                input.trigger("change");
            }
        },

        _trigger: function (e) {
            this.handle.toggleClass("km-state-active", e.type == MOUSEDOWN);
        }

    });

    var MobileSwitch = Toggle.extend({
        init: function(element, options) {
            var that = this;
            element = $(element);

            if (element.is("input[type=checkbox]")) {
                element = element.wrap("<label />").parent();
            }

            Toggle.fn.init.call(that, element, extend(options, { handle: handleSelector }));

            element = that.element;
            options = that.options;

            that._wrap();
            that.enable(options.enable);

            that.bind(SNAP, proxy(that._snap, that));
        },

        options: {
            name: "MobileSwitch",
            enable: true
        },

        refresh: function() {
        },

        _toggle: function() {
            var that = this;

            that._prepare();
            that._snap({ snapTo: that.input[0].checked })
        },

        _prepare: function() {
            this.handle
                .removeClass("km-switch-on")
                .removeClass("km-switch-off");
        },

        _snap: function (e) {
            var that = this,
                handle = that.handle,
                checked = (e.snapTo == 1);

            handle.addClass("km-switch-" + (checked ? "on" : "off"));

            if (!handle.data("animating")) {
                that.animators
                    .kendoStop(true, true)
                    .kendoAnimate(extend({
                        complete: function () {
                            that.input[0].checked = checked;
                            that.trigger(TOGGLE, { checked: checked });
                        }
                    }, switchAnimation, {
                        offset: e.snapTo * (that.element.outerWidth() - that.handle.outerWidth(true)) + "px,0"
                    }));
            }
        },

        _wrap: function() {
            var that = this;

            if (that.element.is("label")) {
                that.element.addClass("km-switch");
            }

            that.input = that.element.children("input[type=checkbox]");
            if (that.input.length) {
                that.input.data("kendo-role", "switch");
            } else {
                that.input = $("<input type='checkbox' data-kendo-role='switch' />").appendTo(that.element);
            }

            that.handle = that.element.children(".km-switch-handle");

            if (!that.handle.length) {
                that.handle = $("<span class='km-switch-container'><span class='km-switch-handle' /></span>")
                                    .appendTo(that.element)
                                    .children(handleSelector);
            }

            that.wrapper = that.handle.parent().before("<span class='km-switch-wrapper'><span class='km-switch-background'></span></span>");
            that.animators = "animators" in switchAnimation ? that.element.find(switchAnimation.animators) : that.handle;
        }

    });

    ui.plugin(MobileSwitch);

    var MobileCheckBox = Toggle.extend({
        init: function(element, options) {
            var that = this;
            element = $(element);

            if (element.is("input[type=checkbox]")) {
                element = element.wrap("<label />").parent();
            }

            Toggle.fn.init.call(that, element, options);

            element = that.element;
            options = that.options;

            that._wrap();
            that.enable(options.enable);
        },

        options: {
            name: "MobileCheckBox",
            enable: true
        },

        refresh: function() {
        },

        _toggle: function() {
            var that = this;

            that.handle.toggleClass("km-checkbox-checked", that.input[0].checked);
            that.trigger(TOGGLE, { checked: that.input[0].checked });
        },

        _wrap: function() {
            var that = this;

            if (that.element.is("label"))
                that.element.addClass("km-checkbox");

            that.input = that.element.children("input[type=checkbox]");
            if (that.input.length)
                that.input.data("kendo-role", "checkbox");
            else
                that.input = $("<input type='checkbox' data-kendo-role='checkbox' />").appendTo(that.element);

            that.handle = that.element;
        }

    });

    ui.plugin(MobileCheckBox);
})(jQuery);
