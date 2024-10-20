import React from 'react';
import './App.css';
import queryString from 'query-string';
import {MainScreen} from "./MainScreen.tsx";

function App() {

    const parsed = queryString.parse(window.location.hash.substring(1));

    const baseUrlParam = parsed["base"];
    const issueKeyParam = parsed["issue"]!;

    const baseUrl: string = baseUrlParam ? baseUrlParam.toString() : "";
    const issueKey: string = issueKeyParam ? issueKeyParam.toString() : "";

    return (
        <div className="App">
            <MainScreen baseUrl={baseUrl} issueKey={issueKey} key="MainScreen"/>
        </div>
    );
}

export default App;
