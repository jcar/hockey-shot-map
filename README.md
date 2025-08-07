# 🏒 Hockey Shot Map

An interactive hockey shot visualization application that displays NHL shot data as hexagonal heat maps. Built with React, TypeScript, and D3.js, this tool provides real-time filtering and detailed shot analytics for hockey data analysis.

![Hockey Shot Map Demo](docs/demo-screenshot.png)

## ✨ Features

### 🎯 Interactive Heat Map
- **Hexagonal Heat Map**: Shot density visualization using D3.js hexbin
- **Real-time Filtering**: Instant updates when filters change
- **Touch/Click Interaction**: Tap hexagons or individual shots for detailed information
- **Responsive Tooltips**: Detailed shot information on hover/click

### 🔍 Advanced Filtering
- **Team Selection**: Filter by specific NHL teams
- **Period Control**: Show shots from specific game periods (1st, 2nd, 3rd)
- **Expected Goals (xG) Range**: Focus on shots within specific quality ranges
- **Quick Filters**: 
  - High Quality Shots Only (xG > 0.8)
  - High Danger Area Only (xG > 0.15)

### 📊 Data Visualization
- **Color-coded Heat Map**: Intensity based on shot density and quality
- **Individual High-Value Shots**: Gold markers for high xG shots
- **Real-time Statistics**: Shot counts, total xG, averages
- **Hockey Rink Layout**: Accurate ice surface representation

### 📱 User Experience
- **Mobile Responsive**: Touch-friendly interface for mobile devices
- **Loading States**: Smooth loading experience with spinner
- **Error Handling**: Graceful error states with helpful messages
- **Clean UI**: Intuitive controls and clear visual hierarchy

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- CSV data file with hockey shot data

### Installation

```bash
# Clone the repository
git clone [your-repo-url]
cd hockey-shot-map

# Install dependencies
npm install

# Start the development server
npm start
```

The application will open at `http://localhost:3000`.

### Data Requirements

Place your hockey data CSV file at `public/hockey_data.csv`. The CSV should include:

```csv
x,y,xG,teamId,period,shotType
15.5,5.2,0.15,EDM,1,wrist
12.3,-8.1,0.22,TOR,2,snap
...
```

**Required columns:**
- `x`: X-coordinate on ice (distance from goal line)
- `y`: Y-coordinate on ice (distance from center line)
- `xG`: Expected goals value (0-1)
- `teamId`: Team identifier
- `period`: Game period (1, 2, 3)
- `shotType`: Type of shot (wrist, snap, slap, etc.)

## 📁 Project Structure

```
src/
├── components/
│   └── InteractiveHockeyHeatMap.tsx    # Main heat map component
├── services/
│   ├── csvLoader.ts                    # CSV data loading service
│   └── hockeyApi.ts                    # API service interface
├── App.tsx                             # Main app component
├── App.css                             # Application styles
└── index.tsx                           # Entry point

public/
├── hockey_data.csv                     # Your shot data (required)
└── index.html                          # HTML template
```

## 🛠️ Available Scripts

### Development
```bash
# Start development server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Production
```bash
# Build for production
npm run build

# Serve production build locally
npm run serve
```

### Code Quality
```bash
# Run TypeScript type checking
npm run type-check

# Run linting
npm run lint

# Format code
npm run format
```

## 🎨 Customization

### Adding New Data Sources

1. **API Integration**: Modify `src/services/hockeyApi.ts` to connect to your data source
2. **CSV Format**: Update `src/services/csvLoader.ts` for different CSV structures
3. **Data Model**: Extend the `ShotData` interface in `src/services/hockeyApi.ts`

### Visual Customization

1. **Color Schemes**: Modify D3.js color interpolators in the heat map component
2. **Rink Design**: Update the SVG rink drawing code for different ice layouts
3. **Styling**: Edit `src/App.css` for UI theme changes

### Filter Customization

1. **New Filters**: Add filters in the `FilterState` interface
2. **Filter Logic**: Update the `filteredData` useMemo hook
3. **UI Controls**: Add new filter components in the controls panel

## 🔧 Technical Details

### Built With
- **React 19+**: Modern React with hooks and TypeScript
- **D3.js v7**: Data visualization and DOM manipulation
- **d3-hexbin**: Hexagonal binning for heat maps
- **TypeScript**: Type safety and better development experience
- **Create React App**: Build tooling and development setup

### Key Dependencies
```json
{
  "d3": "^7.9.0",
  "d3-hexbin": "^0.2.2",
  "react": "^19.1.1",
  "typescript": "^4.9.5"
}
```

### Performance Optimizations
- **Memoized Filtering**: `useMemo` for filtered data calculations
- **Efficient Re-rendering**: Optimized D3.js updates
- **Touch Optimization**: Mobile-friendly interaction handling

## 📈 Usage Examples

### Basic Usage
Load the application and your data will be automatically processed. Use the filter controls to explore different aspects of the shot data.

### Analysis Workflows
1. **Team Analysis**: Select specific teams to compare shooting patterns
2. **Quality Analysis**: Use xG sliders to focus on high/low quality shots
3. **Situational Analysis**: Filter by period to see pattern changes over game time
4. **Danger Zone Analysis**: Toggle high-danger filter to focus on prime scoring areas

## 🐛 Troubleshooting

### Common Issues

**CSV Not Loading**
- Ensure `hockey_data.csv` is in the `public/` directory
- Check CSV format matches expected columns
- Verify file permissions and encoding (UTF-8)

**Performance Issues**
- Large datasets (>10,000 shots) may impact performance
- Consider data sampling or pagination for very large files
- Browser dev tools can help identify bottlenecks

**Mobile Display Issues**
- Heat map is optimized for desktop viewing
- Some filter controls may need scrolling on small screens
- Touch interactions work best on tablets and larger phones

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -am 'Add new feature'`
5. Push to the branch: `git push origin feature/new-feature`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- NHL for providing public hockey data
- D3.js community for visualization examples
- React and TypeScript teams for excellent tooling
- Hockey analytics community for inspiration

## 📞 Support

For questions or issues:
1. Check the [troubleshooting section](#-troubleshooting)
2. Search existing issues on GitHub
3. Create a new issue with detailed information

---

**Happy analyzing! 🏒📊**
