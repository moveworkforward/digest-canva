import { useState } from "react";

const App = () => {
    const [isSubscribed, setIsSubscribed] = useState(false);

    const handleLogin = () => {
        const loginUrl = (document.getElementById("loginUrl") as HTMLInputElement)?.value;

        if (!loginUrl) {
            return;
        }
        window.open(loginUrl, "OAuth Popup", "width=500, height=500, top=100, left=100");
        window.addEventListener("message", (event) => {
            if (event.data?.status === "success") {
                setIsSubscribed(true);
            }
        });
    };

    return (
        <div>
            <h1>Canva Digest</h1>
            {!isSubscribed && <button onClick={handleLogin}>Login with Canva</button>}
            {isSubscribed && (
                <div>
                    <h2>You successfully subscribed</h2>
                </div>
            )}
        </div>
    );
};

export default App;
