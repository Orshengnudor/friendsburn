import { Route, Switch } from "wouter";
import Index from "./pages/index";
import Leaderboard from "./pages/leaderboard";
import Recap from "./pages/recap";
import Milestone from "./pages/milestone";
import { Provider } from "./components/provider";
import { AgentFeedback } from "@runablehq/website-runtime";

function App() {
  return (
    <Provider>
      <Switch>
        <Route path="/" component={Index} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/recap" component={Recap} />
        <Route path="/milestone" component={Milestone} />
        <Route component={Index} />
      </Switch>
      {/* Do not remove, off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
    </Provider>
  );
}

export default App;
