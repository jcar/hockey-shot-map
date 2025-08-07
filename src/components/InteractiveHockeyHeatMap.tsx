import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { hexbin as d3hexbin } from 'd3-hexbin';
import csvLoader from '../services/csvLoader';
import { ShotData } from '../services/hockeyApi';

interface FilterState {
  selectedTeams: string[];
  selectedPeriods: number[];
  selectedShotOutcomes: string[];
  minXG: number;
  maxXG: number;
  shotType: string[];
  showOnlyGoals: boolean;
  showOnlyHighDanger: boolean;
}

const InteractiveHockeyHeatMap: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [shotData, setShotData] = useState<ShotData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSummary, setDataSummary] = useState<any>(null);
  const [tooltip, setTooltip] = useState<{x: number, y: number, content: string} | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    selectedTeams: [],
    selectedPeriods: [],
    selectedShotOutcomes: [],
    minXG: 0,
    maxXG: 1,
    shotType: [],
    showOnlyGoals: false,
    showOnlyHighDanger: false,
  });

  // Load CSV data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await csvLoader.loadHockeyDataFromCsv(`${process.env.PUBLIC_URL}/hockey_data.csv`);
        setShotData(data);
        
        const summary = csvLoader.getDatasetSummary(data);
        setDataSummary(summary);
        
        // Set initial filter ranges based on data
        setFilters(prev => ({
          ...prev,
          maxXG: Math.max(...data.map(d => d.xG)),
          minXG: Math.min(...data.map(d => d.xG)),
        }));
        
        console.log('Dataset loaded:', summary);
      } catch (error) {
        setError('Failed to load hockey data from CSV');
        console.error('Error loading CSV:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Memoized filtered data
  const filteredData = useMemo(() => {
    if (!shotData.length) return [];

    return shotData.filter(shot => {
      // Team filter
      if (filters.selectedTeams.length && !filters.selectedTeams.includes(shot.teamId || '')) {
        return false;
      }
      
      // Period filter
      if (filters.selectedPeriods.length && !filters.selectedPeriods.includes(shot.period || 0)) {
        return false;
      }
      
      // Shot outcome filter (this would need to be added to your data model)
      if (filters.selectedShotOutcomes.length) {
        // For now, we'll simulate this based on xG ranges
        const outcome = shot.xG > 0.2 ? 'GOAL' : shot.xG > 0.1 ? 'SHOT' : 'MISSED_SHOT';
        if (!filters.selectedShotOutcomes.includes(outcome)) return false;
      }
      
      // xG range filter
      if (shot.xG < filters.minXG || shot.xG > filters.maxXG) {
        return false;
      }
      
      // Shot type filter
      if (filters.shotType.length && !filters.shotType.includes(shot.shotType || '')) {
        return false;
      }
      
      // Only goals filter (simulate with high xG)
      if (filters.showOnlyGoals && shot.xG < 0.8) {
        return false;
      }
      
      // Only high danger filter
      if (filters.showOnlyHighDanger && shot.xG < 0.15) {
        return false;
      }
      
      return true;
    });
  }, [shotData, filters]);

  // Filter update handlers
  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleArrayFilter = useCallback((key: keyof FilterState, value: string | number) => {
    setFilters(prev => {
      const currentArray = prev[key] as (string | number)[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [key]: newArray };
    });
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      selectedTeams: [],
      selectedPeriods: [],
      selectedShotOutcomes: [],
      minXG: dataSummary?.coordinateRanges ? 0 : filters.minXG,
      maxXG: dataSummary?.coordinateRanges ? 1 : filters.maxXG,
      shotType: [],
      showOnlyGoals: false,
      showOnlyHighDanger: false,
    });
  }, [dataSummary, filters.minXG, filters.maxXG]);

  // Chart rendering effect
  useEffect(() => {
    if (!svgRef.current || filteredData.length === 0 || !dataSummary) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Dimensions
    const width = 1000;
    const height = 700;
    const margin = { top: 80, right: 200, bottom: 80, left: 80 };

    // Data coordinate ranges
    const dataXMin = dataSummary.coordinateRanges.xMin;
    const dataXMax = dataSummary.coordinateRanges.xMax;
    const dataYMin = dataSummary.coordinateRanges.yMin;
    const dataYMax = dataSummary.coordinateRanges.yMax;
    
    // Scale to fit the coordinate system of your data
    const xScale = d3.scaleLinear()
      .domain([dataXMin, dataXMax])
      .range([margin.left, width - margin.right]);
    
    const yScale = d3.scaleLinear()
      .domain([dataYMax, dataYMin])
      .range([margin.top, height - margin.bottom]);

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create main group
    const g = svg.append('g');

    // Draw rink outline
    const rinkGroup = g.append('g').attr('class', 'rink');
    
    // Main rink area
    rinkGroup.append('rect')
      .attr('x', xScale(dataXMin + 5))
      .attr('y', yScale(dataYMax - 5))
      .attr('width', xScale(dataXMax - 5) - xScale(dataXMin + 5))
      .attr('height', yScale(dataYMin + 5) - yScale(dataYMax - 5))
      .attr('rx', 20)
      .attr('ry', 20)
      .attr('fill', 'white')
      .attr('stroke', '#000')
      .attr('stroke-width', 2);

    // Goal line
    rinkGroup.append('line')
      .attr('x1', xScale(-25))
      .attr('y1', yScale(dataYMax - 5))
      .attr('x2', xScale(-25))
      .attr('y2', yScale(dataYMin + 5))
      .attr('stroke', 'red')
      .attr('stroke-width', 3);

    // Goal crease
    rinkGroup.append('path')
      .attr('d', () => {
        const radius = Math.abs(yScale(0) - yScale(6));
        const centerX = xScale(-25);
        const centerY = yScale(0);
        return `M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 0 0 ${centerX} ${centerY + radius} Z`;
      })
      .attr('fill', 'lightblue')
      .attr('stroke', 'blue')
      .attr('stroke-width', 2);

    // Create heat map
    const hexbin = d3hexbin()
      .x((d: any) => xScale(d.x))
      .y((d: any) => yScale(d.y))
      .radius(filters.showOnlyHighDanger ? 8 : 12) // Smaller hexagons for high danger view
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);

    const hexData = hexbin(filteredData as any);

    // Color scale based on shot density
    const maxBinSize = d3.max(hexData, d => d.length) || 1;
    const colorScale = d3.scaleSequential()
      .domain([0, maxBinSize])
      .interpolator(d3.interpolateYlOrRd);

    // Draw hexagonal heat map
    rinkGroup.selectAll('.hex')
      .data(hexData.filter(d => d.length > 0))
      .enter().append('path')
      .attr('class', 'hex')
      .attr('d', hexbin.hexagon())
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .attr('fill', d => {
        const avgXG = d3.mean(d, (shot: any) => shot.xG) || 0;
        const intensity = d.length / maxBinSize;
        
        // Color based on quality vs quantity
        if (filters.showOnlyHighDanger) {
          return d3.interpolateReds(avgXG);
        } else if (avgXG > 0.1) {
          return d3.interpolateReds(Math.min(1, intensity + avgXG));
        } else {
          return colorScale(d.length);
        }
      })
      .attr('opacity', 0.8)
      .attr('stroke', '#333')
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer')
      .on('click touchstart', function(event, d) {
        event.preventDefault();
        const avgXG = d3.mean(d, (shot: any) => shot.xG) || 0;
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          const teams = Array.from(new Set(d.map((shot: any) => shot.teamId))).join(', ');
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            content: `${d.length} shots\nAvg xG: ${avgXG.toFixed(3)}\nTeams: ${teams}`
          });
        }
      })
      .on('mouseenter', function(event, d) {
        if (!('ontouchstart' in window)) {
          const avgXG = d3.mean(d, (shot: any) => shot.xG) || 0;
          const rect = svgRef.current?.getBoundingClientRect();
          if (rect) {
            const teams = Array.from(new Set(d.map((shot: any) => shot.teamId))).join(', ');
            setTooltip({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
              content: `${d.length} shots\nAvg xG: ${avgXG.toFixed(3)}\nTeams: ${teams}`
            });
          }
        }
      })
      .on('mouseleave', function() {
        if (!('ontouchstart' in window)) {
          setTooltip(null);
        }
      });

    // Add high xG shots as individual points
    if (!filters.showOnlyHighDanger) {
      rinkGroup.selectAll('.high-xg-shot')
        .data(filteredData.filter(d => d.xG > 0.15))
        .enter().append('circle')
        .attr('class', 'high-xg-shot')
        .attr('cx', d => xScale(d.x))
        .attr('cy', d => yScale(d.y))
        .attr('r', d => 3 + d.xG * 8)
        .attr('fill', 'gold')
        .attr('opacity', 0.9)
        .attr('stroke', 'orange')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('click touchstart', function(event, d) {
          event.preventDefault();
          event.stopPropagation();
          const rect = svgRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltip({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
              content: `🏒 ${d.teamId}\nxG: ${d.xG.toFixed(3)}\nType: ${d.shotType || 'Unknown'}\nPeriod: ${d.period}`
            });
          }
        })
        .on('mouseenter', function(event, d) {
          if (!('ontouchstart' in window)) {
            const rect = svgRef.current?.getBoundingClientRect();
            if (rect) {
              setTooltip({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
                content: `🏒 ${d.teamId}\nxG: ${d.xG.toFixed(3)}\nType: ${d.shotType || 'Unknown'}\nPeriod: ${d.period}`
              });
            }
          }
        })
        .on('mouseleave', function() {
          if (!('ontouchstart' in window)) {
            setTooltip(null);
          }
        });
    }

    // Add title with filter info
    const titleText = filters.selectedTeams.length > 0 
      ? `NHL Shot Heat Map - ${filters.selectedTeams.join(', ')}`
      : 'NHL Shot Heat Map - All Teams';

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .style('font-family', 'Arial, sans-serif')
      .text(titleText);

    // Add subtitle with shot count
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 55)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-family', 'Arial, sans-serif')
      .style('fill', '#666')
      .text(`${filteredData.length} shots displayed | ${((filteredData.length / shotData.length) * 100).toFixed(1)}% of dataset`);

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 180}, ${margin.top + 50})`);

    legend.append('text')
      .attr('x', 0)
      .attr('y', -10)
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Shot Density');

    // Stats box
    const statsBox = svg.append('g')
      .attr('transform', `translate(${width - 180}, ${height - 140})`);

    statsBox.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 170)
      .attr('height', 120)
      .attr('fill', 'white')
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .attr('rx', 5);

    const stats = [
      `Shots: ${filteredData.length}`,
      `Total xG: ${d3.sum(filteredData, d => d.xG).toFixed(1)}`,
      `Avg xG: ${(d3.mean(filteredData, d => d.xG) || 0).toFixed(3)}`,
      `High Danger: ${filteredData.filter(d => d.xG > 0.15).length}`,
      filters.selectedTeams.length > 0 ? `Teams: ${filters.selectedTeams.join(', ')}` : `Teams: All`,
      filters.selectedPeriods.length > 0 ? `Periods: ${filters.selectedPeriods.join(', ')}` : 'Periods: All'
    ];

    stats.forEach((stat, i) => {
      statsBox.append('text')
        .attr('x', 10)
        .attr('y', 18 + i * 16)
        .style('font-size', '11px')
        .style('font-family', 'Arial, sans-serif')
        .text(stat);
    });

  }, [filteredData, dataSummary, filters, shotData.length]);

  // Click outside handler to close tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (tooltip && svgRef.current && !svgRef.current.contains(event.target as Node)) {
        setTooltip(null);
      }
    };

    if (tooltip) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [tooltip]);

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Interactive NHL Shot Heat Map</h2>
        <p>Loading hockey data...</p>
        <div style={{ margin: '40px 0' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #61dafb',
            borderRadius: '50%',
            animation: 'spin 2s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Interactive NHL Shot Heat Map</h2>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', position: 'relative' }}>
      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: Math.max(10, Math.min(tooltip.x - 100, window.innerWidth - 220)),
            top: tooltip.y - 40,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            maxWidth: '200px',
            wordWrap: 'break-word',
            border: '1px solid #444',
            pointerEvents: 'none',
            transform: 'translateY(-100%)',
            whiteSpace: 'pre-line'
          }}
        >
          {tooltip.content}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgba(0, 0, 0, 0.9)'
            }}
          />
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h2>Interactive NHL Shot Heat Map</h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          Real-time filtering with your Hockey_Shot_Dataset.csv
        </p>
      </div>

      {/* Filter Controls */}
      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '10px',
        border: '1px solid #dee2e6'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          
          {/* Team Filter */}
          {dataSummary && (
            <div>
              <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Teams</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                {dataSummary.teams.map((team: string) => (
                  <button
                    key={team}
                    onClick={() => toggleArrayFilter('selectedTeams', team)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      backgroundColor: filters.selectedTeams.includes(team) ? '#007bff' : 'white',
                      color: filters.selectedTeams.includes(team) ? 'white' : 'black',
                      cursor: 'pointer'
                    }}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Period Filter */}
          <div>
            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Periods</label>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              {[1, 2, 3].map(period => (
                <button
                  key={period}
                  onClick={() => toggleArrayFilter('selectedPeriods', period)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: filters.selectedPeriods.includes(period) ? '#007bff' : 'white',
                    color: filters.selectedPeriods.includes(period) ? 'white' : 'black',
                    cursor: 'pointer'
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* xG Range Filter */}
          <div>
            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
              Expected Goals (xG): {filters.minXG.toFixed(2)} - {filters.maxXG.toFixed(2)}
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={filters.minXG}
                onChange={(e) => updateFilter('minXG', parseFloat(e.target.value))}
                style={{ flex: 1 }}
              />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={filters.maxXG}
                onChange={(e) => updateFilter('maxXG', parseFloat(e.target.value))}
                style={{ flex: 1 }}
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div>
            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Quick Filters</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={filters.showOnlyGoals}
                  onChange={(e) => updateFilter('showOnlyGoals', e.target.checked)}
                />
                High Quality Shots Only (xG &gt; 0.8)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={filters.showOnlyHighDanger}
                  onChange={(e) => updateFilter('showOnlyHighDanger', e.target.checked)}
                />
                High Danger Area Only (xG &gt; 0.15)
              </label>
            </div>
          </div>

        </div>

        {/* Control Buttons */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={clearFilters}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear All Filters
          </button>
          <div style={{ 
            padding: '8px 16px', 
            backgroundColor: '#e9ecef', 
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            Showing {filteredData.length} of {shotData.length} shots
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ textAlign: 'center' }}>
        <svg ref={svgRef}></svg>
      </div>

      {/* Instructions */}
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
        <p><strong>📱 Interactive Features:</strong></p>
        <ul style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
          <li><strong>Real-time Updates</strong>: Chart automatically refreshes when you change any filter</li>
          <li><strong>Team Selection</strong>: Click team buttons to filter by specific teams</li>
          <li><strong>Period Control</strong>: Show shots from specific periods only</li>
          <li><strong>xG Range</strong>: Use sliders to focus on shots within specific quality ranges</li>
          <li><strong>Quick Filters</strong>: Toggle high-quality shots and high-danger areas</li>
          <li><strong>Touch/Click</strong>: Tap any hexagon or gold dot for detailed shot information</li>
        </ul>
      </div>
    </div>
  );
};

export default InteractiveHockeyHeatMap;
