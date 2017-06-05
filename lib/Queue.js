
//-------------------------------------------------------------------------------
// Queue
//
// Simple list that can be either FIFO (default) or FILO
// If supplied a function and interval in ms, the queue will
// execute this function with the next element in the queue
// as its argument at the specified time interval.
// If autoStart is true, then the associated heartbeat is
// stopped and started according to whether the queue has
// items to process.
// If processAtOnce is true, when the queue autoStarts it
// schedules the first item in the Queue to process immediately
// Paused queues never autostart, so you can schedule lots
// of items and then release them later.
//
// Queues can be limited by an external function so that
// they only process the next item if a condition is satisfied
// Set the rateLimiter function to enable this behaviour.
// If your queue is making AjaxRequests set the rateLimiter
// to Queue.ajaxRateLimiter(maxNumberRequests) to ensure the
// number of active requests never goes above the browser's
// limit.
//
// Queues can amalgamate pending updates into the current one
// if they are similar - redefine joinItems(o1,o2) to
// return an amalgamated object if they can be amalgamated,
// and undefined/null if not
//

function Queue(heartbeatFunction, heartbeatEveryMs, heartbeatFunctionContext) {
	this.q					= [];
	this.hb					= null;
	this.f					= null;
	this.joinItems			= null;		//redefine this function to return an amalgamated object if this is possible
	this.maxJoin			= -1;		//maximum number of similar items to join, -1 means no limit
	this.rateLimiter		= null;		//redefine this function to return a boolean to indicate whether processing is possible at the moment (see static method Queue.ajaxRateLimiter )
	
	//options
	this.lifo				= false;	//by default this is FIFO
	this.autoStart			= true;		//Should we automatically start and stop the heartbeat for this queue?
	this.processAtOnce		= true;		//On auto-starting the queue, do we immediately process the first item?
	
	this.activityMonitor	= null;		//set this to an activity monitor to get it to show updates
	
	if (heartbeatFunction && heartbeatEveryMs) {
		var self = this;
		this.f = heartbeatFunction;
		this.hb = new Heartbeat(function() {self.applyNext()}, heartbeatEveryMs);
		if (!this.autoStart) {
			this.hb.start();
		}
	}
	//context to run the heartbeat function
	this.fContext = heartbeatFunctionContext;
}

//----------------------------------------------------------
// internal functions to handle auto stop/start
Queue.prototype._handleAutostart = function() {
	if (this.autoStart && this.q.length == 0 && this.hb && !this.hb.paused) {
		this.start();
		if (this.processAtOnce) {
			//set a timeout so that the function that added to the queue can complete
			var self = this;
			window.setTimeout(function() {self.applyNext()}, 10);
		}
	}
}

Queue.prototype._handleAutostop = function() {
	if (this.autoStart && this.q.length < 1) {
		this.stop();
	}
}

Queue.prototype.updateActivityMonitor = function() {
	if (this.activityMonitor) {
		this.activityMonitor.update();
	}
}

//----------------------------------------------------------
//Public API

//returns length of the current queue
Queue.prototype.length = function() {
	return this.q.length;
}

//add an item to the queue
Queue.prototype.add = function(o) {
	this._handleAutostart();
	this.q.push(o);
	this.updateActivityMonitor();
	return o;
}

//replace the current queue with a new array of objects
Queue.prototype.set = function(q) {
	this._handleAutostart();
	this.q = q.concat();
	this.updateActivityMonitor();
}

//return the next item in the queue, possibly joined with other items
Queue.prototype.getNext = function() {
	var o, joined, joinedCount;

	o = null;
	
	if (this.q.length>0) {
		o = this.lifo?this.q.pop():this.q.shift();
		if (this.joinItems) {
			joinedCount = 0;
			for (var i=0; i<this.q.length; i++) {
				joined = this.joinItems(o, this.q[i]);
				if (joined) {
					o = joined;
					this.q.splice(i, 1);
					i -= 1;
					joinedCount += 1;
					if (joinedCount >= this.maxJoin && this.maxJoin>0) {
						break;
					}
				}
			}
		}
	}
	this._handleAutostop();
	this.updateActivityMonitor();
	return o;
}

//call our heartbeat function on the next item in the queue
Queue.prototype.applyNext = function() {
	if (this.rateLimiter && !this.rateLimiter.apply(this)) {
		return null;
	}
	var o = this.getNext();
	if (o && this.f) {
		//run in context provided or not
		this.f.apply(this.fContext || this, [o]); 
	}
	return o;
}

//stick an item back into the queue where it came from
Queue.prototype.returnItem = function(o) {
	this._handleAutostart();
	this.q.unshift(o);
	this.updateActivityMonitor();
}

//remove items from the queue that the supplied filter function indicates should be removed (by returning a truthy value)
Queue.prototype.filter = function(f) {
	for (var i = this.q.length - 1; i >= 0; i--) {
		if (f.apply(this, [this.q[i]])) {
			this.q.splice(i, 1);
		}
	}
	this._handleAutostop();
	this.updateActivityMonitor();
}

//stop the queue from executing - autostart queues may still re-start
Queue.prototype.stop = function() {
	if (this.hb) {
		this.hb.stop();
	}
}

//start the queue again 
Queue.prototype.start = function() {
	if (this.hb) {
		this.hb.start();
	}
}

//pause the queue - autostart queues will not restart
Queue.prototype.pause = function() {
	if (this.hb) {
		this.hb.pause();
	}
}

//unpause the queue
Queue.prototype.unpause = function() {
	if (this.hb) {
		this.hb.unpause();
	}
}

//reset the queue to an empty queue
Queue.prototype.reset = function() {
	if (this.autoStart) {
		this.stop();
	}
	this.q = [];
	this.updateActivityMonitor();
}

// Ajax rate limiter function 
// usage:
//	var ajaxQueue = new Queue(f, 100);
//	ajaxQueue.rateLimiter = Queue.ajaxRateLimiter(3);

Queue.ajaxRateLimiter = function(maxRequests) {
	maxRequests = maxRequests || 4;
	return function() {
		return ActivityMonitor.activeAjaxRequests() < maxRequests;
	};
}