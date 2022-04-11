import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import App from './containers/app';
import store from './store';

ReactDOM.render(
    <Provider store={store}>
        <StrictMode>
            <App />
        </StrictMode>
    </Provider>,
    document.getElementById("root"));

// Uncomment it when Microsoft Fluent UI React is compatible with React 18
// import { createRoot } from 'react-dom/client';
// const container = document.getElementById('root');
// const root = createRoot(container);
// root.render(<App/>);