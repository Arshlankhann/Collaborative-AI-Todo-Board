import React from 'react';
export default function Loader({ fullScreen }) {
    const style = fullScreen ? { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' } : {};
    return <div style={style}>Loading...</div>;
}