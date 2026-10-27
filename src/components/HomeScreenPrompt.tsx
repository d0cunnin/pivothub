import { useEffect, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function HomeScreenPrompt() {
  const [visible, setVisible] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIos(ios);
    const mobile = ios || /Android/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)");
    const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone;
    let dismissed = false;
    try { dismissed = sessionStorage.getItem("pivothub-home-screen-dismissed") === "true"; } catch { /* Storage may be unavailable. */ }
    setVisible(mobile && !standalone.matches && !iosStandalone && !dismissed);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setVisible(false);
      setInstructionsOpen(false);
      setInstallPrompt(null);
    };
    const onDisplayChange = () => { if (standalone.matches) onInstalled(); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    standalone.addEventListener("change", onDisplayChange);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      standalone.removeEventListener("change", onDisplayChange);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { sessionStorage.setItem("pivothub-home-screen-dismissed", "true"); } catch { /* Dismiss still works without storage. */ }
  };

  const install = async () => {
    if (!installPrompt) {
      setInstructionsOpen(true);
      return;
    }
    setInstalling(true);
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") dismiss();
    } catch {
      setInstructionsOpen(true);
    } finally {
      setInstallPrompt(null);
      setInstalling(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      <aside aria-label="Add PivotHub to your home screen" className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center gap-3 rounded-lg border border-border bg-card p-3 text-card-foreground shadow-lg lg:hidden">
        <img src="/icon-192.png" alt="" className="h-11 w-11 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">PivotHub on your home screen</p>
          <Button variant="link" className="h-auto justify-start whitespace-normal p-0 text-sm" onClick={install} disabled={installing}>
            <Download aria-hidden="true" />{installPrompt ? "Install app" : "Add to Home Screen"}
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0" onClick={dismiss} aria-label="Dismiss home-screen prompt"><X /></Button>
      </aside>
      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-lg sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-left leading-snug"><Smartphone className="h-5 w-5 shrink-0 text-primary" />Add PivotHub to your home screen</DialogTitle>
            <DialogDescription className="text-left">Open https://pivothub.io in {isIos ? "Safari on your iPhone or iPad" : "Chrome on your Android phone"}.</DialogDescription>
          </DialogHeader>
          <ol className="list-decimal space-y-3 pl-5 text-sm text-foreground">
            {isIos ? <>
              <li>Tap the <Share className="inline h-4 w-4 text-primary" aria-label="Share" /> Share button in Safari.</li>
              <li>Choose <strong>Add to Home Screen</strong>. You may need to scroll down.</li>
              <li>Tap <strong>Add</strong>.</li>
            </> : <>
              <li>Tap Chrome’s three-dot menu.</li>
              <li>Choose <strong>Add to Home screen</strong> or <strong>Install app</strong>.</li>
              <li>Confirm by tapping <strong>Add</strong> or <strong>Install</strong>.</li>
            </>}
          </ol>
          <Button onClick={() => setInstructionsOpen(false)}>Got it</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}