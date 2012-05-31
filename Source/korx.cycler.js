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
        onMove: function(thisElement, event){},*/
        onReady: function(thisElement){
            this.play();
        },
        onStep: function(thisElement){
            this.move(1);
        },
        onTap: function(thisElement, event){
            this.stop();
        },
        onSwipe: function(thisElement, event){
            this.stop();
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
        in: {
            duration: 500,
            transition: 'sine:in:out',
            unit: '%',
            timingFunction: 'ease-in-out'
        },
        out: {
            duration: 500,
            transition: 'sine:in:out',
            unit: '%',
            timingFunction: 'ease-in-out'
        },
        initial: {
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
        final: {
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
            // set the starting position
            var start = null;
            var end = null;
            if (e.touches) {
                if (e.touches.length == 1) {
                    start = {
                        x: e.touches[0].clientX,
                        y: e.touches[0].clientY,
                        t: new Date().getTime()
                    };
                }
            } else {
                start = {
                    x: e.clientX,
                    y: e.clientY,
                    t: new Date().getTime()
                };
            }
            if (start != null) {
                // listen to move events
                var moveListener = function(e){
                    // set the end position
                    if (e.touches) {
                        if (e.touches.length == 1) {
                            end = {
                                x: e.touches[0].clientX,
                                y: e.touches[0].clientY,
                                t: new Date().getTime()
                            };
                        } else {
                            end = null;
                        }
                    } else {
                        end = {
                            x: e.clientX,
                            y: e.clientY,
                            t: new Date().getTime()
                        };
                    }
                    // make sure we're in the timeframe and distance tolerance
                    if (start != null && end != null && end.t - start.t < this.options.swipeTime && Math.abs(end.y - start.y) < distance) {
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
                    if (start != null && end != null && end.t - start.t < this.options.swipeTime) {
                        // prevent default action
                        e.preventDefault();
                        // get the difference in the starting and ending x postitions
                        var dx = end.x - start.x;
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
                                start: start,
                                end: end,
                                direction: direction
                            }]);
                        } else {
                            this.fireEvent('tap', [this.element, {
                                start: start,
                                end: end
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
                // let the world know we're ready for action
                this.ready = true;
                this.fireEvent('ready', this.element);
            }).delay(50, this);
        }).delay(10, this);
    },

    useCss: function(){
        this.css = true;
        if (this.stepper != null) {
            this.play();
        } else {
            this.stop();
        }
        return this;
    },
    
    useJs: function(){
        this.css = false;
        if (this.stepper != null) {
            this.play();
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
            item.removePrefixedStyles(['transition-property', 'transition-duration', 'transition-timing-function'].append(Object.keys(this.options.initial.js)).append(Object.keys(this.options.initial.css))).setPrefixedStyles(this.css ? this.options.initial.css : this.options.initial.js);
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
        this.reset();
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

            // set next item initial style
            nextItem.setPrefixedStyles((delta > 0) ? this.options.initial.css : this.options.final.css);
            
            // wait for styles to be applied
            (function(){
            
                // start using transitions for next item
                nextItem.setPrefixedStyles({
                    transitionProperty: 'all',
                    transitionDuration: this.options.in.duration+'ms',
                    transitionTimingFunction: this.options.in.timingFunction
                });
                // stop using transitions when the item finishes transitioning
                var nextItemListener = function(e){
                    if (e.target == nextItem) {
                        nextItem.removeTransitionEndEvent(nextItemListener).setPrefixedStyles({
                            transitionProperty: 'none'
                        });
                        if (this.options.in.onComplete) {
                            this.options.in.onComplete.call(e);
                        }
                    }
                }.bind(this);
                nextItem.addTransitionEndEvent(nextItemListener);
                // set next item to current style
                nextItem.setPrefixedStyles(this.options.current.css);
                // start using transitions for previous item
                previousItem.setPrefixedStyles({
                    transitionProperty: 'all',
                    transitionDuration: this.options.out.duration+'ms',
                    transitionTimingFunction: this.options.out.timingFunction
                });
                // stop using transitions when the item finishes transitioning
                var previousItemListener = function(e){
                    if (e.target == previousItem) {
                        previousItem.removeTransitionEndEvent(previousItemListener).setPrefixedStyles({
                            transitionProperty: 'none'
                        });
                        if (this.options.out.onComplete) {
                            this.options.out.onComplete.call(e);
                        }
                    }
                }.bind(this);
                previousItem.addTransitionEndEvent(previousItemListener);
                // set previous item to final style
                previousItem.setPrefixedStyles((delta > 0) ? this.options.final.css : this.options.initial.css);
                
            }).delay(10, this);

        } else {

            // set next item initial style
            nextItem.setPrefixedStyles((delta > 0) ? this.options.initial.js : this.options.final.js);
            // morph next item to current style
            nextItem.set('morph', this.options.in).morph(this.options.current.js);
            // morph previous item to final style
            previousItem.set('morph', this.options.out).morph((delta > 0) ? this.options.final.js : this.options.initial.js);

        }

        return this;
    }

});