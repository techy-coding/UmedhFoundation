import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./components/layouts/RootLayout";
import { DashboardLayout } from "./components/layouts/DashboardLayout";
import { LoginPage } from "./components/pages/LoginPage";
import { HomePage } from "./components/pages/HomePage";
import { DashboardPage } from "./components/pages/DashboardPage";
import { DonationPage } from "./components/pages/DonationPage";
import { VolunteerPage } from "./components/pages/VolunteerPage";
import { CampaignPage } from "./components/pages/CampaignPage";
import { AdminPage } from "./components/pages/AdminPage";
import { ImpactDashboard } from "./components/pages/ImpactDashboard";
import { SponsorshipPage } from "./components/pages/SponsorshipPage";
import { WishlistPage } from "./components/pages/WishlistPage";
import { ReportsPage } from "./components/pages/ReportsPage";
import { EventsPage } from "./components/pages/EventsPage";
import { SuccessStoriesPage } from "./components/pages/SuccessStoriesPage";
import { TransparencyPage } from "./components/pages/TransparencyPage";
import { ProfileSettingsPage } from "./components/pages/ProfileSettingsPage";
import { BeneficiaryManagement } from "./components/pages/BeneficiaryManagement";
import { BeneficiariesPage } from "./components/pages/BeneficiariesPage";
import { CampaignsPage } from "./components/pages/CampaignsPage";
import { WishlistManagePage } from "./components/pages/WishlistManagePage";
import { EventsManagePage } from "./components/pages/EventsManagePage";
import { UsersManagePage } from "./components/pages/UsersManagePage";
import { DonationsManagePage } from "./components/pages/DonationsManagePage";
import { SponsorshipsManagePage } from "./components/pages/SponsorshipsManagePage";
import { SupportRequestsPage } from "./components/pages/SupportRequestsPage";
import { ApprovalsPage } from "./components/pages/ApprovalsPage";
import { VolunteerDashboard } from "./components/pages/VolunteerDashboard";
import { AchievementsPage } from "./components/pages/AchievementsPage";
import { TaskManagementPage } from "./components/pages/TaskManagementPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "login", Component: LoginPage },
      { path: "campaigns", Component: CampaignPage },
      { path: "donate", Component: DonationPage },
      { path: "volunteer", Component: VolunteerPage },
      { path: "wishlist", Component: WishlistPage },
      { path: "stories", Component: SuccessStoriesPage },
      { path: "transparency", Component: TransparencyPage },
      { path: "events", Component: EventsPage },
    ],
  },
  {
    path: "/dashboard",
    Component: DashboardLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: "donate", Component: DonationPage },
      { path: "volunteer", Component: VolunteerPage },
      { path: "achievements", Component: AchievementsPage },
      { path: "campaigns", Component: CampaignPage },
      { path: "campaigns-manage", Component: CampaignsPage },
      { path: "admin", Component: AdminPage },
      { path: "users-manage", Component: UsersManagePage },
      { path: "approvals", Component: ApprovalsPage },
      { path: "impact", Component: ImpactDashboard },
      { path: "sponsorship", Component: SponsorshipPage },
      { path: "my-sponsorships", Component: SponsorshipsManagePage },
      { path: "my-donations", Component: DonationsManagePage },
      { path: "wishlist", Component: WishlistPage },
      { path: "wishlist-manage", Component: WishlistManagePage },
      { path: "reports", Component: ReportsPage },
      { path: "events", Component: EventsPage },
      { path: "events-manage", Component: EventsManagePage },
      { path: "tasks", Component: TaskManagementPage },
      { path: "support-requests", Component: SupportRequestsPage },
      { path: "stories", Component: SuccessStoriesPage },
      { path: "transparency", Component: TransparencyPage },
      { path: "profile", Component: ProfileSettingsPage },
      { path: "beneficiaries", Component: BeneficiariesPage },
      { path: "beneficiaries-old", Component: BeneficiaryManagement },
    ],
  },
]);
