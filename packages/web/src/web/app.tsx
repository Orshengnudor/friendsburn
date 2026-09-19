import { Route, Switch } from "wouter";
import Index from "./pages/index";
import Leaderboard from "./pages/leaderboard";
import Recap from "./pages/recap";
import Milestone from "./pages/milestone";
import { Provider } from "./components/provider";

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
    </Provider>
  );
}

export default App;
