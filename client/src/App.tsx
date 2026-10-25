import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FarmLayout } from "./components/FarmLayout";
import { Home, AvailablePage, MarketPage, ContactPage } from "./pages/Redesign";

function Router() { return <FarmLayout><Switch><Route path="/" component={Home} /><Route path="/available" component={AvailablePage} /><Route path="/market" component={MarketPage} /><Route path="/contact" component={ContactPage} /><Route component={Home} /></Switch></FarmLayout>; }
export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
