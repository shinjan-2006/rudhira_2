import { StrictMode, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import Network from "./Network";
import "./network.css";
class NetworkBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="network-failure">
        <h1>We couldn’t open your network.</h1>
        <p>Please reload and try again.</p>
        <a href="./index.html">Return to the world</a>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NetworkBoundary>
      <Network />
    </NetworkBoundary>
  </StrictMode>,
);
