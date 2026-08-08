import { useState, useCallback } from 'react';

let _setToasts = null;
let _counter = 0;

function ToastContainer() {
    const [toasts, setToasts] = useState([]);
    _setToasts = setToasts;

    return (
        <div className="toast-overlay">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
            ))}
        </div>
    );
}

export function toast(msg, type = 'info', duration = 3000) {
    if (!_setToasts) return;
    const id = ++_counter;
    _setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => _setToasts(prev => prev.filter(t => t.id !== id)), duration);
}

export default ToastContainer;
