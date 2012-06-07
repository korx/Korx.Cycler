# Korx.Cycler


## Overview

Korx.Cycler is a Javascript slideshow class based on MooTools. It uses CSS 3 transitions with a fallback to Fx.Morph.

## Demo

Please have a look into the Demo directory for a couple of demos of what Korx.Cycler does.

## Usage

To use simply create a new object of the Korx.Cycler class spcifying your container element and the item elements after the DOM has loaded.

    <!doctype html>
    <html>
        <head>
            <title>Korx.Cycler</title>
            <script src="mootools.js"></script>
            <script src="korx.cycler.js"></script>
            <script>
                window.addEvent('domready', function(){
                    var cycler = new Korx.Cycler($('cycler'), $('cycler').getChildren('article'));
                });
            </script>
        </head>
        <body>
            <section id="cycler">
                <h1>Simple Cycler</h1>
                <article>
                    <h1>The first element</h1>
                </article>
                <article>
                    <h1>The second element</h1>
                </article>
            </section>
        </body>
    </html>

### Options

    onPlay: function(thisElement){}
    
`onPlay` is triggered when the method `play()` is invoked. `thisElement` refers to the container element.

    onStop: function(thisElement){}
    
`onStop` is triggered when the method `stop()` is invoked. `thisElement` refers to the container element.

    onPause: function(thisElement){}
    
`onPause` is triggered when the method `pause()` is invoked. `thisElement` refers to the container element.

    onMove: function(thisElement, event){}

`onMove` is triggered when the method `move()` is invoked. `thisElement` refers to the container element. `event` is an object with the properties `delta`, `next` and `previous` where `delta` is the amount to moved by, `next` is the new current element and `previous` is the old current element.

    onReady: function(thisElement){
        this.play();
    }

`onReady` is triggered during initialisation after it has been determined wether CSS transition support is available or not. `thisElement` refers to the container element.

    onStep: function(thisElement){
        this.move(1);
    }

`onStep` is triggered on each interval setup by `play()`. `thisElement` refers to the container element.

    onTap: function(thisElement, event){
        this.pause();
    }

`onTap` is triggered when a 'tap' touch event or gesture is detected in the container element. `thisElement` refers to the container element. `event` is an object with the properties `origin` and `destination` which are each objects containing the co-ordinate properties `x` and `y`, and the time property `t`.

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
    }

`onSwipe` is triggered when a 'swipe' touch event or gesture is detected in the container element. `thisElement` refers to the container element. `event` is an object with the properties `direction` which could be 'left' or 'right' along with `origin` and `destination` which are each objects containing the co-ordinate properties `x` and `y`, and the time property `t`.

    duration: 5000

`duration` is the amount of time in milliseconds between each interval setup when `play()` has been invoked.

    appear: {
        duration: 500,
        transition: 'sine:in:out',
        unit: '%',
        timingFunction: 'ease-in-out'
    }

`appear` is the set of options for the CSS transition and Fx.Morph when an element is moving in to the current position.

    disappear: {
        duration: 500,
        transition: 'sine:in:out',
        unit: '%',
        timingFunction: 'ease-in-out'
    }

`disappear` is the set of options for the CSS transition and Fx.Morph when an element is moving out from the current position.

    origin: {
        css: {
            transform: 'translate(-100%, 0)'
        },
        js: {
            left: '-100%'
        }
    }

`origin` is the set of styles for each of the `css` and `js` transitions used for the starting point of the next element.

    current: {
        css: {
            transform: 'translate(0, 0)'
        },
        js: {
            left: '0%'
        }
    }

`current` is the set of styles for each of the `css` and `js` transitions used for the finishing point of the next element and starting point of the previous element.

    destination: {
        css: {
            transform: 'translate(100%, 0)'
        },
        js: {
            left: '100%'
        }
    }

`destination` is the set of styles for each of the `css` and `js` transitions used for the finishing point of the previous element.

    swipeTime: 500

`swipeTime` is the maximum amount of time a touch can have before it's ignored as a swipe gesture.

    swipeDistance: 50

`swipeDistance` is the minimum amount of distance relative to the viewport scale a touch can have in a single direction before it's classed as a swipe gesture.
