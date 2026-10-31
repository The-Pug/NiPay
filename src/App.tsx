import { useEffect, useState } from 'react';
import { useDevice, syncNow, slotName } from './lib/device';
import { Welcome, Signup, Login } from './screens/Auth';
import { More, useOnline } from './screens/Main';
import { OfflinePaymentProvider } from './context/OfflinePaymentContext';
import { UserWalletHub } from './components/user/UserWalletHub';
import { UserTopUp } from './components/user/UserTopUp';
import { UserMoveMoney } from './components/user/UserMoveMoney';
import { UserHistory } from './components/user/UserHistory';
import { UserKyc } from './components/user/UserKyc';
import { UserDisputes } from './components/user/UserDisputes';
import { Pay } from './screens/Pay';
import { Receive } from './screens/Receive';
import { NiPayHeader, UserSidebar, BottomNav } from './layout/UserShell';
import { Selfie } from './screens/Selfie';
import { Badge } from './ui';

const useRoute = () => {
  const [r, setR] = useState(location.hash.slice(1) || '/');
  useEffect(() => { const f = () => setR(location.hash.slice(1) || '/'); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return r;
};

export default function App() {
  const route = useRoute(); const d = useDevice(); const online = useOnline();
  // any internet contact forces a ping: sync as soon as we are online and signed in
  useEffect(() => { if (online && d.token) syncNow(); }, [online, d.token]);
  const signedIn = !!d.token;
  let view;
  if (!signedIn && !['/signup', '/login'].includes(route)) view = <Welcome />;
  else switch (route) {
    case '/signup': view = <Signup />; break;
    case '/login': view = <Login />; break;
    case '/topup': view = <UserTopUp />; break;
    case '/pay': view = <Pay />; break;
    case '/receive': view = <Receive />; break;
    case '/history': view = <UserHistory />; break;
    case '/move': view = <UserMoveMoney />; break;
    case '/more': view = <More />; break;
    case '/selfie': view = <Selfie />; break;
    case '/report': view = <UserDisputes />; break;
    case '/profile': view = <UserKyc />; break;
    default: view = <UserWalletHub />;
  }
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <OfflinePaymentProvider online={online}>
      {signedIn && <NiPayHeader />}
      <div className="flex flex-1">
        {signedIn && <UserSidebar route={route} />}
        <main className={`flex-1 mx-auto w-full px-4 pt-4 pb-24 md:pb-8 ${signedIn ? 'max-w-5xl' : 'max-w-md'}`}>
          {!signedIn && slotName !== 'main' && <div className="mb-2"><Badge tone="blue">test slot: {slotName}</Badge></div>}
          {view}
          <p className="mt-8 text-center text-[11px] text-slate-400">Prototype · fake money · test data only · web demo (see More for what is real)</p>
        </main>
      </div>
      {signedIn && <BottomNav route={route} />}
      </OfflinePaymentProvider>
    </div>
  );
}
