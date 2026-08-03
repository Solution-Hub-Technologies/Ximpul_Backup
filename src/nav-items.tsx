
import { HomeIcon, Package, HelpCircle, Phone, Info, FileText, DollarSign, Search, ShoppingCart } from "lucide-react";
import Index from "./pages/Index.tsx";
import Specs from "./pages/Specs.tsx";
import FAQ from "./pages/FAQ.tsx";
import Contact from "./pages/Contact.tsx";
import About from "./pages/About.tsx";
import TruePrice from "./pages/TruePrice.tsx";
import ThankYou from "./pages/ThankYou.tsx";
import TermsPrivacy from "./pages/TermsPrivacy.tsx";
import { PaymentSuccess } from "./pages/PaymentSuccess.tsx";
import { PaymentFailed } from "./pages/PaymentFailed.tsx";
import WarrantyPolicy from "./pages/WarrantyPolicy.tsx";
import ReturnPolicy from "./pages/ReturnPolicy.tsx";
import { TrackOrder } from "./pages/TrackOrder.tsx";
import BulkOrder from "./pages/BulkOrder.tsx";
import JoinInitiative from "./pages/JoinInitiative.tsx";
import NewChapter from "./pages/NewChapter.tsx";
import NotFound from "./pages/NotFound.tsx";
import { Sparkles } from "lucide-react";

export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "Specs",
    to: "/specs",
    icon: <Package className="h-4 w-4" />,
    page: <Specs />,
  },
  {
    title: "TruePrice",
    to: "/trueprice",
    icon: <DollarSign className="h-4 w-4" />,
    page: <TruePrice />,
  },
  {
    title: "FAQ",
    to: "/faq",
    icon: <HelpCircle className="h-4 w-4" />,
    page: <FAQ />,
  },
  {
    title: "Contact",
    to: "/contact",
    icon: <Phone className="h-4 w-4" />,
    page: <Contact />,
  },
  {
    title: "About",
    to: "/about",
    icon: <Info className="h-4 w-4" />,
    page: <About />,
  },
  {
    title: "Thank You",
    to: "/thank-you",
    icon: <FileText className="h-4 w-4" />,
    page: <ThankYou />,
  },
  {
    title: "Terms & Privacy",
    to: "/terms-privacy",
    icon: <FileText className="h-4 w-4" />,
    page: <TermsPrivacy />,
  },
  {
    title: "Payment Success",
    to: "/payment-success",
    icon: <FileText className="h-4 w-4" />,
    page: <PaymentSuccess />,
  },
  {
    title: "Payment Failed",
    to: "/payment-failed",
    icon: <FileText className="h-4 w-4" />,
    page: <PaymentFailed />,
  },
  {
    title: "Warranty Policy",
    to: "/warranty-policy",
    icon: <FileText className="h-4 w-4" />,
    page: <WarrantyPolicy />,
  },
  {
    title: "Return Policy",
    to: "/return-policy",
    icon: <FileText className="h-4 w-4" />,
    page: <ReturnPolicy />,
  },
  {
    title: "Track Order",
    to: "/track-order",
    icon: <Search className="h-4 w-4" />,
    page: <TrackOrder />,
  },
  {
    title: "Bulk Order",
    to: "/bulk-order",
    icon: <ShoppingCart className="h-4 w-4" />,
    page: <BulkOrder />,
  },
  {
    title: "Join Initiative",
    to: "/join-initiative",
    icon: <FileText className="h-4 w-4" />,
    page: <JoinInitiative />,
  },
  {
    title: "New Lineup",
    to: "/new-lineup",
    icon: <Sparkles className="h-4 w-4" />,
    page: <NewChapter />,
  },
  {
    title: "New Lineup",
    to: "/new-chapter",
    icon: <Sparkles className="h-4 w-4" />,
    page: <NewChapter />,
  },
  {
    title: "New Lineup Alias",
    to: "/newlineup",
    icon: <Sparkles className="h-4 w-4" />,
    page: <NewChapter />,
  },
  {
    title: "New Lineup Alias",
    to: "/newchapter",
    icon: <Sparkles className="h-4 w-4" />,
    page: <NewChapter />,
  },
  {
    title: "Not Found",
    to: "*",
    icon: <FileText className="h-4 w-4" />,
    page: <NotFound />,
  },
];
