var Crafty = require('../core/core.js');

/**@
 * #MouseState
 * @category Input
 * @kind Component
 *
 * Provides valid mouse related events and button states for the entity.
 *
 * @trigger MouseOver - when the mouse enters - MouseEvent
 * @trigger MouseOut - when the mouse leaves - MouseEvent
 * @trigger MouseDown - when the mouse button is pressed on - MouseEvent
 * @trigger MouseUp - when the mouse button is released on - MouseEvent
 * @trigger Click - when the user clicks - MouseEvent
 * @trigger DoubleClick - when the user double clicks - MouseEvent
 * @trigger MouseMove - when the mouse is over and moves - MouseEvent
 *
 * The event callbacks are triggered with a native [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent),
 * which is wrapped in a standard Crafty event object consisting of additional properties:
 * ~~~
 * // event name of mouse event
 * e.eventName
 *
 * // Normalized mouse button according to Crafty.mouseButtons:
 * // Crafty.mouseButtons.LEFT, Crafty.mouseButtons.RIGHT or Crafty.mouseButtons.MIDDLE
 * e.mouseButton
 *
 * // (x,y) coordinates of mouse event in world (default viewport) space
 * e.realX
 * e.realY
 *
 * // (x,y) coordinates of mouse event in web-browser (screen) space
 * e.clientX
 * e.clientY
 *
 * // Original mouse event, containing additional native properties
 * e.originalEvent
 * ~~~
 *
 * In addition to binding to these events, the current state (pressed/released) of a mouse button can also be queried using the `.isButtonDown` method.
 *
 * @example
 * ~~~
 * var myEntity = Crafty.e('2D, Canvas, Color, Mouse')
 * .attr({x: 10, y: 10, w: 40, h: 40})
 * .color('red')
 * .bind('Click', function(MouseEvent){
 *   alert('clicked', MouseEvent);
 * });
 *
 * myEntity.bind('MouseUp', function(e) {
 *    if( e.mouseButton == Crafty.mouseButtons.RIGHT )
 *        Crafty.log("Clicked right button");
 * })
 * ~~~
 *
 * @see Mouse, MouseSystem
 * @see Crafty.mouseButtons
 */
Crafty.__mouseStateTemplate = {
    _buttonDown: null,

    /**@
     * #.lastMouseEvent
     * @comp MouseState
     * @kind Property
     *
     * Check which read-only mouse event occured most recently (useful for determining mouse position in every frame).
     *
     * @see Mouse, MouseSystem, Crafty.mouseButtons
     */
    lastMouseEvent: null,

    init: function() {
        this._buttonDown = {};
        // use custom trigger method if specified
        this.triggerMouseEvent = this.triggerMouseEvent || this.trigger;
        this.lastMouseEvent = {
            eventName: '',
            mouseButton: -1,
            realX: 0,
            realY: 0,
            clientX: 0,
            clientY: 0,
            originalEvent: null
        };
    },

    /**@
     * #.isButtonDown
     * @comp MouseState
     * @kind Method
     *
     * @sign public Boolean .isButtonDown(String mouseButtonName)
     * @param mouseButtonName - Name of the button to check. See `Crafty.mouseButtons`.
     * @returns The pressed state of the button
     *
     * @sign public Boolean .isButtonDown(Number buttonId)
     * @param buttonId - ButtonId in `Crafty.mouseButtons`.
     * @returns The pressed state of the button
     *
     * Determine if a certain mouse button is currently down.
     *
     * @example
     * ~~~
     * ent.bind('UpdateFrame', function() {
     *   if (Crafty.s('Mouse').isButtonDown('LEFT'))
     *     this.y--;
     * });
     * ~~~
     *
     * @see .resetButtonDown
     * @see Crafty.mouseButtons
     */
    isButtonDown: function (button) {
        if (typeof button === "string") {
            button = Crafty.mouseButtons[button];
        }
        return !!this._buttonDown[button];
    },

    /**@
     * #.resetButtonDown
     * @comp MouseState
     * @kind Method
     *
     * @sign public this .resetButtonDown()
     *
     * Reset all currently pressed buttons. Triggers appropriate "MouseUp" events.
     *
     * This method is called internally, but may be useful when running Crafty in headless mode.
     *
     * @see .isButtonDown
     * @see Crafty.mouseButtons
     */
    resetButtonDown: function () {
        var lastEvent = this.lastMouseEvent;

        // Tell all buttons they're no longer held down
        var buttonsDown = this._buttonDown;
        for (var button in buttonsDown) {
            if (buttonsDown[button] === true) {
                lastEvent.mouseButton = +button; // convert button propertyString to number!
                lastEvent.eventName = "MouseUp";
                this.triggerMouse("MouseUp", lastEvent);
            }
        }

        return this;
    },

    /**@
     * #.triggerMouse
     * @comp MouseState
     * @kind Method
     *
     * @sign public this triggerMouse(String eventName, Object eventData)
     * @param eventName - Name of the mouse event to trigger ("MouseDown", "MouseUp", "MouseMove", ...)
     * @param eventData - The mouse event to trigger
     *
     * Try to trigger a mouse event on this entity.
     * This method prevents inconsistent button state.
     * e.g. If this entity didn't receive a "MouseDown" previously, it won't fire a "MouseUp" event.
     *
     * This method is called internally, but may be useful when running Crafty in headless mode.
     *
     * @example
     * ~~~
     * var wasTriggered = false;
     *
     * ent.requires('MouseState')
     *    .bind('MouseUp', function(evt) {
     *       wasTriggered = true;
     *    })
     *    .triggerMouse('MouseUp', { mouseButton: Crafty.mouseButtons.LEFT });
     *
     * Crafty.log(wasTriggered); // prints false
     * ~~~
     *
     * @see Crafty.mouseButtons
     */
    triggerMouse: function (eventName, eventData) {
        // copy newest event to lastEvent
        var lastEvent = this.lastMouseEvent;
        lastEvent.eventName = eventName;
        lastEvent.mouseButton = eventData.mouseButton;
        lastEvent.realX = eventData.realX;
        lastEvent.realY = eventData.realY;
        lastEvent.clientX = eventData.clientX;
        lastEvent.clientY = eventData.clientY;
        lastEvent.originalEvent = eventData.originalEvent;

        // trigger event only if valid state
        var mouseButton = eventData.mouseButton;
        if (eventName === "MouseDown") {
            // ignore MouseDown due to inconsistent state caused by loosing focus
            if (this._buttonDown[mouseButton] !== true) {
                this._buttonDown[mouseButton] = true;
                this.triggerMouseEvent(eventName, eventData);
            }
        } else if (eventName === "MouseUp") {
            // ignore MouseUp due to inconsistent state caused by loosing focus
            if (this._buttonDown[mouseButton] === true) {
                this._buttonDown[mouseButton] = false;
                this.triggerMouseEvent(eventName, eventData);
            }
        } else {
            // trigger the event otherwise
            this.triggerMouseEvent(eventName, eventData);
        }

        return this;
    }
};
Crafty.c("MouseState", Crafty.__mouseStateTemplate);

// define a basic Mouse system for headless mode
// will be substituted with proper one in browser mode
Crafty.s("Mouse", Crafty.extend.call({
    // this method will be called by MouseState iff triggerMouse event was valid
    triggerMouseEvent: function (eventName, e) {
        Crafty.trigger(eventName, e);
    }
}, Crafty.__mouseStateTemplate), {}, false);
