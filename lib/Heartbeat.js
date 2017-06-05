//-------------------------------------------------------------------------------
// Heartbeat
//
// Wrapper object for window.setInterval/setTimeout that can be stopped, 
// paused and then restarted
//
// Intended to be used entirely through the Queue object,
// but the Heartbeat object is provided for cases where
// a plain heartbeat is required.
//
// calls f repeatedly unless .single is set to true
//
// Heartbeats record every instance created so from any heartbeat object
// you can call a function on all instances with the allinstances function.
//

function Heartbeat(f, ms) {
	this.f = f;
	this.ms = ms;
	this.interval = null;
	this.timeout = null;
	this.single = false;
	this.paused = false;

	Heartbeat.instances.push(this);
}

Heartbeat.instances = [];
Heartbeat.allInstances = function(f) {
	//mpbt 21/12/10 - removed test for whether f is defined. Hiding an error is bad.
	for (var i = 0, l = Heartbeat.instances.length; i < l; i++) {
		f.apply(Heartbeat.instances[i], []);
	}
};

Heartbeat.prototype.getInterval = function() {
	return this.ms;
};
Heartbeat.prototype.setInterval = function(ms) {
	var wasRunning = !!(this.interval || this.timeout);
	if (wasRunning) {
		this.stop();
	}
	this.ms = ms;
	if (wasRunning) {
		this.start();
	}
};

Heartbeat.prototype.setFunction = function(f) {
	this.f = f;
};

Heartbeat.prototype.beatNow = function() {
	if (this.single) {
		this.stop();
	}
	this.f();
};
Heartbeat.prototype.stop = function() {
	if (this.interval) {
		window.clearInterval(this.interval);
		this.interval = null;
	}
	if (this.timeout) {
		window.clearTimeout(this.timeout);
		this.timeout = null;
	}
	this.paused = false;
};

Heartbeat.prototype.start = function() {
	if (this.single) {
		if (!this.timeout) {
			this.timeout = window.setTimeout(this.f, this.ms);
		}
	} else {
		if (!this.interval) {
			this.interval = window.setInterval(this.f, this.ms);
		}
	}
	this.paused = false;
};

Heartbeat.prototype.reset = function() {
	this.stop();
	this.start();
};

Heartbeat.prototype.pause = function() {
	if (this.interval || this.timeout) {
		this.stop();
	}
}

Heartbeat.prototype.unpause = function() {
	if (this.paused) {
		this.start();
	}
};

Heartbeat.pauseall = function() {
	Heartbeat.allInstances(Heartbeat.prototype.pause);
};
Heartbeat.unpauseall = function() {
	Heartbeat.allInstances(Heartbeat.prototype.unpause);
};
Heartbeat.stopall = function() {
	Heartbeat.allInstances(Heartbeat.prototype.stop);
};
Heartbeat.startall = function() {
	Heartbeat.allInstances(Heartbeat.prototype.start);
};

//now attach an onunload event to immediately clear any heartbeats

if (window.attachEvent) {
	window.attachEvent('onunload', function() {Heartbeat.stopall()})
} else {
	if (window.addEventListener) {
		window.addEventListener(
			'unload',
			function() {Heartbeat.stopall()},
			false);
	}
}
