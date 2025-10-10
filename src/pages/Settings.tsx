import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AccountSettings } from "@/components/AccountSettings";
import { AuthGuard } from "@/components/AuthGuard";

const Settings = () => {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
        <Header />
        <main className="flex-1 pt-24 pb-16">
          <AccountSettings />
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
};

export default Settings;
