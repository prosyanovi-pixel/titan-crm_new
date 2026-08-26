import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useTranslation } from "@/lib/i18n";
import { useSettings } from "@/hooks/use-settings";

export function OnboardingWizard() {
  const { t } = useTranslation();
  const [run, setRun] = useState(false);
  const { theme } = useSettings();

  useEffect(() => {
    // Check if user has already seen the onboarding
    const hasSeenOnboarding = localStorage.getItem("titan_onboarding_completed");
    
    // We delay the start slightly so all elements can render
    if (!hasSeenOnboarding) {
      const timer = setTimeout(() => {
        setRun(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
    
    // Listen for manual trigger
    const handleStartWizard = () => setRun(true);
    document.addEventListener("START_ONBOARDING_WIZARD", handleStartWizard);
    
    return () => {
      document.removeEventListener("START_ONBOARDING_WIZARD", handleStartWizard);
    };
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem("titan_onboarding_completed", "true");
    }
  };

  const steps: Step[] = [
    {
      target: "body",
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2 text-foreground">{t('components.onboarding_wizard.welcome_title')}</h3>
          <p className="text-muted-foreground text-sm">{t('components.onboarding_wizard.welcome_desc')}</p>
        </div>
      ),
      placement: "center",
      disableBeacon: true,
    },
    {
      target: ".tour-search-step",
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2 text-foreground">{t('components.onboarding_wizard.search_title')}</h3>
          <p className="text-muted-foreground text-sm" dangerouslySetInnerHTML={{ __html: t('components.onboarding_wizard.search_desc') }} />
        </div>
      ),
      placement: "bottom",
    },
    {
      target: ".tour-sidebar-step",
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2 text-foreground">{t('components.onboarding_wizard.menu_title')}</h3>
          <p className="text-muted-foreground text-sm">{t('components.onboarding_wizard.menu_desc')}</p>
        </div>
      ),
      placement: "right",
    },
    {
      target: ".tour-settings-step",
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2 text-foreground">{t('components.onboarding_wizard.settings_title')}</h3>
          <p className="text-muted-foreground text-sm">{t('components.onboarding_wizard.settings_desc')}</p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: ".tour-profile-step",
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2 text-foreground">{t('components.onboarding_wizard.profile_title')}</h3>
          <p className="text-muted-foreground text-sm">{t('components.onboarding_wizard.profile_desc')}</p>
        </div>
      ),
      placement: "top",
    }
  ];

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: 'hsl(var(--primary))',
          textColor: isDark ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))',
          backgroundColor: isDark ? 'hsl(var(--card))' : 'hsl(var(--card))',
          arrowColor: isDark ? 'hsl(var(--card))' : 'hsl(var(--card))',
          overlayColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
        },
        buttonClose: {
          display: 'none',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          borderRadius: 'var(--radius)',
          color: 'hsl(var(--primary-foreground))',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          marginRight: '0.5rem',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
        },
        tooltip: {
          borderRadius: 'var(--radius)',
          border: '1px solid hsl(var(--border))',
          padding: '20px',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
      }}
      locale={{
        back: t('components.onboarding_wizard.controls.back'),
        close: t('components.onboarding_wizard.controls.close'),
        last: t('components.onboarding_wizard.controls.last'),
        next: t('components.onboarding_wizard.controls.next'),
        skip: t('components.onboarding_wizard.controls.skip'),
      }}
    />
  );
}
