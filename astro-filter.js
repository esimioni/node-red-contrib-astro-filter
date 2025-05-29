module.exports = function(RED, customCurrentDateFn) {
    
    const astronomy = require('astronomy-engine');
    const moment = require('moment-timezone');
    
    function AstroFilterNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Store configuration
        node.eventType = config.eventType || 'june_solstice';
        node.startOffset = parseInt(config.startOffset) || 0;
        node.endOffset = parseInt(config.endOffset) || 0;
        node.useAbsoluteDiff = config.useAbsoluteDiff || false;

        updateNodeStatus(node, true);

        // Register input handler
        node.on('input', handleInput);

        function handleInput(msg, send, done) {
            // Update node status and gets the result
            const result = updateNodeStatus(node, false);

            // Add the difference in days to the message payload
            if (!msg.payload || typeof msg.payload !== 'object') {
                msg.payload = {};
            }

            // Calculate days difference
            msg.payload.astroDiff = node.useAbsoluteDiff ? Math.abs(result.daysDiff) : result.daysDiff;

            // If within range, pass the message through
            if (result.isInRange) {
                send(msg);
            }

            // Signal completion
            if (done) {
                done();
            }
        }
        return this
    }

    const currentDate = customCurrentDateFn || function() { return new Date(); };
    
    /**
     * Get the astronomical event date for the specified year and event type
     * @param {string} eventType - The type of event to calculate
     * @param {number} year - The year to calculate for
     * @returns {Date} - JavaScript Date object representing the event
     */
    function getAstronomicalEventDate(eventType, year) {
        // Use the Seasons function to get all events for the year
        const seasons = astronomy.Seasons(year);
        
        // Get the appropriate event based on the configuration
        let eventTime;
        switch (eventType) {
            case 'march_equinox':
                eventTime = seasons.mar_equinox;
                break;
            case 'june_solstice':
                eventTime = seasons.jun_solstice;
                break;
            case 'september_equinox':
                eventTime = seasons.sep_equinox;
                break;
            case 'december_solstice':
                eventTime = seasons.dec_solstice;
                break;
        }
        return eventTime.date;
    }
    
    /**
     * Calculate event range information for a specific year
     * @param {string} eventType - The type of event
     * @param {number} year - The year to calculate for
     * @param {number} startOffset - Days offset from the event (can be negative)
     * @param {number} endOffset - Days offset from the event (can be negative)
     * @param {moment} testMoment - The test date as moment object
     * @returns {object} - Range information object
     */
    function calculateEventRange(eventType, year, startOffset, endOffset, testMoment) {
        // Calculate event date for the specified year
        const eventDate = getAstronomicalEventDate(eventType, year);
        const eventMoment = moment(eventDate).startOf('day');
        
        const rangeStart = moment(eventMoment).add(startOffset, 'days');
        const rangeEnd = moment(eventMoment).add(endOffset, 'days').endOf('day');
        
        const isInRange = testMoment.isSameOrAfter(rangeStart) && testMoment.isSameOrBefore(rangeEnd);
        
        // Calculate days difference from event date
        const daysDiff = testMoment.diff(eventMoment, 'days');
        
        const rangeText = `${rangeStart.format('MMM D')} to ${rangeEnd.format('MMM D')}`;
        
        return {
            isInRange,
            daysDiff,
            rangeText,
            eventMoment,
            rangeStart,
            rangeEnd
        };
    }
    
    /**
     * Check if a date is within the configured range around the event
     * @param {Date} testDate - The date to check
     * @param {string} eventType - The type of event
     * @param {number} startOffset - Days offset from the event (can be negative)
     * @param {number} endOffset - Days offset from the event (can be negative)
     * @returns {object} - Result object with range information
     */
    function isWithinEventRange(testDate, eventType, startOffset, endOffset) {
        // Convert test date to moment
        const testMoment = moment(testDate).startOf('day');
        const currentYear = testMoment.year();
        
        // Calculate range information for current year
        let result = calculateEventRange(eventType, currentYear, startOffset, endOffset, testMoment);
        
        // If not in range and it's early in the year (Jan-Mar), check if it falls within
        // a range that started in the previous year (especially for December solstice)
        if (!result.isInRange && testMoment.month() < 6 && eventType === 'december_solstice') {
            // Calculate range information for previous year
            const prevYearResult = calculateEventRange(eventType, currentYear - 1, startOffset, endOffset, testMoment);
            
            if (prevYearResult.isInRange) {
                result = prevYearResult;
            }
        }
        
        return {
            isInRange: result.isInRange,
            daysDiff: result.daysDiff,
            rangeText: result.rangeText
        };
    }
    
    /**
     * Update node status on deploy or after input processing
     * @param {object} node - The node to update
     * @param {boolean} deploying - Whether this is being called during node deployment
     * @returns {object} - Result object with range information
     */
    function updateNodeStatus(node, deploying) {
        const result = isWithinEventRange(
            currentDate(), 
            node.eventType, 
            node.startOffset, 
            node.endOffset
        );

        // Initialize status on deploy with range information
        if (deploying) {
            node.status({
                fill: "grey",
                shape: "dot",
                text: `Range: ${result.rangeText}`
            });
            return;
        }

        // Update status with current date and range information
        if (result.isInRange) {
            // Within range - green status
            node.status({
                fill: "green",
                shape: "dot",
                text: `In range: ${result.rangeText}`
            });
        } else {
            // Outside range - red status
            node.status({
                fill: "red",
                shape: "ring",
                text: `Outside range: ${result.rangeText}`
            });
        }
        return result;
    }
    // Register the node
    RED.nodes.registerType("astro-filter", AstroFilterNode);
};
