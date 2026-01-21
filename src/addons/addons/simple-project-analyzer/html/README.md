# Scratch SB3 Project Analyzer

A comprehensive web-based tool for analyzing Scratch SB3 project files. This analyzer provides detailed insights into project structure, code block usage, extensions, and more.

## Features

- **Project Analysis**: Comprehensive analysis of Scratch SB3 files
- **Code Block Statistics**: Detailed breakdown of code block types and usage
- **Extension Detection**: Automatic detection and analysis of used extensions
- **Chinese Translation Support**: Extracts and displays Chinese names for extensions
- **Color-coded Visualization**: Uses official Scratch colors for different block categories
- **Interactive Charts**: Doughnut charts showing code type distribution
- **Drag & Drop Support**: Easy file upload with drag and drop functionality

## File Structure

```
scratch-analyser/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Stylesheet
├── js/
│   └── analyzer.js     # Main JavaScript application logic
└── README.md           # This file
```

## Usage

1. Open `index.html` in a modern web browser
2. Drag and drop a Scratch SB3 file onto the upload area, or click to select a file
3. View the detailed analysis results

## Analysis Features

### Code Block Categories
- Motion (运动)
- Looks (外观)
- Sound (声音)
- Events (事件)
- Control (控制)
- Sensing (侦测)
- Operators (运算)
- Data (数据)
- Custom Functions (自定义函数)
- Extensions (with custom colors)

### Extension Analysis
- Automatic detection of used extensions
- Chinese name extraction from extension source code
- Color extraction from extension's `getInfo()` function
- Extension block usage statistics

### Project Information
- Total block count
- Sprite count
- Variable and list counts
- Broadcast message counts
- Editor platform detection

## Technical Details

### Extension Translation Parsing
The analyzer extracts Chinese translations from extensions by:
1. Parsing the `Scratch.translate.setup()` function call
2. Extracting translation JSON data
3. Matching `getInfo()` function names with translation keys
4. Handling underscore prefixes for translation keys

### Color Extraction
Extension colors are extracted from the `color1` property in the extension's `getInfo()` return object.

## Browser Compatibility

- Modern browsers with ES6+ support
- Requires JavaScript and Canvas support
- Tested with Chrome, Firefox, Safari, and Edge

## Dependencies

- [Chart.js](https://www.chartjs.org/) - For data visualization
- [JSZip](https://stuk.github.io/jszip/) - For SB3 file parsing

## License

This project is provided as-is for educational and analysis purposes.