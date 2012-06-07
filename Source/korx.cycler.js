/*! © 2012 Korx Limited */
/*
---
name: Korx.Cycler

version: 0.1

description: A Javascript slideshow class based on MooTools. It uses CSS 3 transitions with a fallback to Fx.Morph.

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
        if ((property.length >= 10 && property.slice(0, 10) == 'transition') || (property.length >= 9 && property.slice(0, 9) == 'transform')) {
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

    options: {/*
        onPlay: function(thisElement){},
        onStop: function(thisElement){},
        onPause: function(thisElement){},
        onMove: function(thisElement, event){},*/
        onReady: function(thisElement){
            this.play();
        },
        onStep: function(thisElement){
            this.move(1);
        },
        onTap: function(thisElement, event){
            this.pause();
        },
        onSwipe: function(thisElement, event){
            this.pause();
            switch (event.direction) {
                case 'left':
                    this.move(-1);
                    break;
                case 'right':
                    this.move(1);
                    break;
            }
        },
        duration: 5000,
        appear: {
            duration: 500,
            transition: 'sine:in:out',
            unit: '%',
            timingFunction: 'ease-in-out'
        },
        disappear: {
            duration: 500,
            transition: 'sine:in:out',
            unit: '%',
            timingFunction: 'ease-in-out'
        },
        origin: {
            css: {
                transform: 'translate(-100%, 0)'
            },
            js: {
                left: '-100%'
            }
        },
        current: {
            css: {
                transform: 'translate(0, 0)'
            },
            js: {
                left: '0%'
            }
        },
        destination: {
            css: {
                transform: 'translate(100%, 0)'
            },
            js: {
                left: '100%'
            }
        },
        swipeTime: 500,
        swipeDistance: 50
    },

    initialize: function(element, items, options){
        this.setOptions(options);

        this.element = document.id(element);
        this.items = [];
        this.css = false;
        this.ready = false;
        this.current = 0;
        this.stepper = null;

        this.addItems($$(document.id(items) || items));

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
                    if (origin != null && destination != null && destination.t - origin.t < this.options.swipeTime && Math.abs(destination.y - origin.y) < distance) {
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
                        // check of the delta is more than the minimum swipe distance
                        var direction = null;
                        if (dx < -distance) {
                            direction = 'left';
                        } else if (dx > distance) {
                            direction = 'right';
                        }
                        // fire a swipe event if there was a direction or a tap if there wasnt
                        if (direction != null) {
                            this.fireEvent('swipe', [this.element, {
                                origin: origin,
                                destination: destination,
                                direction: direction
                            }]);
                        } else {
                            this.fireEvent('tap', [this.element, {
                                origin: origin,
                                destination: destination
                            }]);
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
        this.useJs();
        var testListener = function(e){
            this.useCss();
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
                // reset the elements
                this.reset();
                // let the world know we're ready for action
                this.ready = true;
                this.fireEvent('ready', this.element);
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
        
        // remove all existing styles and then setup the current item styles
        this.items.each(function(item){
            item.removePrefixedStyles(['transition-property', 'transition-duration', 'transition-timing-function'].append(Object.keys(this.options.origin.js)).append(Object.keys(this.options.origin.css))).setPrefixedStyles(this.css ? this.options.origin.css : this.options.origin.js).get('morph').cancel();
        }, this);
        this.items[this.current].setPrefixedStyles(this.css ? this.options.current.css : this.options.current.js);

        return this;
    },

    play: function(){
        if (!this.ready || this.items.length < 1) return this;

        // create the stepper to automcatically move
        clearInterval(this.stepper);
        this.stepper = (function(){
            this.fireEvent('step', this.element);
        }).periodical(this.options.duration, this);
        this.fireEvent('play', this.element);
        return this;
    },

    stop: function(){
        clearInterval(this.stepper);
        this.stepper = null;
        this.reset();
        this.fireEvent('stop', this.element);
        return this;
    },

    pause: function(){
        clearInterval(this.stepper);
        this.stepper = null;
        this.fireEvent('pause', this.element);
        return this;
    },

    move: function(delta){
        if (!this.ready || this.items.length < 1 || delta == 0) return this;

        // get the remainder if the delta is bigger than the items array
        remainder = delta % this.items.length;
        var previous = this.current;
        var next = previous + remainder;
        // make sure the next index isn't out of bounds
        if (next > this.items.length - 1) {
            next = next - this.items.length;
        } else if (next < 0) {
            next = next + this.items.length;
        }

        // get the next and previous items
        var nextItem = this.items[next];
        var previousItem = this.items[previous];

        // fire the move event
        this.fireEvent('move', [this.element, {
            delta: delta,
            next: nextItem,
            previous: previousItem
        }]);

        // update the current item index
        this.current = next;

        if (this.css) {

            // transition next item to current style
            this.transition(nextItem, (delta > 0) ? this.options.origin.css : this.options.destination.css, this.options.current.css, this.options.appear);
            // transition previous item to destination style
            this.transition(previousItem, null, (delta > 0) ? this.options.destination.css : this.options.origin.css, this.options.disappear);

        } else {

            // set next item origin style
            nextItem.setPrefixedStyles((delta > 0) ? this.options.origin.js : this.options.destination.js);
            // morph next item to current style
            nextItem.set('morph', this.options.appear).morph(this.options.current.js);
            // morph previous item to destination style
            previousItem.set('morph', this.options.disappear).morph((delta > 0) ? this.options.destination.js : this.options.origin.js);

        }

        return this;
    },

    transition: function(element, origin, destination, options){
        if (element.retrieve('queue', []).length > 0) {
            element.store('queue', element.retrieve('queue', []).push({origin: origin, destination: destination, options: options}));
        } else {
            // don't transition to the origin styles
            if (origin != null) {
                element.setPrefixedStyles({
                    transitionProperty: 'none'
                });
            }
            // wait for styles to be applied
            (function(){
                // set element origin style
                if (origin != null) {
                    element.setPrefixedStyles(origin);
                }
                // wait for styles to be applied
                (function(){
                    // start using transitions for the element
                    element.setPrefixedStyles({
                        transitionProperty: 'all',
                        transitionDuration: options.duration+'ms',
                        transitionTimingFunction: options.timingFunction
                    });
                    // stop using transitions when the element finishes transitioning
                    var transitionEndEventListener = function(e){
                        if (e.target == element) {
                            element.removeTransitionEndEvent(transitionEndEventListener);
                            // action next in queue
                            if (element.retrieve('queue', []).length > 0) {
                                var queue = element.retrieve('queue', []).shift();
                                this.transition(element, queue.origin, queue.destination, queue.options);
                            } else {
                                element.setPrefixedStyles({
                                    transitionProperty: 'none'
                                });
                            }
                        }
                    }.bind(this);
                    element.addTransitionEndEvent(transitionEndEventListener);
                    // set element destination style
                    element.setPrefixedStyles(destination);
                }).delay(10, this);
            }).delay(10, this);
        }
    }

});