import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FarmLayout } from "./components/FarmLayout";
import Home from "./pages/Home";
 import { AboutPage, AccountPage, CattlePage, ContactPage, CreatePostPage, DairyPage, DeliveryPage, FarmPage, InfoPage, MarketplacePage, MilkPage, NotificationsPage, OrderPage, PostDetailsPage, MessagesPage, FavoritesPage, AvailableItemsPage, UrduMarketPage, AdminContactPage } from "./pages/SitePages";
import NotFound from "./pages/NotFound";

function Router() {
  return <FarmLayout><Switch>
    <Route path="/" component={Home} /><Route path="/farm" component={FarmPage} /><Route path="/cattle" component={CattlePage} /><Route path="/available" component={AvailableItemsPage} /><Route path="/market" component={UrduMarketPage} /><Route path="/admin-contact" component={AdminContactPage} />
    <Route path="/milk" component={MilkPage} /><Route path="/dairy" component={DairyPage} /><Route path="/marketplace" component={MarketplacePage} />
    <Route path="/marketplace/new" component={CreatePostPage} /><Route path="/marketplace/:id" component={PostDetailsPage} />
    <Route path="/order" component={OrderPage} /><Route path="/delivery" component={DeliveryPage} /><Route path="/notifications" component={NotificationsPage} /><Route path="/messages" component={MessagesPage} /><Route path="/favorites" component={FavoritesPage} />
    <Route path="/account" component={AccountPage} /><Route path="/my-orders" component={AccountPage} /><Route path="/my-posts" component={AccountPage} />
    <Route path="/about" component={AboutPage} /><Route path="/contact" component={ContactPage} /><Route path="/privacy" component={() => <InfoPage title="Privacy policy" eyebrow="Your data" />} /><Route path="/terms" component={() => <InfoPage title="Terms of use" eyebrow="Clear expectations" />} />
    <Route path="/404" component={NotFound} /><Route component={NotFound} />
  </Switch></FarmLayout>;
}

export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
