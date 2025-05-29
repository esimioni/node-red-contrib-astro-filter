const astronomy = require('astronomy-engine')
const moment = require('moment-timezone')

const getCurrentDateMock = function () {
  return new Date(mockCurrentDate)
}

const sendMock = function (msg) {
  sentMsg = msg // Capture the message sent by the node
}

const doneMock = function () {
  doneCalled = true // Capture if done was called
}

// Mock Node-RED environment
const RED = {
  nodes: {
    createNode: function (node, config) {
      // Copy config to node
      for (const key in config) {
        node[key] = config[key]
      }

      // Add event emitter functionality
      node.on = function (event, callback) {
        node.eventCallbacks = node.eventCallbacks || {}
        node.eventCallbacks[event] = callback
      }

      // Add status method
      node.status = function (status) {
        node.currentStatus = status
        statusRes = status // Capture the status for testing
      }

      // Add error method
      node.error = function (err) {
        console.error(`Node error: ${err}`)
      }
    },
    registerType: function (type, constructor) {
      astroConstructor = constructor
    }
  }
}

function sendInputEvent (date) {
  mockCurrentDate = date
  astroFilterNode.eventCallbacks.input(mockMsg, sendMock, doneMock)
}

// Import the node modules
const astro = require('../astro-filter.js')(RED, getCurrentDateMock)

beforeEach(() => {
  sentMsg = undefined
  statusRes = undefined
  doneCalled = false
  mockCurrentDate = '2025-06-25T18:46:27'
  mockMsg = { attr1: 'value 22', payload: { someData: 'test' } }

  config = {
    eventType: 'june_solstice',
    startOffset: -5,
    endOffset: 7,
    useAbsoluteDiff: false
  }
  astroFilterNode = astroConstructor(config)
})

test('Status after deployment', () => {
  expect(sentMsg).toBeUndefined()
  expect(doneCalled).toBeFalsy()
  expect(statusRes).toStrictEqual({
    fill: 'grey',
    shape: 'dot',
    text: 'Range: Jun 15 to Jun 27'
  })
})

test('Default config deployment', () => {
  config = {}
  astroFilterNode = astroConstructor(config)
  expect(statusRes.text).toBe('Range: Jun 20 to Jun 20')
})

test('Default config absolute diff', () => {
  config = { startOffset: -3 }
  astroFilterNode = astroConstructor(config)
  sendInputEvent('2025-06-18T18:46:27')
  expect(mockMsg.payload).toStrictEqual({
    astroDiff: -2,
    someData: 'test'
  })
})

test('Status input in range', () => {
  sendInputEvent('2025-06-25T18:46:27')
  expect(statusRes).toStrictEqual({
    fill: 'green',
    shape: 'dot',
    text: 'In range: Jun 15 to Jun 27'
  })
  expect(sentMsg).toBe(mockMsg)
  expect(doneCalled).toBeTruthy()
  expect(mockMsg.attr1).toBe('value 22')
  expect(mockMsg.payload).toStrictEqual({
    astroDiff: 5,
    someData: 'test'
  })
})

test('Status input outside range', () => {
  sendInputEvent('2025-06-28T18:46:27')
  expect(statusRes).toStrictEqual({
    fill: 'red',
    shape: 'ring',
    text: 'Outside range: Jun 15 to Jun 27'
  })
  expect(sentMsg).toBeUndefined()
  expect(doneCalled).toBeTruthy()
  expect(mockMsg.attr1).toBe('value 22')
  expect(mockMsg.payload).toStrictEqual({
    astroDiff: 8,
    someData: 'test'
  })
})

test('Input with empty message', () => {
  astroFilterNode.eventCallbacks.input({}, sendMock, doneMock)
  expect(statusRes.text).toBe('In range: Jun 15 to Jun 27')
  expect(doneCalled).toBeTruthy()
  expect(sentMsg).toStrictEqual({
    payload: {
      astroDiff: 5
    }
  })
})

test('Input with invalid type payload', () => {
  astroFilterNode.eventCallbacks.input({payload: 77}, sendMock, doneMock)
  expect(statusRes.text).toBe('In range: Jun 15 to Jun 27')
  expect(doneCalled).toBeTruthy()
  expect(sentMsg).toStrictEqual({
    payload: {
      astroDiff: 5
    }
  })
})

test('Negative astroDiff with absolute value', () => {
  config.useAbsoluteDiff = true
  astroFilterNode = astroConstructor(config)
  sendInputEvent('2025-06-14T18:46:27')
  expect(statusRes.text).toBe('Outside range: Jun 15 to Jun 27')
  expect(mockMsg.payload.astroDiff).toBe(6)
})

test('Range one day before', () => {
  sendInputEvent('2025-06-14T18:46:27')
  expect(statusRes.text).toBe('Outside range: Jun 15 to Jun 27')
  expect(mockMsg.payload.astroDiff).toBe(-6)
})

test('Range on start day', () => {
  sendInputEvent('2025-06-15T00:00:00')
  expect(statusRes.text).toBe('In range: Jun 15 to Jun 27')
  expect(mockMsg.payload.astroDiff).toBe(-5)
})

test('Range on event day', () => {
  sendInputEvent('2025-06-20T00:00:00')
  expect(statusRes.text).toBe('In range: Jun 15 to Jun 27')
  expect(mockMsg.payload.astroDiff).toBe(0)
})

test('Range one day before end', () => {
  sendInputEvent('2025-06-26T00:00:00')
  expect(statusRes.text).toBe('In range: Jun 15 to Jun 27')
  expect(mockMsg.payload.astroDiff).toBe(6)
})

test('Range on end day', () => {
  sendInputEvent('2025-06-27T00:00:00')
  expect(statusRes.text).toBe('In range: Jun 15 to Jun 27')
  expect(mockMsg.payload.astroDiff).toBe(7)
})

test('Range one day after end', () => {
  sendInputEvent('2025-06-28T18:46:27')
  expect(statusRes.text).toBe('Outside range: Jun 15 to Jun 27')
  expect(mockMsg.payload.astroDiff).toBe(8)
})

test('Range entirely before event', () => {
   config = {
    startOffset: -52,
    endOffset: -21
  }
  astroFilterNode = astroConstructor(config)
  sendInputEvent('2030-06-20T18:46:27')
  expect(statusRes.text).toBe('Outside range: Apr 30 to May 31')
  expect(mockMsg.payload.astroDiff).toBe(-1)
})

test('Range entirely after event', () => {
   config = {
    startOffset: 33,
    endOffset: 64
  }
  astroFilterNode = astroConstructor(config)
  sendInputEvent('2031-07-28T18:46:27')
  expect(statusRes.text).toBe('In range: Jul 24 to Aug 24')
  expect(mockMsg.payload.astroDiff).toBe(37)
})

test('Aftet event - Last day of the year', () => {
  sendInputEvent('2025-12-31T18:46:27')
  expect(statusRes.text).toBe('Outside range: Jun 15 to Jun 27')
  expect(mockMsg.payload.astroDiff).toBe(194)
})

test('Before event - First day of the year', () => {
  sendInputEvent('2026-01-01T18:46:27')
  expect(statusRes.text).toBe('Outside range: Jun 16 to Jun 28')
  expect(mockMsg.payload.astroDiff).toBe(-171)
})

test('December solstice - Range ending next year', () => {
   config = {
    eventType: 'december_solstice',
    startOffset: -5,
    endOffset: 37
  }
  astroFilterNode = astroConstructor(config)
  sendInputEvent('2025-12-31T18:46:27')
  expect(statusRes.text).toBe('In range: Dec 16 to Jan 27')
  expect(mockMsg.payload.astroDiff).toBe(10)
})

test('December solstice - Range started previous year', () => {
   config = {
    eventType: 'december_solstice',
    startOffset: -5,
    endOffset: 37
  }
  astroFilterNode = astroConstructor(config)
  sendInputEvent('2026-01-12T18:46:27')
  expect(statusRes.text).toBe('In range: Dec 16 to Jan 27')
  expect(mockMsg.payload.astroDiff).toBe(22)
})

test('December solstice - Range started previous year should go up to June next year', () => {
   config = {
    eventType: 'december_solstice',
    startOffset: -5,
    endOffset: 191
  }
  astroFilterNode = astroConstructor(config)
  sendInputEvent('2026-06-30T18:46:27')
  expect(statusRes.text).toBe('In range: Dec 16 to Jun 30')
  expect(mockMsg.payload.astroDiff).toBe(191)
})

test('December solstice - Range started previous year shouldn\'t go beyond June next year', () => {
   config = {
    eventType: 'december_solstice',
    startOffset: -5,
    endOffset: 192
  }
  astroFilterNode = astroConstructor(config)
  sendInputEvent('2026-07-01T18:46:27')
  expect(statusRes.text).toBe('Outside range: Dec 16 to Jul 1')
  expect(mockMsg.payload.astroDiff).toBe(-173)
})

test('March equinox - Range beginning previous year', () => {
   config = {
    eventType: 'march_equinox',
    startOffset: -100,
    endOffset: 37
  }
  astroFilterNode = astroConstructor(config)
  sendInputEvent('2025-12-31T18:46:27')
  expect(statusRes.text).toBe('Outside range: Dec 10 to Apr 26')
  expect(mockMsg.payload.astroDiff).toBe(286)
})

test('September equinox', () => {
  config.eventType = 'september_equinox',
  astroFilterNode = astroConstructor(config)
  sendInputEvent('2026-12-31T18:46:27')
  expect(statusRes.text).toBe('Outside range: Sep 17 to Sep 29')
  expect(mockMsg.payload.astroDiff).toBe(100)
})

test('Leap year', () => {
  config.eventType = 'march_equinox',
  astroFilterNode = astroConstructor(config)
  sendInputEvent('2028-02-29T18:46:27')
  expect(statusRes.text).toBe('Outside range: Mar 14 to Mar 26')
  expect(mockMsg.payload.astroDiff).toBe(-19)
})
