/*! © 2012 Korx Limited */
/*
---
name: Korx.Cycler

version: 0.2

description: Korx.Cycler is a versatile slider/slideshow/carousel MooTools plugin. It uses CSS 3 transitions with a fallback to Fx.Morph for older browsers.

license: 
  - MIT-style

authors: 
  - Michael Bird <michael.bird@korx.com>

requires:
  - core/1.4:Core
  - core/1.4:Array
  - core/1.4:Function
  - core/1.4:Event
  - core/1.4:Class
  - core/1.4:Class.Extras
  - core/1.4:Element
  - core/1.4:Element.Style
  - core/1.4:Element.Event
  - core/1.4:Fx.Morph

provides: 
  - Korx.Cycler

...
*/

Element.implement({

    transition: function(self, options, origin, destination, useCss){
        if (typeOf(useCss) == 'undefined' || useCss == null) {
            useCss = false;
        }
        if (this.retrieve('transitioning', false)) {
            var queue = this.retrieve('queue');
            if (!queue) {
                queue = [];
            }
            queue.push({self: self, options: options, origin: origin, destination: destination, useCss: useCss});
            this.store('queue', queue);
        } else {
            this.store('transitioning', true);
            // don't transition to the origin styles
            if (useCss && origin != null) {
                this.setPrefixedStyles({
                    transitionProperty: 'none'
                });
            }
            // wait for styles to be applied
            (function(){
                // set element origin style
                if (origin != null) {
                    this.setPrefixedStyles(origin);
                }
                // fire start event
                if (typeOf(options.onStart) == 'function') {
                    options.onStart.call(self, {element: this, options: options, origin: origin, destination: destination, useCss: useCss});
                }
                // wait for any styles to be applied
                (function(){
                    if (useCss) {
                        // start using transitions for the element
                        this.setPrefixedStyles({
                            transitionProperty: 'all',
                            transitionDuration: options.duration+'ms',
                            transitionTimingFunction: options.timingFunction
                        });
                    }
                    // stop using transitions when the element finishes transitioning
                    var transitionEndEventListener = function(e){
                        if (!useCss || e.target == this) {
                            if (useCss) {
                                // remove the listener
                                this.removeTransitionEndEvent(transitionEndEventListener);
                                // stop transitioning
                                this.setPrefixedStyles({
                                    transitionProperty: 'none'
                                });
                            }
                            // remember that the transition has stopped
                            this.store('transitioning', false);
                            // fire complete event
                            if (typeOf(options.onComplete) == 'function') {
                                options.onComplete.call(self, {element: this, options: options, origin: origin, destination: destination, useCss: useCss});
                            }
                            // action next in queue
                            var queue = this.retrieve('queue');
                            if (typeOf(queue) == 'array' && queue.length > 0) {
                                var next = queue.shift();
                                this.store('queue', queue);
                                this.transition(next.self, next.options, next.origin, next.destination, next.useCss);
                            }
                        }
                    }.bind(this);
                    if (useCss) {
                        // add transition end event
                        this.addTransitionEndEvent(transitionEndEventListener);
                        // set element destination style
                        this.setPrefixedStyles(destination);
                    } else {
                        var morphOptions = Object.clone(options);
                        morphOptions.onStart = null;
                        morphOptions.onCancel = null;
                        morphOptions.onComplete = transitionEndEventListener;
                        morphOptions.onChainComplete = null;
                        var morph = new Fx.Morph(this, morphOptions);
                        morph.start(destination);
                    }
                }).delay(10, this);
            }).delay(10, this);
        }

        return this;
    },

    addTransitionEndEvent: function(fn){
        ['webkitTransitionEnd', 'MSTransitionEnd', 'oTransitionEnd', 'transitionend'].each(function(event){
            if (this.addEventListener) {
                this.addEventListener(event, fn, false);
            } else {
                this.attachEvent(event, fn);
            }
        }, this);
        return this;
    },

    removeTransitionEndEvent: function(fn){
        ['webkitTransitionEnd', 'MSTransitionEnd', 'oTransitionEnd', 'transitionend'].each(function(event){
            if (this.removeEventListener) {
                this.removeEventListener(event, fn, false);
            } else {
                this.detachEvent(event, fn);
            }
        }, this);
        return this;
    },

    setPrefixedStyles: function(styles){
        for (var style in styles) this.setPrefixedStyle(style, styles[style]);
        return this;
    },

    setPrefixedStyle: function(property, value){
        if ((property.length >= 10 && property.slice(0, 10) == 'transition') || (property.length >= 9 && property.slice(0, 9) == 'transform') || (property.length >= 11 && property.slice(0, 11) == 'perspective')) {
            ['-webkit-', '-moz-', '-ms-', '-o-', ''].each(function(prefix){
                this.setStyle(prefix + property.hyphenate(), value);
            }, this);
        } else {
            this.setStyle(property, value);
        }
        return this;
    },

    removePrefixedStyles: function(){
        return this.removePrefixedStyle(arguments);
    },

    removePrefixedStyle: function(){
        Array.flatten(arguments).each(function(style){
            this.setPrefixedStyle(style, null);
        }, this);
        return this;
    }

});

if (!window.Korx) window.Korx = {};

Korx.Cycler = new Class({

    Implements: [Events, Options],

    options: {
        onInit: function(){
            // add items to the cycler
            this.addItems(this.element.getChildren());
        },
        onReady: function(){
            // start playing
            this.play();
        },/*
        onPlay: function(thisElement){},
        onStop: function(thisElement){},
        onPause: function(thisElement){},
        onMove: function(thisElement, event){},*/
        onStep: function(){
            // move forward one
            this.move(1);
        },
        onTap: function(event){
            // pause the cycler
            this.pause();
        },
        onSwipe: function(event){
            // pause the cycler
            this.pause();
            // move in the direction by one
            switch (event.direction) {
                case 'up':
                case 'left':
                    this.move(-1);
                    break;
                case 'down':
                case 'right':
                    this.move(1);
                    break;
            }
        },
        duration: 5000,
        flutter: 250,
        appear: {
            onStart: function(event){
                // inject the element into the container
                event.element.inject(this.element);
            },
            duration: 500,
            transition: 'quad:in:out',
            timingFunction: 'ease-in-out'
        },
        disappear: {
            onComplete: function(event){
                // remove the element from transitioning array
                this.transitioning.erase(event.element);
                // remove the element
                event.element.destroy();
            },
            duration: 500,
            transition: 'quad:in:out',
            timingFunction: 'ease-in-out'
        },
        origin: {
            css: {},
            js: {}
        },
        current: {
            css: {},
            js: {}
        },
        destination: {
            css: {},
            js: {}
        },
        swipeTime: 500,
        swipeDistance: 50
    },

    initialize: function(element, options){
        this.setOptions(options);

        this.element = document.id(element);
        this.items = [];
        this.css = false;
        this.ready = false;
        this.current = 0;
        this.queue = [];
        this.transitioning = [];
        this.cycling = false;
        this.stepper = null;
        
        // fire init event
        this.fireEvent('init');

        // Detect swipe
        this.element.addEvent('touchstart', function(e){
            // calculate the swipe distance based on the viewport scale
            var distance = this.options.swipeDistance;
            if (screen.width && screen.height && window.innerWidth && window.innerHeight) {
                if (!window.orientation) {
                    window.orientation = 0;
                }
                switch (window.orientation) {
                    case 0:
                    case 180:
                        // portrait
                        distance = distance * (window.innerWidth / screen.width);
                        break;
                    case 90:
                    case -90:
                    case 270:
                        // landscape
                        distance = distance * (window.innerHeight / screen.height);
                        break;
                }
            }
            // setup position vars
            var origin = null;
            var destination = null;
            // set the origin position
            if (e.touches) {
                if (e.touches.length == 1) {
                    origin = {
                        x: e.touches[0].clientX,
                        y: e.touches[0].clientY,
                        t: new Date().getTime()
                    };
                }
            } else {
                origin = {
                    x: e.clientX,
                    y: e.clientY,
                    t: new Date().getTime()
                };
            }
            if (origin != null) {
                // listen to move events
                var moveListener = function(e){
                    // set the destination position
                    if (e.touches) {
                        if (e.touches.length == 1) {
                            destination = {
                                x: e.touches[0].clientX,
                                y: e.touches[0].clientY,
                                t: new Date().getTime()
                            };
                        } else {
                            destination = null;
                        }
                    } else {
                        destination = {
                            x: e.clientX,
                            y: e.clientY,
                            t: new Date().getTime()
                        };
                    }
                    // make sure we're in the timeframe and distance tolerance
                    if (origin != null && destination != null && destination.t - origin.t < this.options.swipeTime) {
                        // prevent default action
                        e.preventDefault();
                    } else {
                        // remove listeners
                        this.element.removeEvent('touchmove', moveListener);
                        this.element.removeEvent('touchend', endListener);
                        this.element.removeEvent('touchcancel', cancelListener);
                    }
                }.bind(this);
                this.element.addEvent('touchmove', moveListener);
                // listen to end events
                var endListener = function(e){
                    if (origin != null && destination != null && destination.t - origin.t < this.options.swipeTime) {
                        // prevent default action
                        e.preventDefault();
                        // get the difference in the origin and destination x postitions
                        var dx = destination.x - origin.x;
                        // get the difference in the origin and destination y postitions
                        var dy = destination.y - origin.y;
                        // check of the delta is more than the minimum swipe distance
                        var direction = null;
                        if (dx < -distance && -distance < dy < distance) {
                            direction = 'left';
                        } else if (dx > distance && -distance < dy < distance) {
                            direction = 'right';
                        } else if (dy < -distance && -distance < dx < distance) {
                            direction = 'up';
                        } else if (dy > distance && -distance < dx < distance) {
                            direction = 'down';
                        }
                        // fire a swipe event if there was a direction or a tap if there wasnt
                        if (direction != null) {
                            this.fireEvent('swipe', {
                                origin: origin,
                                destination: destination,
                                direction: direction
                            });
                        } else {
                            this.fireEvent('tap', {
                                origin: origin,
                                destination: destination
                            });
                        }
                    }
                    // remove listeners
                    this.element.removeEvent('touchmove', moveListener);
                    this.element.removeEvent('touchend', endListener);
                    this.element.removeEvent('touchcancel', cancelListener);
                }.bind(this);
                this.element.addEvent('touchend', endListener);
                // listen to cancel events
                var cancelListener = function(e){
                    // remove listeners
                    this.element.removeEvent('touchmove', moveListener);
                    this.element.removeEvent('touchend', endListener);
                    this.element.removeEvent('touchcancel', cancelListener);
                }.bind(this);
                this.element.addEvent('touchcancel', cancelListener);
            }
        }.bind(this));

        // test for CSS transition support
        var testListener = function(e){
            this.css = true;
        }.bind(this);
        var test = new Element('div').setPrefixedStyles({
            display: 'block',
            position: 'absolute',
            top: -1,
            left: -1,
            width: 1,
            height: 1,
            transition: 'top 1ms ease'
        }).addTransitionEndEvent(testListener).inject(document.id(document.body));
        // wait for events to be applied
        (function() {
            // move the test element
            test.setPrefixedStyle('top', -2);
            // give the event time to fire
            (function() {
                // get rid of the test element
                test.removeTransitionEndEvent(testListener).destroy();
                // use JS if CSS hasn't been detected
                this.reset();
                // let the world know we're ready for action
                this.ready = true;
                this.fireEvent('ready');
            }).delay(50, this);
        }).delay(10, this);
    },

    useCss: function(){
        this.css = true;
        if (this.stepper != null) {
            this.stop().play();
        } else {
            this.stop();
        }
        return this;
    },
    
    useJs: function(){
        this.css = false;
        if (this.stepper != null) {
            this.stop().play();
        } else {
            this.stop();
        }
        return this;
    },

    addItems: function(){
        Array.flatten(arguments).each(function(item){
            item.dispose();
            this.clean(item);
            this.items.include(item);
        }, this);
        return this;
    },

    removeItems: function(){
        return $$(Array.flatten(arguments).map(function(item){
            this.items.erase(item);
            return item;
        }, this));
    },

    reset: function(){
        if (this.items.length < 1 || this.current >= this.items.length) return this;

        // purge transitioning
        this.transitioning.each(function(item){
            item.destroy();
        });
        this.transitioning = [];
        // purge queue
        this.queue.each(function(item){
            item.destroy();
        });
        this.queue = [];
        // add current item
        this.queue.push(this.items[this.current].clone(true, true).store('direction', 0).inject(this.element));

        return this;
    },

    clean: function(item){
        item.removePrefixedStyles(['transition-property', 'transition-duration', 'transition-timing-function'].append(Object.keys(this.options.origin.js)).append(Object.keys(this.options.origin.css)).append(Object.keys(this.options.current.js)).append(Object.keys(this.options.current.css)).append(Object.keys(this.options.destination.js)).append(Object.keys(this.options.destination.css)));

        return this;
    },

    play: function(){
        if (!this.ready || this.items.length < 1) return this;

        // create the stepper to automcatically move
        clearInterval(this.stepper);
        this.stepper = (function(){
            this.fireEvent('step');
        }).periodical(this.options.duration, this);
        this.fireEvent('play');
        return this;
    },

    stop: function(){
        clearInterval(this.stepper);
        this.stepper = null;
        this.reset();
        this.fireEvent('stop');
        return this;
    },

    pause: function(){
        clearInterval(this.stepper);
        this.stepper = null;
        this.fireEvent('pause');
        return this;
    },

    move: function(delta){
        if (!this.ready || this.items.length < 1 || delta == 0) return this;

        // create an array of items to pass through to the new item
        for (var i = 1; i <= Math.abs(delta); i++) {
            var direction = (delta > 0 ? 1 : -1);
            this.current = this.current + direction;
            if (this.current < 0) {
                this.current = this.items.length - 1;
            } else if (this.current > this.items.length - 1) {
                this.current = 0;
            }
            this.queue.push(this.items[this.current].clone(true, true).store('direction', direction));
        }

        this.cycle();

        return this;
    },

    cycle: function(){
        if (this.cycling || this.queue.length <= 1) return this;

        this._cycle();

        return this;
    },

    _cycle: function(){
        var first = !this.cycling;
        this.cycling = true;
        var item = this.queue.shift();
        var last = (this.queue.length == 0);

        // get diretion of movement
        var inDirection = item.retrieve('direction');
        var outDirection = item.retrieve('direction');
        if (!last) {
            var next = this.queue.shift();
            outDirection = next.retrieve('direction');
            this.queue.push(next);
        }

        // add to trasitioning array
        this.transitioning.push(item);

        if (this.css) {

            if (!first) {
                // transition next item to current style
                item.transition(this, this.options.appear, (inDirection >= 0 ? this.options.origin.css : this.options.destination.css), this.options.current.css, true);
            }
            if (!last) {
                // transition previous item to destination style
                item.transition(this, this.options.disappear, this.options.current.css, (outDirection >= 0 ? this.options.destination.css : this.options.origin.css), true);
            }

        } else {

            if (!first) {
                // transition next item to current style
                item.transition(this, this.options.appear, (inDirection >= 0 ? this.options.origin.js : this.options.destination.js), this.options.current.js, false);
            }
            if (!last) {
                // transition previous item to destination style
                item.transition(this, this.options.disappear, this.options.current.js, (outDirection >= 0 ? this.options.destination.js : this.options.origin.js), false);
            }

        }

        if (this.queue.length == 0) {
            this.queue.push(item);
            this.cycling = false;
        } else {
            this._cycle.delay(this.options.flutter, this);
        }

        return this;
    }

});