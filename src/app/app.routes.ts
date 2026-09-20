import { Routes } from '@angular/router';
import { Landing } from './pages/landing';
import { Onboarding } from './pages/onboarding';
import { Shell } from './shell/shell';
import { Home } from './pages/home';
import { DiscoverPage } from './pages/discover';
import { StartupPage } from './pages/startup';
import { PersonPage } from './pages/person';
import { BuildPage } from './pages/build';
import { FundPage } from './pages/fund';
import { CampaignPage } from './pages/campaign';
import { ExpertsPage, ExpertPage } from './pages/experts';
import { IncubatorsPage, IncubatorPage } from './pages/incubators';
import { ChallengesPage, ChallengePage } from './pages/challenges';
import { VideosPage } from './pages/videos';
import { NotificationsPage } from './pages/notifications';
import { MessagesPage } from './pages/messages';

export const routes: Routes = [
  { path: '', component: Landing, pathMatch: 'full', title: 'Nawa — build your startup in public' },
  { path: 'onboarding', component: Onboarding, title: 'Start building · Nawa' },
  {
    path: '',
    component: Shell,
    children: [
      { path: 'home', component: Home, title: 'Home · Nawa' },
      { path: 'discover', component: DiscoverPage, title: 'Discover · Nawa' },

      { path: 'build', component: BuildPage, data: { tab: 'dashboard' }, title: 'Build in Public · Nawa' },
      { path: 'build/copilot', component: BuildPage, data: { tab: 'copilot' }, title: 'Copilot · Nawa' },
      { path: 'build/validator', component: BuildPage, data: { tab: 'validator' }, title: 'Idea validator · Nawa' },
      { path: 'build/roadmap', component: BuildPage, data: { tab: 'roadmap' }, title: 'Roadmap · Nawa' },
      { path: 'build/campaign', component: BuildPage, data: { tab: 'campaign' }, title: 'Community round · Nawa' },

      { path: 'fund', component: FundPage, title: 'Fund · Nawa' },
      { path: 'fund/:id', component: CampaignPage, title: 'Community round · Nawa' },

      { path: 'experts', component: ExpertsPage, title: 'Experts · Nawa' },
      { path: 'experts/:id', component: ExpertPage, title: 'Expert · Nawa' },

      { path: 'incubators', component: IncubatorsPage, title: 'Incubators · Nawa' },
      { path: 'incubators/:slug', component: IncubatorPage, title: 'Programme · Nawa' },

      { path: 'challenges', component: ChallengesPage, title: 'Challenges · Nawa' },
      { path: 'challenges/:slug', component: ChallengePage, title: 'Challenge · Nawa' },

      { path: 'videos', component: VideosPage, title: 'Build clips · Nawa' },
      { path: 'notifications', component: NotificationsPage, title: 'Notifications · Nawa' },
      { path: 'messages', component: MessagesPage, title: 'Messages · Nawa' },

      { path: 's/:slug', component: StartupPage, title: 'Startup · Nawa' },
      { path: 'me', component: PersonPage, title: 'Your profile · Nawa' },
      { path: 'u/:handle', component: PersonPage, title: 'Profile · Nawa' },
    ],
  },
  { path: '**', redirectTo: '' },
];
