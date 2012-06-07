# Korx.Cycler

Korx.Cycler is a Javascript slideshow/carousel class based on MooTools. It uses CSS 3 transitions with a fallback to Fx.Morph.


## How to use

Please have a look into the Demo directory for a couple of demos of how Korx.Cycler works.

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
    
####`onPlay`
This is triggered when the method `play()` is invoked. `thisElement` refers to the container element.

    onPlay: function(thisElement){}


####`onStop`
This is triggered when the method `stop()` is invoked. `thisElement` refers to the container element.

    onStop: function(thisElement){}


#### `onPause`
This is triggered when the method `pause()` is invoked. `thisElement` refers to the container element.

    onPause: function(thisElement){}


####`onMove`
This is triggered when the method `move()` is invoked. `thisElement` refers to the container element. `event` is an object with the properties `delta`, `next` and `previous` where `delta` is the amount to moved by, `next` is the new current element and `previous` is the old current element.

    onMove: function(thisElement, event){}


#### `onReady`
This is triggered during initialisation after it has been determined wether CSS transition support is available or not. `thisElement` refers to the container element.

    onReady: function(thisElement){
        this.play();
    }


#### `onStep`
This is triggered on each interval setup by `play()`. `thisElement` refers to the container element.

    onStep: function(thisElement){
        this.move(1);
    }


#### `onTap`
This is triggered when a 'tap' touch event or gesture is detected in the container element. `thisElement` refers to the container element. `event` is an object with the properties `origin` and `destination` which are each objects containing the co-ordinate properties `x` and `y`, and the time property `t`.

    onTap: function(thisElement, event){
        this.pause();
    }


#### `onSwipe`
This is triggered when a 'swipe' touch event or gesture is detected in the container element. `thisElement` refers to the container element. `event` is an object with the properties `direction` which could be 'left' or 'right' along with `origin` and `destination` which are each objects containing the co-ordinate properties `x` and `y`, and the time property `t`.

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


#### `duration`
This is the amount of time in milliseconds between each interval setup when `play()` has been invoked.

    duration: 5000


#### `appear`
This is the set of options for the CSS transition and Fx.Morph when an element is moving in to the current position.

    appear: {
        duration: 500,
        transition: 'sine:in:out',
        unit: '%',
        timingFunction: 'ease-in-out'
    }


#### `disappear`
This is the set of options for the CSS transition and Fx.Morph when an element is moving out from the current position.

    disappear: {
        duration: 500,
        transition: 'sine:in:out',
        unit: '%',
        timingFunction: 'ease-in-out'
    }


#### `origin`
This is the set of styles for each of the `css` and `js` transitions used for the starting point of the next element.

    origin: {
        css: {
            transform: 'translate(-100%, 0)'
        },
        js: {
            left: '-100%'
        }
    }


#### `current`
This is the set of styles for each of the `css` and `js` transitions used for the finishing point of the next element and starting point of the previous element.

    current: {
        css: {
            transform: 'translate(0, 0)'
        },
        js: {
            left: '0%'
        }
    }


#### `destination`
This is the set of styles for each of the `css` and `js` transitions used for the finishing point of the previous element.

    destination: {
        css: {
            transform: 'translate(100%, 0)'
        },
        js: {
            left: '100%'
        }
    }


#### `swipeTime`
This is the maximum amount of time a touch can have before it's ignored as a swipe gesture.

    swipeTime: 500


#### `swipeDistance`
This is the minimum amount of distance relative to the viewport scale a touch can have in a single direction before it's classed as a swipe gesture.

    swipeDistance: 50


### Methods

#### `useCss()`
Force the cycler to switch to using CSS transitions.

    cycler.useCss();


#### `useJs()`
Force the cycler to switch to using Javascript Fx.Morph transitions.

    cycler.useJs();


#### `addItems()`
This method will add items to the cycler. It will accept an individual elements as the arguments or an array of elements

    cycler.addItems(element);
    cycler.addItems(element1, element2, element3);
    cycler.addItems([element1, element2, element3]);


#### `removeItems()`
This method will remove items from the cycler. It will accept an individual elements as the arguments or an array of elements

    cycler.removeItems(element);
    cycler.removeItems(element1, element2, element3);
    cycler.removeItems([element1, element2, element3]);


#### `reset()`
This method resets the item styles, and therefore will restore any items in mid transition and make sure the current item has the current styles.

    cycler.reset();


#### `play()`
This method moves creates the interval timer which fires every `this.options.duration` and triggers the event `onStep`, which by default moves the cycler by +1.

    cycler.play();


#### `stop()`
This method stops the cycler from playing by removing the interval timer. It also resets the item styles, and therefore will restore any items in mid transition.

    cycler.stop();


#### `pause()`
This method stops the cycler from playing by removing the interval timer. It doesn't reset the styles so any items mid transition will be allowed to complete.

    cycler.pause();


#### `move(delta)`
This method moves the cycler in the direction specified by `delta` which may be a positive or negative integer.

    cycler.move(1);
    cycler.move(-1);
    cycler.move(3);
    cycler.move(-5);

