import * as d3 from 'd3';
import { ShotData } from './hockeyApi';

export interface CsvShotData {
  game_id: string;
  period: number;
  period_seconds_remaining: number;
  home_score: number;
  away_score: number;
  event_team: string;
  shot_outcome: 'SHOT' | 'GOAL' | 'MISSED_SHOT' | 'BLOCKED_SHOT';
  x: number;
  y: number;
  shot_type: string;
  is_rebound: boolean;
  is_rush: boolean;
  xG: number;
}

class CsvLoaderService {
  // Load CSV data and convert to our internal format
  async loadHockeyDataFromCsv(csvFilePath: string): Promise<ShotData[]> {
    try {
      // For browser environment, we'll need to load the CSV differently
      // This assumes the CSV file is served from public directory
      const csvData = await d3.csv(csvFilePath);
      
      return csvData.map((d: any) => this.convertCsvRowToShotData(d));
    } catch (error) {
      console.error('Error loading CSV data:', error);
      throw error;
    }
  }

  // Load CSV data from text content (useful for file upload or embedded data)
  async loadHockeyDataFromText(csvText: string): Promise<ShotData[]> {
    try {
      const csvData = d3.csvParse(csvText);
      return csvData.map((d: any) => this.convertCsvRowToShotData(d));
    } catch (error) {
      console.error('Error parsing CSV text:', error);
      throw error;
    }
  }

  private convertCsvRowToShotData(row: any): ShotData {
    // Convert CSV coordinates to our rink coordinate system
    // Your CSV data has coordinates where:
    // - X ranges from about -20 to -95 (negative values, distance from goal)
    // - Y ranges from about -70 to +70 (positive/negative, side to side)
    
    // We need to transform these to match your rink visualization:
    // - Your rink is 200 feet wide × 85 feet tall
    // - Center of rink is (0, 0)
    // - Goals are at x = ±89 feet from center
    
    const csvX = parseFloat(row.x);
    const csvY = parseFloat(row.y);
    
    // Transform coordinates:
    // CSV X values are negative distances from goal, so we flip them
    // and adjust so center of rink is 0
    const transformedX = csvX; // Keep as-is since your data seems to be from one attacking direction
    const transformedY = csvY; // Y coordinates seem to be already centered
    
    return {
      x: transformedX,
      y: transformedY,
      xG: parseFloat(row.xG) || 0,
      shotType: row.shot_type || 'Unknown',
      shotOutcome: row.shot_outcome as 'SHOT' | 'GOAL' | 'MISSED_SHOT' | 'BLOCKED_SHOT',
      period: parseInt(row.period) || 1,
      time: this.secondsRemainingToTime(parseInt(row.period_seconds_remaining) || 0),
      gameId: row.game_id,
      playerId: undefined, // Not available in this dataset
      teamId: row.event_team
    };
  }

  private secondsRemainingToTime(secondsRemaining: number): string {
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Filter data by specific criteria
  filterData(data: ShotData[], filters: {
    teams?: string[];
    shotOutcomes?: string[];
    periods?: number[];
    minXG?: number;
    maxXG?: number;
  }) {
    return data.filter(shot => {
      if (filters.teams && shot.teamId && !filters.teams.includes(shot.teamId)) {
        return false;
      }
      if (filters.periods && shot.period && !filters.periods.includes(shot.period)) {
        return false;
      }
      if (filters.minXG !== undefined && shot.xG < filters.minXG) {
        return false;
      }
      if (filters.maxXG !== undefined && shot.xG > filters.maxXG) {
        return false;
      }
      return true;
    });
  }

  // Get summary statistics from the dataset
  getDatasetSummary(data: ShotData[]): {
    totalShots: number;
    totalXG: number;
    avgXG: number;
    teams: string[];
    periods: number[];
    shotTypes: string[];
    coordinateRanges: {
      xMin: number;
      xMax: number;
      yMin: number;
      yMax: number;
    };
  } {
    const teams = Array.from(new Set(data.map(d => d.teamId).filter(Boolean))) as string[];
    const periods = Array.from(new Set(data.map(d => d.period).filter(Boolean))) as number[];
    const shotTypes = Array.from(new Set(data.map(d => d.shotType).filter(Boolean))) as string[];
    
    const xCoords = data.map(d => d.x);
    const yCoords = data.map(d => d.y);
    const xGValues = data.map(d => d.xG);
    
    return {
      totalShots: data.length,
      totalXG: xGValues.reduce((sum, xG) => sum + xG, 0),
      avgXG: xGValues.reduce((sum, xG) => sum + xG, 0) / data.length,
      teams,
      periods,
      shotTypes,
      coordinateRanges: {
        xMin: Math.min(...xCoords),
        xMax: Math.max(...xCoords),
        yMin: Math.min(...yCoords),
        yMax: Math.max(...yCoords)
      }
    };
  }
}

// Create a singleton instance
const csvLoader = new CsvLoaderService();

export default csvLoader;
