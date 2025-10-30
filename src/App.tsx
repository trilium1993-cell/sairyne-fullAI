import ScreenManager from "./components/ScreenManager";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "../tailwind.css";

function App() {
  return (
    <ErrorBoundary componentName="App">
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0b0a0f'
      }}>
        <ScreenManager />
      </div>
    </ErrorBoundary>
  );
}

export default App;
