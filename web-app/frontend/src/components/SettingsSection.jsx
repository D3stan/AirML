export default function SettingsSection({ icon: Icon, title, children }) {
  return (
    <section className="ambient-card p-6 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-fixed text-primary">
          <Icon size={22} />
        </span>
        <h2 className="font-display text-headline-md text-on-surface">{title}</h2>
      </div>
      {children}
    </section>
  );
}
