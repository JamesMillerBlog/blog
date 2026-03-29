import { ui } from "@/i18n/en";

const { hero } = ui.home;

export function HeroSection() {
  return (
    <section className="mb-24 pt-32 max-w-3xl">
      <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold tracking-widest mb-6 font-headline">
        <SparkleIcon />
        {hero.badge}
      </div>

      <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-on-surface mb-8">
        {hero.heading}
      </h1>

      <p className="font-body text-xl md:text-2xl text-on-surface-variant leading-relaxed">
        {hero.body.intro}{" "}
        <span className="text-primary font-bold">{hero.body.creative}</span>{" "}
        {hero.body.explore}{" "}
        <span className="text-primary font-bold">{hero.body.technology}</span>{" "}
        {hero.body.midText}{" "}
        <span className="text-primary font-bold">{hero.body.solveProblems}</span>
        {hero.body.thenText}{" "}
        <span className="text-primary font-bold">{hero.body.ship}</span>{" "}
        <span className="text-primary font-bold">{hero.body.products}</span>{" "}
        {hero.body.andText}{" "}
        <span className="text-primary font-bold">{hero.body.build}</span>{" "}
        <span className="text-primary font-bold">{hero.body.experiences}</span>.
      </p>
    </section>
  );
}

function SparkleIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L9.19 8.63L2 12l7.19 3.37L12 22l2.81-6.63L22 12l-7.19-3.37L12 2z" />
    </svg>
  );
}
