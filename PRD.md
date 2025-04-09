Let's revise the Product Requirements Document (PRD) for your Life Dashboard to ensure it's actionable and achievable by the end of today, given your existing assets and the tight timeline. Since you need to complete this by the end of today (April 1, 2025), we'll focus on a Minimum Viable Product (MVP) that leverages your existing apps and dashboard, prioritizes core functionality, and sets a foundation for future iterations. I'll also address the gaps in your current assets (e.g., lack of data-sending logic) and streamline the implementation steps.

---

# Product Requirements Document (PRD): Life Dashboard (MVP for Today)

## 1. Overview

### 1.1 Purpose

The Life Dashboard is a personal tool to monitor and optimize your behavior, health, and productivity by integrating data from multiple sources: PostureCheck (posture), Deep Focus (productivity), Health Connector (health metrics via Apple Health), Oura Ring (physiological metrics), and Plaid (financial data). For today's MVP, the focus will be on ingesting and displaying data from these sources in a basic dashboard, with minimal processing and storage.

### 1.2 Goals (Revised for Today)

- **Basic Data Ingestion**: Enable PostureCheck, Deep Focus, and Health Connector to send data to the Life Dashboard backend.
- **Real-Time Display**: Show the latest data from all sources (PostureCheck, Deep Focus, Health Connector, Oura Ring, Plaid) on the dashboard.
- **Minimal Storage**: Store data locally in JSON files for now.
- **Foundation for Future Work**: Ensure the system is extensible for historical analysis, nudges, and scalability later.

### 1.3 Stakeholders

- **User**: You, the primary user interacting with the dashboard.
- **Developer**: You, responsible for building and maintaining the system.

---

## 2. System Overview (Simplified for Today)

### 2.1 Architecture

- **Client Apps**:
  - **PostureCheck**: MacOS app that monitors posture every 5 minutes.
  - **Deep Focus**: Electron MacOS app that tracks window URLs and summarizes deep work hours.
  - **Health Connector**: iOS app that accesses Apple Health data (sleep, activity, weight, body fat).
  - **Oura Ring**: Already integrated via the Oura API in the dashboard.
  - **Plaid**: Already integrated via the Plaid API (now with production keys).
- **Backend**:
  - Use the existing NextJS project as the backend.
  - Store data in JSON files (`posture.json`, `focus.json`, `health.json`, `oura.json`, `financial.json`).
- **Frontend**:
  - Use the existing NextJS dashboard to display the latest data from each source.
- **Financial Data Sources**:
  - Plaid API for bank transactions and balances
  - Coinbase/other crypto exchange APIs for crypto holdings
  - Stock portfolio APIs (e.g., Alpaca, Interactive Brokers)
  - Custom categorization and tracking of net worth

### 2.2 Data Flow (Simplified)

1. **Data Collection**:
   - PostureCheck sends posture data to the backend.
   - Deep Focus sends focus data to the backend.
   - Health Connector sends Apple Health data to the backend.
   - Oura Ring and Plaid data are already being fetched (as per the screenshot).
2. **Data Storage**:
   - Append data to JSON files with timestamps.
3. **Data Visualization**:
   - The dashboard displays the latest data from each source.

---

## 3. Functional Requirements (MVP for Today)

### 3.1 Data Ingestion

- **PostureCheck Data**:
  - Endpoint: `POST /api/posture`
  - Data: `{ timestamp: string, posture: string (e.g., "good", "poor"), grade: number (e.g., 85) }`
  - Frequency: Every 5 minutes.
- **Deep Focus Data**:
  - Endpoint: `POST /api/focus`
  - Data: `{ timestamp: string, app: string, url: string, duration: number (seconds) }`
  - Frequency: Every 5 minutes or on app/window change.
- **Health Connector Data**:
  - Endpoint: `POST /api/health`
  - Data:
    ```typescript
    {
      timestamp: string;
      metrics: {
        steps: number;
        activeEnergy: number;
        heartRate: number;
        workout: {
          type: string;
          duration: number;
          calories: number;
        }[];
        sleep: {
          startTime: string;
          endTime: string;
          quality: string;
        };
        weight?: number;
        bodyFat?: number;
      }
    }
    ```
  - Frequency: Every 30 minutes or on significant changes
- **Oura Ring Data** (Already Implemented):
  - Endpoint: `POST /api/oura`
  - Data: `{ timestamp: string, hrv: number, heartRate: number, sleep: number }`
  - Frequency: Every 5 minutes (as per existing setup).
- **Plaid Financial Data** (Already Implemented):
  - Endpoint: `POST /api/financial`
  - Data: `{ timestamp: string, balance: number, transactions: [{ amount: number, category: string }] }`
  - Frequency: Daily or manual trigger (as per existing setup).

### 3.2 Data Storage

- Store data in JSON files in a `/data` directory:
  - `posture.json`: Array of posture entries.
  - `focus.json`: Array of focus entries.
  - `health.json`: Array of health entries.
  - `oura.json`: Array of Oura entries (already implemented).
  - `financial.json`: Array of financial entries (already implemented).
- Example for `posture.json`:
  ```json
  [
    { "timestamp": "2025-04-01T10:00:00Z", "posture": "good", "grade": 85 },
    { "timestamp": "2025-04-01T10:05:00Z", "posture": "poor", "grade": 60 }
  ]
  ```

### 3.3 Data Retrieval

- **Latest Data**:
  - Endpoint: `GET /api/posture`, `GET /api/focus`, `GET /api/health`, `GET /api/oura`, `GET /api/financial`
  - Returns the most recent entry from each JSON file.

### 3.4 Dashboard Features (MVP)

- **Overview Section**:
  - Display the latest data for each source:
    - Posture: Latest posture and grade (e.g., "Posture: good, Grade: 85%").
    - Focus: Latest app and URL (e.g., "App: VSCode, URL: N/A").
    - Health: Latest steps, sleep, activity (e.g., "Steps: 5000, Sleep: 7h, Activity: 300 cal").
    - Oura: Latest HRV, heart rate (e.g., "HRV: 50, Heart Rate: 70 bpm").
    - Financial: Latest balance, recent transaction (e.g., "Balance: $5000, Last Transaction: $50 (Food)").
- **No Historical Views for Today**: Focus on displaying the latest data only.

### 3.5 Security (Deferred)

- For today, skip authentication since this is a local setup (`localhost:3000` as per the screenshot). Add in a future iteration.

---

## 4. Non-Functional Requirements (MVP)

### 4.1 Performance

- **Data Display**: Dashboard should display the latest data within 1 second of fetching.
- **Data Ingestion**: API endpoints should handle data writes within 500ms.

### 4.2 Usability

- The dashboard should clearly show the latest data for each source in a simple, readable format (e.g., cards or a list).

---

## 5. Implementation Priority (Day 1)

1. **Set up API Endpoints**:

   - Create `/api/posture` endpoint for your existing Macbook app
   - Create `/api/health` endpoint for your iOS app
   - Create `/api/financial` endpoints for Plaid/financial integrations

2. **Data Storage**:

   - Simple JSON file storage initially
   - Schema design for future database migration

3. **Basic Dashboard Views**:
   - Real-time posture status
   - Daily health metrics summary
   - Financial overview (net worth, recent transactions)

### Step 1: Set Up Backend API Endpoints (1-2 Hours)

1. **Create API Routes in NextJS**:

   - In your existing NextJS project, add the following API routes in `/pages/api/` or `/app/api/`:

     - `posture.js`:

       ```javascript
       import fs from "fs";
       import path from "path";

       export default function handler(req, res) {
         const filePath = path.join(process.cwd(), "data", "posture.json");
         if (req.method === "POST") {
           const newData = { ...req.body, timestamp: new Date().toISOString() };
           const existingData = fs.existsSync(filePath)
             ? JSON.parse(fs.readFileSync(filePath))
             : [];
           fs.writeFileSync(
             filePath,
             JSON.stringify([...existingData, newData], null, 2)
           );
           res.status(200).json({ message: "Posture data saved" });
         } else if (req.method === "GET") {
           const data = fs.existsSync(filePath)
             ? JSON.parse(fs.readFileSync(filePath))
             : [];
           res.status(200).json(data.length > 0 ? data[data.length - 1] : {});
         } else {
           res.status(405).json({ message: "Method not allowed" });
         }
       }
       ```

     - Repeat for `focus.js`, `health.js` (same logic, just change the file name to `focus.json`, `health.json`).
     - Oura and Plaid endpoints are already implemented (as per the screenshot).

2. **Create `/data` Directory**:
   - In your project root, create a `/data` directory and initialize empty JSON files: `posture.json`, `focus.json`, `health.json` (Oura and Plaid files should already exist).

### Step 2: Update Client Apps to Send Data (2-3 Hours)

1. **PostureCheck (MacOS App)**:

   - Add logic to send posture data every 5 minutes:

     ```swift
     // Example in Swift (adjust for your setup)
     import Foundation

     func sendPostureData(posture: String, grade: Int) {
         let url = URL(string: "http://localhost:3000/api/posture")!
         var request = URLRequest(url: url)
         request.httpMethod = "POST"
         request.setValue("application/json", forHTTPHeaderField: "Content-Type")
         let data = ["posture": posture, "grade": grade] as [String: Any]
         request.httpBody = try? JSONSerialization.data(withJSONObject: data)

         URLSession.shared.dataTask(with: request) { data, response, error in
             if let error = error {
                 print("Error sending posture data: \(error)")
             } else {
                 print("Posture data sent successfully")
             }
         }.resume()
     }

     // Call this every 5 minutes (use a timer)
     Timer.scheduledTimer(withTimeInterval: 300, repeats: true) { _ in
         // Replace with actual posture data
         sendPostureData(posture: "good", grade: 85)
     }
     ```

2. **Deep Focus (Electron App)**:

   - Add logic to send focus data every 5 minutes:

     ```javascript
     const axios = require("axios");

     function sendFocusData(app, url, duration) {
       axios
         .post("http://localhost:3000/api/focus", { app, url, duration })
         .then(() => console.log("Focus data sent"))
         .catch((err) => console.error("Error sending focus data:", err));
     }

     // Call this every 5 minutes
     setInterval(() => {
       // Replace with actual app/window data
       sendFocusData("VSCode", "N/A", 300);
     }, 300000);
     ```

3. **Health Connector (iOS App)**:

   - Add logic to send Apple Health data every 30 minutes:

     ```swift
     // Example in Swift
     import Foundation
     import HealthKit

     func sendHealthData(steps: Int, sleep: Double, activity: Int, weight: Double, bodyFat: Double) {
         let url = URL(string: "http://localhost:3000/api/health")!
         var request = URLRequest(url: url)
         request.httpMethod = "POST"
         request.setValue("application/json", forHTTPHeaderField: "Content-Type")
         let data = [
             "steps": steps,
             "sleep": sleep,
             "activity": activity,
             "weight": weight,
             "bodyFat": bodyFat
         ] as [String: Any]
         request.httpBody = try? JSONSerialization.data(withJSONObject: data)

         URLSession.shared.dataTask(with: request) { data, response, error in
             if let error = error {
                 print("Error sending health data: \(error)")
             } else {
                 print("Health data sent successfully")
             }
         }.resume()
     }

     // Call this every 30 minutes (use a timer)
     Timer.scheduledTimer(withTimeInterval: 1800, repeats: true) { _ in
         // Replace with actual HealthKit data
         sendHealthData(steps: 5000, sleep: 7.0, activity: 300, weight: 70.0, bodyFat: 20.0)
     }
     ```

### Step 3: Update Dashboard to Display Data (1-2 Hours)

1. **Fetch and Display Latest Data**:

   - Update your NextJS dashboard to fetch and display the latest data:

     ```javascript
     // Example in a NextJS component (e.g., pages/index.js)
     import { useEffect, useState } from "react";

     export default function Dashboard() {
       const [posture, setPosture] = useState({});
       const [focus, setFocus] = useState({});
       const [health, setHealth] = useState({});
       const [oura, setOura] = useState({});
       const [financial, setFinancial] = useState({});

       const fetchData = async (endpoint, setter) => {
         const res = await fetch(`/api/${endpoint}`);
         const data = await res.json();
         setter(data);
       };

       useEffect(() => {
         fetchData("posture", setPosture);
         fetchData("focus", setFocus);
         fetchData("health", setHealth);
         fetchData("oura", setOura);
         fetchData("financial", setFinancial);

         // Poll every 30 seconds for updates
         const interval = setInterval(() => {
           fetchData("posture", setPosture);
           fetchData("focus", setFocus);
           fetchData("health", setHealth);
           fetchData("oura", setOura);
           fetchData("financial", setFinancial);
         }, 30000);

         return () => clearInterval(interval);
       }, []);

       return (
         <div>
           <h1>Life Dashboard</h1>
           <div>
             <h2>Posture</h2>
             <p>
               Posture: {posture.posture || "N/A"}, Grade:{" "}
               {posture.grade || "N/A"}%
             </p>
           </div>
           <div>
             <h2>Focus</h2>
             <p>
               App: {focus.app || "N/A"}, URL: {focus.url || "N/A"}
             </p>
           </div>
           <div>
             <h2>Health</h2>
             <p>
               Steps: {health.steps || "N/A"}, Sleep: {health.sleep || "N/A"}h,
               Activity: {health.activity || "N/A"} cal
             </p>
           </div>
           <div>
             <h2>Oura Ring</h2>
             <p>
               HRV: {oura.hrv || "N/A"}, Heart Rate: {oura.heartRate || "N/A"}{" "}
               bpm
             </p>
           </div>
           <div>
             <h2>Financial</h2>
             <p>Balance: ${financial.balance || "N/A"}</p>
           </div>
         </div>
       );
     }
     ```

2. **Style the Dashboard**:
   - Use basic CSS to make it readable (e.g., cards or a grid layout). You can refine this later.

### Step 4: Test the System (1 Hour)

1. **Run the NextJS App**:
   - `npm run dev` (or `yarn dev`) to start the dashboard at `http://localhost:3000`.
2. **Run Client Apps**:
   - Launch PostureCheck, Deep Focus, and Health Connector.
   - Ensure they're sending data to the respective endpoints.
3. **Verify Data**:
   - Check the JSON files in `/data` to confirm data is being written.
   - Refresh the dashboard to ensure the latest data is displayed.

---

## 6. Success Metrics (For Today)

- **Data Ingestion**: PostureCheck, Deep Focus, and Health Connector successfully send data to the backend.
- **Data Display**: The dashboard shows the latest data from all sources (PostureCheck, Deep Focus, Health Connector, Oura, Plaid).
- **No Crashes**: The system runs without errors during testing.

---

## 7. Risks and Mitigations

- **Risk**: Client apps fail to send data due to network issues.
  - **Mitigation**: Log errors in the client apps and retry sending data (can be added later).
- **Risk**: JSON files grow too large and slow down reads/writes.
  - **Mitigation**: This is fine for today's MVP; migrate to a database in the next iteration.
- **Risk**: Dashboard doesn't update with the latest data.
  - **Mitigation**: Use the polling mechanism in the frontend to fetch data every 30 seconds.

---

## 8. Timeline (For Today)

- **Step 1 (Backend API Endpoints)**: 1-2 hours
- **Step 2 (Update Client Apps)**: 2-3 hours
- **Step 3 (Update Dashboard)**: 1-2 hours
- **Step 4 (Testing)**: 1 hour
- **Total**: ~6-8 hours

This timeline assumes you're working efficiently and have no major blockers. If you encounter issues, prioritize getting at least one data source (e.g., PostureCheck) fully working.

---

## 9. Future Considerations (Post-MVP)

- **Historical Analysis**: Add endpoints and UI for daily/weekly/yearly views.
- **Real-Time Updates**: Implement WebSockets or Server-Sent Events for live updates.
- **Database Migration**: Move from JSON files to a time-series database (e.g., PostgreSQL with TimescaleDB).
- **Behavioral Nudges**: Add notifications for poor posture, excessive social media use, etc.
- **Security**: Add authentication and encryption for API endpoints.
- **Scalability**: Prepare for additional data sources (e.g., BCI devices).

---

## 10. Notes on Existing Assets

- **Oura and Plaid Integration**: Since these are already working (as per the screenshot), you don't need to modify them today. Just ensure the dashboard displays their latest data.
- **Production Plaid Keys**: Update your Plaid integration to use the production API keys (replace the playground keys in your config).
- **Local Setup**: Since you're running on `localhost:3000`, there's no need for deployment today. Focus on functionality.

---

This revised PRD focuses on an achievable MVP for today: getting your apps to send data to the backend and displaying that data on the dashboard. It leverages your existing NextJS project and minimizes complexity by skipping historical views, real-time updates, and security for now. Once this MVP is working, you can iterate on the additional features (historical analysis, nudges, etc.) in the coming days. Let me know if you'd like to adjust any part of this plan!
