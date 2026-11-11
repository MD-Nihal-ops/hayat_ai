import { useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  FormField,
  ModalPreview,
  SheetPreview,
  Skeleton,
  Tabs,
  Toast
} from "./ui.jsx";

function ComponentSamples({ title, theme = "light", direction = "ltr", t }) {
  const [tab, setTab] = useState("home");
  const tabs = [
    { value: "home", label: t.navigation.home },
    { value: "explore", label: t.navigation.explore }
  ];

  return (
    <section
      className="styleguide-panel"
      data-preview-theme={theme === "dark" ? "dark" : "light"}
      dir={direction}
    >
      <h2>{title}</h2>
      <div className="styleguide-row">
        <Button>{t.navigation.home}</Button>
        <Button variant="secondary">{t.navigation.explore}</Button>
        <Button variant="ghost">{t.navigation.family}</Button>
        <Button variant="danger">{t.sos.button}</Button>
      </div>
      <div className="styleguide-row">
        <Badge>{t.settings.themeLight}</Badge>
        <Badge variant="danger">{t.sos.button}</Badge>
      </div>
      <Tabs items={tabs} value={tab} onChange={setTab} label={t.appName} />
      <div className="styleguide-grid">
        <Card>
          <h3>{t.navigation.family}</h3>
          <p>{t.settings.preferences}</p>
          <Banner>{t.navigation.explore}</Banner>
        </Card>
        <Card>
          <FormField label={t.auth.email} htmlFor={`styleguide-email-${theme}-${direction}`}>
            <input id={`styleguide-email-${theme}-${direction}`} type="email" />
          </FormField>
          <div className="styleguide-row">
            <Skeleton label={t.settings.working} />
            <EmptyState actionLabel={t.navigation.home} onAction={() => setTab("home")}>
              {t.navigation.explore}
            </EmptyState>
          </div>
        </Card>
      </div>
      <Toast>{t.messages.requestFailed}</Toast>
      <ModalPreview
        title={t.settings.preferences}
        closeLabel={t.chat.closeHistory}
        direction={direction}
      >
        <p>{t.navigation.me}</p>
        <div className="styleguide-row">
          <Button variant="secondary">{t.settings.themeLight}</Button>
          <Button>{t.settings.themeDark}</Button>
        </div>
      </ModalPreview>
      <SheetPreview
        title={t.navigation.family}
        closeLabel={t.chat.closeHistory}
        direction={direction}
      >
        <p>{t.settings.preferences}</p>
      </SheetPreview>
    </section>
  );
}

export default function Styleguide() {
  const { t } = useLanguage();

  return (
    <main className="styleguide mx-auto w-full max-w-6xl px-4 py-8 text-gray-900">
      <header>
        <p className="text-sm font-semibold text-hayat-700">{t.appName}</p>
        <h1 className="text-3xl font-bold">{t.sectionTabs.accessibility}</h1>
      </header>
      <ComponentSamples title={t.settings.themeLight} t={t} />
      <ComponentSamples title={t.settings.themeDark} theme="dark" t={t} />
      <ComponentSamples title={t.navigation.family} direction="rtl" t={t} />
    </main>
  );
}
