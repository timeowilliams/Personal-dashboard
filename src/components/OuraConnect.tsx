import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Moon, Activity, Loader2 } from 'lucide-react';

interface OuraData {
  readiness?: {
    score: number;
    temperature_trend_deviation: number;
    hr_balance: number;
  };
  sleep?: {
    duration: number;
    efficiency: number;
    hr_average: number;
    temperature_delta: number;
  };
  activity?: {
    steps: number;
    daily_movement: number;
    inactivity_alerts: number;
  };
}

const OuraConnect = ({ onSuccess }: { onSuccess: (token: string) => void }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ouraData, setOuraData] = useState<OuraData | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('Current Oura data:', ouraData); // Debug log

  const handleAuth = () => {
    const state = Math.random().toString(36).substring(7);
    const redirectUri = `${window.location.origin}/api/oura/auth`;
    localStorage.setItem('ouraAuthState', state);
    
    const authUrl = new URL('https://cloud.ouraring.com/oauth/authorize');
    authUrl.searchParams.append('client_id', 'WAZIZBOYHF5LOPZK');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    
    window.location.href = authUrl.toString();
  };

  const fetchOuraData = async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/oura/data?token=${token}`);
      console.log('Oura data response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch Oura data');
      }

      const data = await response.json();
      console.log('Setting Oura data:', data);
      setOuraData(data);
      
    } catch (err) {
      console.error('Error in fetchOuraData:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Oura data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('access_token');
      
      if (token) {
        console.log('Setting access token and authenticated state');
        setAccessToken(token);
        setIsAuthenticated(true);
        onSuccess(token);
        window.history.replaceState({}, document.title, window.location.pathname);
        await fetchOuraData(token);
      }
    };

    handleOAuthCallback();
  }, [onSuccess]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      console.log('Setting up data refresh interval');
      const interval = setInterval(() => fetchOuraData(accessToken), 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, accessToken]);

  console.log('Component state:', { isAuthenticated, loading, error }); // Debug log

  if (loading && !ouraData) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading your Oura data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        <p>Error loading Oura data: {error}</p>
        <Button 
          onClick={() => accessToken && fetchOuraData(accessToken)}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <Button 
          onClick={handleAuth}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect Oura Ring'
          )}
        </Button>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Readiness</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ouraData?.readiness?.score ?? '--'}
            </div>
            <p className="text-xs text-muted-foreground">Daily Score</p>
            {ouraData?.readiness?.hr_balance !== undefined && (
              <div className="mt-2 text-sm">
                HR Balance: {ouraData.readiness.hr_balance}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sleep</CardTitle>
            <Moon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ouraData?.sleep?.duration ? 
                `${Math.floor(ouraData.sleep.duration / 3600)}h ${Math.floor((ouraData.sleep.duration % 3600) / 60)}m` 
                : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {ouraData?.sleep?.efficiency ? 
                `${ouraData.sleep.efficiency}% efficient` : 
                'Sleep Duration'}
            </p>
            {ouraData?.sleep?.hr_average !== undefined && (
              <div className="mt-2 text-sm">
                Avg HR: {ouraData.sleep.hr_average} bpm
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ouraData?.activity?.steps?.toLocaleString() ?? '--'}
            </div>
            <p className="text-xs text-muted-foreground">Daily Steps</p>
            {ouraData?.activity?.daily_movement !== undefined && (
              <div className="mt-2 text-sm">
                Movement: {Math.round(ouraData.activity.daily_movement)} cal
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderContent()}
    </div>
  );
};

export default OuraConnect;