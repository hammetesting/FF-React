import { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log("App is online");
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log("App is offline");
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      if (!isOnline && data.length > 0) {
        // If we're offline but have data already, keep using it
        console.log("Offline but using existing data");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        console.log("Attempting to fetch data...");
        const response = await fetch(
          "https://ff-api-55i9.onrender.com/api/friends-and-foes"
        );

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response is not JSON");
        }

        const responseData = await response.json();
        console.log("Data loaded:", responseData);
        setData(responseData);
        setError(null);
      } catch (err) {
        console.warn("Could not fetch API data:", err.message);

        if (!isOnline) {
          setError("You are offline. Showing cached data if available.");
        } else {
          setError("Could not load data. Please check if the API is running.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOnline]);

  return (
    <div className="app-container">
      <header>
        <h1>Friends and Foes</h1>
        {!isOnline && (
          <div className="offline-banner">
            You are offline. Showing cached data.
          </div>
        )}
      </header>

      <main>
        {isLoading ? (
          <p>Loading data...</p>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            {!isOnline && (
              <p>The app will update automatically when you are back online.</p>
            )}
          </div>
        ) : (
          <ul className="data-list">
            {data.length === 0 ? (
              <p>No data available{isOnline ? "." : " in offline mode."}</p>
            ) : (
              data.map((item) => (
                <li key={item._id || item.id || Math.random().toString()}>
                  <strong>{item.name}</strong> ({item.role}) – {item.alias}
                </li>
              ))
            )}
          </ul>
        )}
      </main>
    </div>
  );
}

export default App;
