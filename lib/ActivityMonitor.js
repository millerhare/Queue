//-------------------------------------------------------------------------------
// ActivityMonitor
//
// Object that maintains a progress bar showing Ajax and Queue lengths
//
// Accepts an array of Queue objects to monitor and the id of the element
// to stuff the progress bar HTML into. Specify the queues in order of use
// if they do indeed pass jobs from one to the next. If not, specify in
// order from slowest to fastest.
// 
// Requires activityMonitor.css to style the progressbar correctly
//

function ActivityMonitor(queues, monitorElementId) {
	this.totalRecentRequests = 0;
	this.monitoredElement = monitorElementId;
	this.queuesMonitored = queues;
	
	if (queues) {
		for (var i=0; i<queues.length; i++) {
			queues[i].activityMonitor = this;
		}
	}

	this.update = function() {
		var am = document.getElementById(this.monitoredElement);
		var arCount = 0;
		var aqCount = 0;
		var totalCurrent = 0;
		var progressBar = [];
		var percentComplete = 0;

		if (am) {
			arCount = ActivityMonitor.activeAjaxRequests();
			if (this.queuesMonitored && this.queuesMonitored.length) {
				for (var i = 0, l = this.queuesMonitored.length; i < l; i++) {
					aqCount += this.queuesMonitored[i].length() * (l - i); //earlier queues are factored up to ensure that a job moving from one to the "next" causes the %complete to change 
				}
			}
			totalCurrent = arCount + aqCount;
			if (totalCurrent > this.totalRecentRequests) {
				this.totalRecentRequests = totalCurrent;
			}
			if (totalCurrent == 0) {
				this.totalRecentRequests = 0;
			}
			if (this.totalRecentRequests > 1) {
				percentComplete = Math.round((this.totalRecentRequests - totalCurrent) * 100 / (this.totalRecentRequests));
				progressBar.push('<span class="am_progressbar" title="', totalCurrent, ' ', (totalCurrent == 1 ? 'update' : 'updates'), ' waiting"><span style="width:', percentComplete, 'px;">', percentComplete, '%</span></span>');
			}
			if (ActivityMonitor.images) {
				if (arCount > 0) {
					if (ActivityMonitor.images.active) {
						progressBar.push(' <img src="', ActivityMonitor.images.active, '">');
					}
				} else {
					if (ActivityMonitor.images.inactive) {
						progressBar.push(' <img src="', ActivityMonitor.images.inactive, '">');
					}
				}
			}
			am.innerHTML = progressBar.join('');
		}
	};
}
//
// customisation - settings that will vary according to installation
//

//set this object to contain the paths to images to use when ajax requests are active and inactive.
//set to null if you don't want to use images for this.
ActivityMonitor.images = {
	active: "/images/batch/inprocess.gif",
	inactive: "/images/batch/inprocessdisabled.gif"
};
//set this function to return the number of active requests via whatever AJAX library you are using.
//for examply function() {return $.active} would work for jquery
ActivityMonitor.activeAjaxRequests = function() {
	return AjaxRequest.numActiveAjaxRequests;
};