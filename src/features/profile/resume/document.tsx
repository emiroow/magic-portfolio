import { iconDecider } from '@/components/icons';
import { CalendarDays, Link2, Mail, MapPin, Phone } from 'lucide-react';
import type { ResumeModel } from '@/features/profile/resume/build';
import type { LanguageLevel } from '@/types';

/**
 * The résumé as a sheet: server-rendered markup with no JavaScript of its own.
 *
 * `build.ts` decides what the résumé says, this file decides in what order it is said,
 * and `resume.css` decides how it looks. Everything here renders on the server, so the
 * document a crawler reads, the one a script with JavaScript turned off gets and the one
 * a printer takes are the same sheet the viewer only later distributes.
 *
 * The markup is a contract with `layout-engine.ts`, which re-flows the sections it finds
 * inside `.rs-flow__col`: the first sheet holds the `<header>` band and one flow, the flow
 * carries two equal columns, and every section is one direct child of a column. Renaming
 * a class here without renaming it there is how a résumé starts overflowing its paper.
 */

/** Section headings, read off the locale's messages by the page. */
export interface ResumeSectionLabels {
  summary: string;
  experience: string;
  projects: string;
  skills: string;
  education: string;
  certificates: string;
  languages: string;
}

/** Proficiency words, from the same five levels the dashboard edits. */
export type ResumeLevelLabels = Record<LanguageLevel, string>;

/** One titled block of the flow, already decided to have something to say. */
interface ResumeBlock {
  title: string;
  body: React.ReactNode;
}

/** Proficiency as a five-dot meter, one filled dot per step of the same level scale. */
const LEVEL_DOTS: Record<LanguageLevel, number> = { beginner: 1, intermediate: 2, advanced: 3, fluent: 4, native: 5 };

/** The size every inline glyph in the sheet draws at, so nothing inherits a default box. */
const GLYPH = 'size-[13px] shrink-0';

/** The glyph a contact chip carries: the site's own registry, at the sheet's size. */
function ContactGlyph({ icon }: { icon: string }) {
  if (icon === 'mail') return <Mail className={GLYPH} aria-hidden />;
  if (icon === 'phone') return <Phone className={GLYPH} aria-hidden />;
  // An unknown social falls through to the shared resolver, which answers with a neutral
  // mark rather than inventing a logo — the same one the navigation dock draws for it.
  return icon === 'link' ? <Link2 className={GLYPH} aria-hidden /> : iconDecider(icon, GLYPH);
}

/**
 * A run that has to keep its left-to-right order whatever the page runs: Latin month
 * names, phone digits, host names. Persian never needs it — and forcing it on a Jalali
 * period would drag the chip's own icon to the wrong end of the line, since `dir` moves
 * the whole flex row with it.
 */
const isLatin = (text: string) => !/[\u0600-\u06FF\u08A0-\u08FF]/.test(text);

/** A dated fact: the period keeps Latin digits and reading order only when it is Latin. */
function Dated({ period }: { period?: string }) {
  if (!period) return null;
  return (
    <span className="rs-m" dir={isLatin(period) ? 'ltr' : undefined}>
      <CalendarDays className={GLYPH} aria-hidden />
      {period}
    </span>
  );
}

/** The header band: name, headline and one iconed contact run. */
function ResumeHeader({ model }: { model: ResumeModel }) {
  return (
    <header>
      <h1 className="rs-name">{model.name}</h1>
      {model.role && <p className="rs-role">{model.role}</p>}
      {model.contacts.length > 0 && (
        <div className="rs-contacts">
          {model.contacts.map(contact => (
            <span className="rs-c" key={`${contact.icon}-${contact.value}`}>
              <ContactGlyph icon={contact.icon} />
              {/* A contact the model refused to link — an unsafe scheme, say — still prints
                  its value, it is simply never wired to anything. */}
              {contact.href ? (
                <a href={contact.href} dir="ltr" {...(/^https?:/i.test(contact.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                  {contact.value}
                </a>
              ) : (
                <span dir="ltr">{contact.value}</span>
              )}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}

/** One role: title and company share the first line, the facts share the next. */
function Experience({ items }: { items: ResumeModel['experience'] }) {
  return (
    <>
      {items.map(item => (
        <div className="rs-xp" key={`${item.role}-${item.company}-${item.period ?? ''}`}>
          <div className="rs-xp__head">
            {item.role && <span className="rs-xp__role">{item.role}</span>}
            {item.role && item.company && (
              <span className="rs-xp__sep" aria-hidden>
                ·
              </span>
            )}
            {item.company && <span className="rs-xp__org">{item.company}</span>}
          </div>
          {(item.period || item.location) && (
            <div className="rs-xp__meta">
              <Dated period={item.period} />
              {item.location && (
                <span className="rs-m">
                  <MapPin className={GLYPH} aria-hidden />
                  {item.location}
                </span>
              )}
            </div>
          )}
          {item.bullets.length > 0 && (
            <ul className="rs-list">
              {item.bullets.map(bullet => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </>
  );
}

/** A project: title, blurb, stack and any live or source links. */
function Projects({ items }: { items: ResumeModel['projects'] }) {
  return (
    <>
      {items.map(project => (
        <div className="rs-pj" key={project.title}>
          <p className="rs-pj__title">{project.title}</p>
          {project.description && <p className="rs-pj__desc">{project.description}</p>}
          {project.technologies.length > 0 && <p className="rs-pj__tech">{project.technologies.join(' · ')}</p>}
          {project.links.length > 0 && (
            <p className="rs-pj__link flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {project.links.map((link, at) => (
                /* Real spacing rather than a padded glyph: two hosts set side by side read
                   as two destinations only when there is air — and a tap target — between
                   them, in either direction. */
                <span className="inline-flex items-center gap-2" key={link.href}>
                  {at > 0 && (
                    <span className="rs-xp__sep" aria-hidden>
                      ·
                    </span>
                  )}
                  <a href={link.href} target="_blank" rel="noopener noreferrer" dir="ltr">
                    {link.label}
                  </a>
                </span>
              ))}
            </p>
          )}
        </div>
      ))}
    </>
  );
}

/** The study records, newest first as the archive holds them. */
function Education({ items }: { items: ResumeModel['education'] }) {
  return (
    <>
      {items.map(edu => (
        <div className="rs-ed" key={`${edu.degree}-${edu.school}`}>
          {edu.degree && <p className="rs-ed__deg">{edu.degree}</p>}
          {edu.school && <p className="rs-ed__school">{edu.school}</p>}
          {edu.period && (
            <p className="rs-ed__meta">
              <Dated period={edu.period} />
            </p>
          )}
        </div>
      ))}
    </>
  );
}

/** One credential per row: the name, the body that issued it and the span it is valid for. */
function Certificates({ items }: { items: ResumeModel['certificates'] }) {
  return (
    <>
      {items.map(certificate => (
        <div className="rs-ct" key={`${certificate.title}-${certificate.issuer ?? ''}`}>
          <p className="rs-ct__title">{certificate.title}</p>
          {certificate.issuer && <p className="rs-ct__issuer">{certificate.issuer}</p>}
          {certificate.period && <p className="rs-ct__meta">{certificate.period}</p>}
        </div>
      ))}
    </>
  );
}

/** One language per row: name on the leading edge, level word and dot meter on the other. */
function Languages({ items, levels }: { items: ResumeModel['languages']; levels: ResumeLevelLabels }) {
  return (
    <ul className="rs-langs">
      {items.map(language => {
        const filled = LEVEL_DOTS[language.level] ?? 0;
        return (
          <li className="rs-lang" key={language.name}>
            <span className="rs-lang__name">{language.name}</span>
            <span className="rs-lang__side">
              <span className="rs-lang__lvl">{levels[language.level]}</span>
              {/* The dots paint a value the words beside them already state, so they carry
                  no name of their own. */}
              <span className="rs-lang__dots" aria-hidden>
                {[1, 2, 3, 4, 5].map(step => (
                  <i key={step} className={step <= filled ? 'is-on' : undefined} />
                ))}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The blocks that lead the sheet: the summary opens, the career follows and the languages
 * a person speaks close the column. A section with nothing in it is not printed at all,
 * so an incomplete profile never leaves an empty heading on the paper.
 */
function mainBlocks(model: ResumeModel, labels: ResumeSectionLabels, levels: ResumeLevelLabels): ResumeBlock[] {
  const blocks: ResumeBlock[] = [];
  if (model.summary) blocks.push({ title: labels.summary, body: <p className="rs-summary">{model.summary}</p> });
  if (model.experience.length) blocks.push({ title: labels.experience, body: <Experience items={model.experience} /> });
  if (model.languages.length) blocks.push({ title: labels.languages, body: <Languages items={model.languages} levels={levels} /> });
  return blocks;
}

/** The blocks that carry on beside them: the toolkit, then the work and facts behind it. */
function sideBlocks(model: ResumeModel, labels: ResumeSectionLabels): ResumeBlock[] {
  const blocks: ResumeBlock[] = [];
  // Persian separates with its own comma; a Latin one reads as a decimal point there.
  if (model.skills.length)
    blocks.push({ title: labels.skills, body: <p className="rs-sk">{model.skills.join(model.locale === 'fa' ? '، ' : ', ')}</p> });
  if (model.projects.length) blocks.push({ title: labels.projects, body: <Projects items={model.projects} /> });
  if (model.education.length) blocks.push({ title: labels.education, body: <Education items={model.education} /> });
  if (model.certificates.length) blocks.push({ title: labels.certificates, body: <Certificates items={model.certificates} /> });
  return blocks;
}

/** A titled block: the heading is the section's accessible name, drawn as a ruled label. */
function Section({ title, body }: ResumeBlock) {
  return (
    <section className="rs-sec" aria-label={title}>
      <h2 className="rs-sh">{title}</h2>
      {body}
    </section>
  );
}

/**
 * The one sheet the document renders as: a header band, then the sections in
 * résumé-classic order down two equal columns.
 *
 * Two columns is also the honest no-script rendering. `layout-engine.ts` takes these
 * sections back out of the columns and re-lays them across as many A4 sheets as the
 * profile genuinely fills, so nothing is ever shrunk and nothing is clipped to make a
 * page fit.
 */
export function ResumeSheet({ model, labels, levels }: { model: ResumeModel; labels: ResumeSectionLabels; levels: ResumeLevelLabels }) {
  const main = mainBlocks(model, labels, levels);
  const side = sideBlocks(model, labels);

  return (
    <div className="rs-page">
      <ResumeHeader model={model} />
      <div className={main.length && side.length ? 'rs-flow' : 'rs-flow rs-flow--single'}>
        <div className="rs-flow__col">
          {main.map(block => (
            <Section key={block.title} {...block} />
          ))}
        </div>
        <div className="rs-flow__col">
          {side.map(block => (
            <Section key={block.title} {...block} />
          ))}
        </div>
      </div>
    </div>
  );
}
