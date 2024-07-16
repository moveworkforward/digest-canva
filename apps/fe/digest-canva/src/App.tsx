import { useState } from "react";

const App = () => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [email, setEmail] = useState("");

    const onEmailKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
        console.log("onEmailKeyUp", event);
        setEmail((event.target as HTMLInputElement).value);
    };

    const onEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log("onEmailChange", event);
        setEmail(event.target.value);
    };

    const handleLogin = () => {
        let loginUrl = (document.getElementById("loginUrl") as HTMLInputElement)?.value;

        if (!loginUrl) {
            return;
        }

        const url = new URL(loginUrl);
        const curState = url.searchParams.get("state");
        const stateWithEmail = { email, state: curState };
        url.searchParams.set("state", JSON.stringify(stateWithEmail));
        loginUrl = url.toString();

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
            {!isSubscribed ? (
                <>
                    <input type="email" id="email" placeholder="Email for notifications" value={email} onKeyUp={onEmailKeyUp} onChange={onEmailChange} />
                    <br/><br/>
                    <button onClick={handleLogin} disabled={!email}>Subscribe</button>
                </>
            ) : (
                <div>
                    <h2>You successfully subscribed</h2>
                </div>
            )}
        </div>
    );
};

export default App;
