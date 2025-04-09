// app/api/oura/data/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 400 });
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1); // Get yesterday's data
    const dateStr = startDate.toISOString().split("T")[0];

    console.log("Fetching Oura data for date:", dateStr);

    const [
      dailyActivity,
      dailySleep,
      dailyReadiness,
      detailedSleep,
      heartRate,
      personalInfo,
      ringConfiguration,  // New: Ring configuration
      dailySpo2          // New: Daily SpO2
    ] = await Promise.all([
      fetch(
        `https://api.ouraring.com/v2/usercollection/daily_activity?start_date=${dateStr}&end_date=${dateStr}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ).then((res) => res.json()),

      fetch(
        `https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${dateStr}&end_date=${dateStr}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ).then((res) => res.json()),

      fetch(
        `https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${dateStr}&end_date=${dateStr}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ).then((res) => res.json()),

      fetch(
        `https://api.ouraring.com/v2/usercollection/sleep?start_date=${dateStr}&end_date=${dateStr}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ).then((res) => res.json()),

      fetch(
        `https://api.ouraring.com/v2/usercollection/heartrate?start_date=${dateStr}&end_date=${dateStr}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ).then((res) => res.json()),

      fetch(`https://api.ouraring.com/v2/usercollection/personal_info`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),

      // New: Fetch ring configuration
      fetch(
        `https://api.ouraring.com/v2/usercollection/ring_configuration`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ).then((res) => res.json()),

      // New: Fetch daily SpO2 data
      fetch(
        `https://api.ouraring.com/v2/usercollection/daily_spo2?start_date=${dateStr}&end_date=${dateStr}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ).then((res) => res.json()),
    ]);

    console.log(
      dailyActivity,
      dailySleep,
      dailyReadiness,
      detailedSleep,
      heartRate,
      personalInfo,
      ringConfiguration,
      dailySpo2
    );

    // Process all the data and return a comprehensive object
    const sleep = dailySleep.data?.[0] || {};
    const detailedSleepData = detailedSleep.data?.[0] || {};
    const spo2Data = dailySpo2.data?.[0] || {};

    const formattedData = {
      personal: personalInfo.data || {},

      activity: {
        steps: dailyActivity.data?.[0]?.steps || 0,
        daily_movement: dailyActivity.data?.[0]?.daily_movement || 0,
        inactivity_alerts: dailyActivity.data?.[0]?.inactivity_alerts || 0,
      },

      sleep: {
        score: sleep.score || 0,
        efficiency: sleep.contributors?.efficiency || 0,
        deep_sleep_percentage: sleep.contributors?.deep_sleep || 0,
        rem_sleep_percentage: sleep.contributors?.rem_sleep || 0,
        total_sleep_duration_hours: detailedSleepData.total_sleep_duration
          ? (detailedSleepData.total_sleep_duration / 3600).toFixed(2)
          : 0,
        average_heart_rate: detailedSleepData.average_heart_rate || 0,
        lowest_heart_rate: detailedSleepData.lowest_heart_rate || 0,
        awake_time_minutes: detailedSleepData.awake_time
          ? Math.round(detailedSleepData.awake_time / 60)
          : 0,
      },

      readiness: {
        score: dailyReadiness.data?.[0]?.score || 0,
        temperature_trend_deviation:
          dailyReadiness.data?.[0]?.temperature_trend_deviation || 0,
        hrv_balance: dailyReadiness.data?.[0]?.contributors?.hrv_balance || 0,
        body_temperature:
          dailyReadiness.data?.[0]?.contributors?.body_temperature || 0,
      },

      heart_rate: {
        data: heartRate.data || [],
      },

      // New: Ring configuration data
      ring: {
        configurations: ringConfiguration.data || [],
        active_configuration: ringConfiguration.data?.find(
          (config: any) => config.set_up_at !== null
        ) || ringConfiguration.data?.[0] || {},
      },

      // New: SpO2 data
      spo2: {
        average_percentage: spo2Data.spo2_percentage?.average || null,
        breathing_disturbance_index: spo2Data.breathing_disturbance_index || null,
      },
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error fetching Oura data:", error);
    return NextResponse.json(
      { error: "Failed to fetch Oura data", details: error.message },
      { status: 500 }
    );
  }
}