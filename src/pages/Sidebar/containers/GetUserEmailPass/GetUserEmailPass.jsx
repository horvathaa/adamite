import React, { useState } from 'react';
import '../Filter/FilterSummary.css';
import './GetUserEmailPass.css';

const GetUserEmailPass = ( { notifySidebarOfPassword = () => {} } ) => {
    const [password, setPassword] = useState("");
    const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

    return (
        <div className="user-email-card">
                Welcome to Adamite! Please create a key to use Adamite with VS Code.
                {showPasswordRequirements && ( <div>Key must be at least 4 characters long.</div> )}
                <div className="button-row">
                    <input type="password" value={password} placeholder="key" name="password"  minLength="4" onChange={(e) => {
                        if(showPasswordRequirements) setShowPasswordRequirements(false)
                        setPassword(e.target.value)
                    }} required></input>
                    <input type="submit" className="submit-btn" value="Submit" onClick={() => {
                        if(password.length >= 4) { notifySidebarOfPassword(password) }
                        else { setShowPasswordRequirements(true) }
                    }}></input>
                </div>

        </div>
    )
}

export default GetUserEmailPass;