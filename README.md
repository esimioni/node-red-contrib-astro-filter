# Node-RED Astronomical Event Filter

A Node-RED node that filter messages based on proximity to astronomical events (solstices and equinoxes).

## Features

### Astro Filter Node
- Filters messages based on whether the current date is within a specified range related to an astronomical event
- Supports all four major astronomical events:
  - March Equinox (Spring in Northern/Autumn in Southern Hemisphere)
  - June Solstice (Summer in Northern/Winter in Southern Hemisphere)
  - September Equinox (Autumn in Northern/Spring in Southern Hemisphere)
  - December Solstice (Winter in Northern/Summer in Southern Hemisphere)
- Configurable date range (start offset and end offset)
  - The range accepts start and end offsets that are both negative or both positive, in which case the event date itself won't be included, but just used as a reference
  - The most commom use is negative start offset and positive end offset
- There's no need to send the date to the input, the node uses the system date
- The node adds an `astroDiff` attribute to the `msg.payload`, wich is the difference in days from current date to the event date
- There's an option to populate `astroDiff` as an absolute value (always positve)
- Visual status indicator showing whether the current date is in range and the range itself
- Compatible with Node-RED 3.0+

## Example
![Usage Example](https://raw.githubusercontent.com/esimioni/node-red-contrib-astro-filter/master/screenshots/astro-filter-demo.png 'Usage Example')

## Installation

### From Node-RED
The latest stable version is always available on [npm](https://www.npmjs.com/package/node-red-contrib-astro-filter) for direct download from the Node-RED palette manager.

### Using npm

```bash
cd ~/.node-red
npm install node-red-contrib-astro-filter
```

### Manual Installation

1. Create the `.tgz` package file using the `release.sh` script
2. Place it in your Node-RED user directory (typically `~/.node-red`)
3. Run the following command:
   ```bash
   cd ~/.node-red
   npm install ./node-red-contrib-astro-filter-1.0.0.tgz
   ```
4. Restart Node-RED

## Usage

### Astro Filter Node

1. Add the "astro filter" node to your flow
2. Configure the node:
   - Select the astronomical event (March Equinox, June Solstice, September Equinox, or December Solstice)
   - Set the start offset and end offset to define the date range in relation to the event selected
3. Connect the node to your flow

The node will compare the current system date to specified range. If the date falls within the range, the message will pass through; otherwise, the flow will stop at this node.


## Technical Details

This node uses the [astronomy-engine](https://github.com/cosinekitty/astronomy) library for precise astronomical calculations and [moment-timezone](https://github.com/moment/moment-timezone/) for date operations.


## License

MIT
