"use client";

import { useState } from "react";
import { Project } from "@/app/projects/data";
import { motion, AnimatePresence } from "framer-motion";
import { ui } from "@/i18n/en";

function ProjectCard({ project }: { project: Project }) {
  return (
    <motion.div
      key={project.slug}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10">
        <div className="flex items-center mb-4">
          <span className="px-3 py-1 bg-primary-container text-on-primary-container rounded-full text-xs font-bold font-headline uppercase tracking-wider">
            {project.category}
          </span>
        </div>

        <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">
          {project.title}
        </h3>

        <span className="text-xs font-headline font-bold text-secondary uppercase tracking-widest mb-4 block">
          {project.company}
        </span>

        <p className="text-on-surface-variant leading-relaxed mb-6 font-body">
          {project.description}
        </p>

        {project.youtubeId && (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-container-low mb-6">
            <iframe
              src={`https://www.youtube.com/embed/${project.youtubeId}`}
              title={project.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-surface-container text-on-surface rounded-full text-xs font-medium font-headline border border-outline-variant/10"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function ProjectsTimeline({
  projects,
  categories,
}: {
  projects: Project[];
  categories: string[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Highlights");

  const isHighlights = selectedCategory === "Highlights";

  const filteredProjects =
    selectedCategory === "All"
      ? projects
      : isHighlights
        ? projects.filter((p) => p.portfolio).sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
        : projects.filter((p) => p.category === selectedCategory);

  // Group by year, sorted newest first (used for non-Highlights views)
  const years = [...new Set(filteredProjects.map((p) => p.year))].sort((a, b) => b - a);
  const byYear = years.reduce<Record<number, Project[]>>((acc, year) => {
    acc[year] = filteredProjects.filter((p) => p.year === year);
    return acc;
  }, {});

  // Global index so alternating left/right continues across year groups
  const globalIndex: Record<string, number> = {};
  let counter = 0;
  years.forEach((year) => {
    byYear[year].forEach((project) => {
      globalIndex[project.slug] = counter++;
    });
  });

  return (
    <div>
      {/* Category filter pills */}
      <div className="flex flex-wrap gap-3 mb-16 justify-center">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-1.5 rounded-full text-sm font-headline font-semibold transition-all duration-300 cursor-pointer ${
              selectedCategory === category
                ? "bg-secondary-container text-on-secondary-container"
                : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Highlights: flat staggered two-column layout, no year grouping */}
      {isHighlights && (
        <AnimatePresence mode="popLayout">
          <motion.div
            key="highlights"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Mobile: single column */}
            <div className="flex flex-col gap-6 md:hidden">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
            {/* Desktop: two independent flex columns */}
            <div className="hidden md:flex gap-6 items-start">
              <div className="flex-1 flex flex-col gap-6">
                {filteredProjects
                  .filter((_, i) => i % 2 === 0)
                  .map((project) => (
                    <ProjectCard key={project.slug} project={project} />
                  ))}
              </div>
              <div className="flex-1 flex flex-col gap-6 mt-20">
                {filteredProjects
                  .filter((_, i) => i % 2 === 1)
                  .map((project) => (
                    <ProjectCard key={project.slug} project={project} />
                  ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Vertical Timeline — for all non-Highlights filters */}
      {!isHighlights && (
        <div className="relative border-l-4 border-surface-container-high ml-4 md:ml-0 md:border-l-0 md:before:absolute md:before:inset-y-0 md:before:left-1/2 md:before:w-1 md:before:bg-surface-container-high md:before:-ml-0.5">
          <AnimatePresence mode="popLayout">
            {years.map((year, yearIndex) => {
              const leftProjects = byYear[year].filter((p) => globalIndex[p.slug] % 2 === 0);
              const rightProjects = byYear[year].filter((p) => globalIndex[p.slug] % 2 === 1);
              const firstGi = globalIndex[byYear[year][0].slug];
              const firstIsLeft = firstGi % 2 === 0;

              return (
                <motion.div
                  key={`${year}-${selectedCategory}`}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="mb-20"
                >
                  {/* Year badge — one per group */}
                  <div className="relative h-16 mb-10 flex items-center">
                    {yearIndex > 0 && (
                      <div
                        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5"
                        style={{
                          backgroundImage: "repeating-linear-gradient(to right, var(--color-outline-variant) 0, var(--color-outline-variant) 14px, transparent 14px, transparent 32px)",
                          opacity: 0.4,
                        }}
                      />
                    )}
                    <div className="absolute left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-primary border-2 border-surface z-10 hidden md:flex items-center justify-center">
                      <span className="font-headline text-xs font-bold text-on-primary leading-none text-center">{year}</span>
                    </div>
                    <div className="absolute left-0 -translate-x-1/2 w-12 h-12 rounded-full bg-primary border-2 border-surface z-10 md:hidden flex items-center justify-center">
                      <span className="font-headline text-xs font-bold text-on-primary leading-none text-center">{year}</span>
                    </div>
                  </div>

                  {/* Mobile: single column */}
                  <div className="flex flex-col gap-6 md:hidden">
                    {byYear[year].map((project) => (
                      <ProjectCard key={project.slug} project={project} />
                    ))}
                  </div>

                  {/* Desktop: two independent flex columns */}
                  <div className="hidden md:flex gap-6 items-start">
                    <div className={`flex-1 flex flex-col gap-6 ${firstIsLeft ? "" : "mt-20"}`}>
                      {leftProjects.map((project) => (
                        <ProjectCard key={project.slug} project={project} />
                      ))}
                    </div>
                    <div className={`flex-1 flex flex-col gap-6 ${firstIsLeft ? "mt-20" : ""}`}>
                      {rightProjects.map((project) => (
                        <ProjectCard key={project.slug} project={project} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant font-body">
              {ui.projects.empty}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
