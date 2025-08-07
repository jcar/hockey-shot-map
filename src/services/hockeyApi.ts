// Hockey Analytics API Service
// This demonstrates how to integrate with a backend API for shot data

export interface ShotData {
  x: number; // Distance from center of rink (feet)
  y: number; // Distance from center line (feet) 
  xG: number; // Expected goals value (0-1)
  shotType?: string; // wrist, slap, snap, backhand, etc.
  period?: number; // 1, 2, 3, OT, SO
  time?: string; // Game time
  gameId?: string;
  playerId?: string;
  teamId?: string;
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  totalMinutes: number;
  totalXG: number;
  xGF60: number; // Expected Goals For per 60 minutes
  shots: number;
  goals: number;
  assists: number;
}

export interface GameData {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  shots: ShotData[];
}

class HockeyApiService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
  }

  // Fetch shot data for a specific player
  async getPlayerShots(playerId: string, season?: string): Promise<ShotData[]> {
    try {
      const params = new URLSearchParams();
      if (season) params.append('season', season);
      
      const response = await fetch(`${this.baseUrl}/players/${playerId}/shots?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.shots || [];
    } catch (error) {
      console.error('Error fetching player shots:', error);
      // Return mock data as fallback
      return this.getMockShotData();
    }
  }

  // Fetch player statistics
  async getPlayerStats(playerId: string, season?: string): Promise<PlayerStats> {
    try {
      const params = new URLSearchParams();
      if (season) params.append('season', season);
      
      const response = await fetch(`${this.baseUrl}/players/${playerId}/stats?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching player stats:', error);
      // Return mock stats as fallback
      return {
        playerId,
        playerName: 'Connor McDavid',
        totalMinutes: 1247,
        totalXG: 89.4,
        xGF60: 4.31,
        shots: 156,
        goals: 32,
        assists: 68
      };
    }
  }

  // Fetch shot data for a specific game
  async getGameShots(gameId: string): Promise<GameData> {
    try {
      const response = await fetch(`${this.baseUrl}/games/${gameId}/shots`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching game shots:', error);
      throw error;
    }
  }

  // Fetch team shot data
  async getTeamShots(teamId: string, season?: string): Promise<ShotData[]> {
    try {
      const params = new URLSearchParams();
      if (season) params.append('season', season);
      
      const response = await fetch(`${this.baseUrl}/teams/${teamId}/shots?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.shots || [];
    } catch (error) {
      console.error('Error fetching team shots:', error);
      return [];
    }
  }

  // Mock data for development/testing
  private getMockShotData(): ShotData[] {
    return [
      // High danger area shots
      { x: 15, y: 5, xG: 0.15, shotType: 'wrist', period: 1, time: '5:23' },
      { x: 12, y: -8, xG: 0.22, shotType: 'snap', period: 1, time: '8:45' },
      { x: 18, y: 0, xG: 0.18, shotType: 'backhand', period: 2, time: '3:12' },
      { x: 10, y: 12, xG: 0.25, shotType: 'wrist', period: 2, time: '7:34' },
      { x: 8, y: -6, xG: 0.30, shotType: 'tip', period: 2, time: '12:45' },
      { x: 16, y: 8, xG: 0.20, shotType: 'wrist', period: 3, time: '4:56' },
      { x: 14, y: -12, xG: 0.28, shotType: 'snap', period: 3, time: '9:18' },
      
      // Medium danger shots
      { x: 25, y: 15, xG: 0.08, shotType: 'wrist', period: 1, time: '2:30' },
      { x: 30, y: -18, xG: 0.06, shotType: 'slap', period: 1, time: '11:22' },
      { x: 22, y: 20, xG: 0.10, shotType: 'snap', period: 2, time: '6:45' },
      { x: 28, y: -5, xG: 0.07, shotType: 'wrist', period: 2, time: '15:33' },
      { x: 35, y: 10, xG: 0.05, shotType: 'slap', period: 3, time: '1:12' },
      { x: 20, y: -25, xG: 0.09, shotType: 'snap', period: 3, time: '8:47' },
      { x: 32, y: 22, xG: 0.04, shotType: 'wrist', period: 3, time: '16:23' },
      
      // Low danger shots
      { x: 45, y: 20, xG: 0.02, shotType: 'slap', period: 1, time: '4:15' },
      { x: 50, y: -15, xG: 0.01, shotType: 'wrist', period: 1, time: '13:28' },
      { x: 40, y: 30, xG: 0.03, shotType: 'slap', period: 2, time: '9:42' },
      { x: 48, y: -28, xG: 0.02, shotType: 'snap', period: 2, time: '18:17' },
      { x: 55, y: 12, xG: 0.01, shotType: 'slap', period: 3, time: '5:33' },
      { x: 38, y: -35, xG: 0.03, shotType: 'wrist', period: 3, time: '14:28' },

      // Add random shots for realistic distribution
      ...Array.from({ length: 120 }, (_, i) => ({
        x: Math.random() * 80 - 20,
        y: Math.random() * 60 - 30,
        xG: Math.max(0.01, Math.random() * 0.4 * Math.exp(-Math.random() * 3)),
        shotType: ['wrist', 'snap', 'slap', 'backhand', 'tip'][Math.floor(Math.random() * 5)],
        period: Math.floor(Math.random() * 3) + 1,
        time: `${Math.floor(Math.random() * 20)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
      }))
    ];
  }
}

// Create a singleton instance
const hockeyApi = new HockeyApiService();

export default hockeyApi;

// Example usage:
/*
import hockeyApi from './services/hockeyApi';

// In your React component:
const [shotData, setShotData] = useState<ShotData[]>([]);
const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);

useEffect(() => {
  const loadData = async () => {
    try {
      const [shots, stats] = await Promise.all([
        hockeyApi.getPlayerShots('8477934'), // McDavid's player ID
        hockeyApi.getPlayerStats('8477934')
      ]);
      
      setShotData(shots);
      setPlayerStats(stats);
    } catch (error) {
      console.error('Failed to load hockey data:', error);
    }
  };
  
  loadData();
}, []);
*/
