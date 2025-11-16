import ScreenManager from "./components/ScreenManager";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MasterChannelNotice } from "./components/MasterChannelNotice";
import "../tailwind.css";

function App() {
  return (
    <ErrorBoundary componentName="App">
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0b0a0f'
      }}>
        <ScreenManager />
        <MasterChannelNotice />
      </div>
    </ErrorBoundary>
  );
}

export default App;
