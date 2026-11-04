
import { useEffect, useState } from "react";
import api from "./services/api";

function App() {
    const [status, setStatus] = useState("Checking...");
    const [error, setError] = useState("");

    useEffect(() => {
        const checkBackend = async () => {
            try {
                const response = await api.get("/health");
                setStatus(response.data.message);
            } catch (err) {
                setError("Backend connection failed!");
                console.error(err);
            }
        };

        checkBackend();
    }, []);

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
            <div className="text-center space-y-4">
                <h1 className="text-5xl font-bold tracking-tight">
                    NEXORA
                </h1>

                <p className="text-slate-400">
                    Scalable E-Commerce Platform
                </p>

                <p className="text-sm">
                    Backend: {error || status}
                </p>
            </div>
        </main>
    );
}

export default App;
