# Queue
A set of objects for maintaining lists of things to do.
Defines three objects:
  1) Heartbeat
  2) Queue
  3) ActivityMonitor
  
## Heartbeat

Wrapper object for `window.setInterval`/`setTimeout` that can be stopped, paused and then restarted

Intended to be used entirely through the Queue object, but the Heartbeat object is provided for cases where a plain heartbeat is required.

Calls `f` repeatedly unless `.single` is set to true

Heartbeats record every instance created so from any heartbeat object you can call a function on all instances with the allinstances function.

## Queue

Simple list that can be either FIFO (default) or LIFO

If supplied a function and interval in ms, the queue will execute this function with the next element in the queue as its argument at the specified time interval.

If `autoStart` is true, then the associated heartbeat is stopped and started according to whether the queue has items to process.

If `processAtOnce` is true, when the queue autoStarts it schedules the first item in the Queue to process immediately

Paused queues never autostart, so you can schedule lots of items and then release them later.

Queues can be limited by an external function so that they only process the next item if a condition is satisfied; set the rateLimiter function to enable this behaviour.

If your queue is making Ajax requests set the `rateLimiter` to `Queue.ajaxRateLimiter(maxNumberRequests)` to ensure the number of active requests never goes above the browser's limit.

Queues can amalgamate pending updates into the current one if they are similar - redefine `joinItems(o1,o2)` to return an amalgamated object if they can be amalgamated, and `undefined/null` if not.

## ActivityMonitor

Object that maintains a progress bar showing Ajax and Queue lengths

Accepts an array of Queue objects to monitor and the id of the element to stuff the progress bar HTML into. Specify the queues in order of use if they do indeed pass jobs from one to the next. If not, specify in order from slowest to fastest.
 
Requires `activityMonitor.css` to style the progressbar correctly
