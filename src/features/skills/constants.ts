/**
 * The toolkit catalogue — one searchable entry per tool, in sections.
 *
 * This is the single source of truth the picker reads. Each entry keeps a stable
 * `id` (the value persisted on a skill record), a canonical `name` for display and
 * search, the `group` it belongs to, and the `aliases` a searcher may type (older
 * spellings, abbreviations, punctuation variants). Search matches on any of those,
 * but the stored value is always the `id`, so `ts`, `typescript` and `TypeScript` all
 * land on the one canonical entry. Entries whose brand has artwork in `simple-icons`
 * resolve to the real logo; the rest fall back to a neutral Lucide glyph beside the
 * correct name — see `SkillGlyph`. `dashboard.skill.icons` names the ones worth
 * localising; anything missing there reads its canonical `name`.
 */
export type SkillGroupId =
  | 'general'
  | 'languages'
  | 'frameworks'
  | 'data'
  | 'infrastructure'
  | 'quality'
  | 'mobile'
  | 'design'
  | 'intelligence'
  | 'services';

export interface SkillCatalogEntry {
  /** Persisted value on the record; stable across releases. */
  id: string;
  /** Canonical display name; brand names stay in their official spelling. */
  name: string;
  group: SkillGroupId;
  /** Extra search terms — abbreviations, synonyms, older spellings. */
  aliases?: string[];
}

export const SKILL_CATALOG: SkillCatalogEntry[] = [
  // General surfaces.
  { id: 'code', name: 'Code', group: 'general', aliases: ['coding', 'development'] },
  { id: 'terminal', name: 'Terminal', group: 'general', aliases: ['console', 'prompt'] },
  { id: 'command', name: 'Command Line', group: 'general', aliases: ['cli', 'shell'] },
  { id: 'layers', name: 'Layers', group: 'general', aliases: ['stack'] },

  // Programming languages.
  { id: 'typescript', name: 'TypeScript', group: 'languages', aliases: ['ts'] },
  { id: 'javascript', name: 'JavaScript', group: 'languages', aliases: ['js', 'ecmascript', 'es6', 'es'] },
  { id: 'python', name: 'Python', group: 'languages', aliases: ['py'] },
  { id: 'java', name: 'Java', group: 'languages', aliases: ['jvm'] },
  { id: 'php', name: 'PHP', group: 'languages' },
  { id: 'csharp', name: 'C#', group: 'languages', aliases: ['c#', 'cs', 'sharp'] },
  { id: 'dotnet', name: '.NET', group: 'languages', aliases: ['net', 'asp.net'] },
  { id: 'c', name: 'C', group: 'languages' },
  { id: 'cpp', name: 'C++', group: 'languages', aliases: ['c++', 'cplusplus', 'cpp'] },
  { id: 'ruby', name: 'Ruby', group: 'languages' },
  { id: 'go', name: 'Go', group: 'languages', aliases: ['golang'] },
  { id: 'rust', name: 'Rust', group: 'languages' },
  { id: 'swift', name: 'Swift', group: 'languages' },
  { id: 'kotlin', name: 'Kotlin', group: 'languages' },
  { id: 'dart', name: 'Dart', group: 'languages' },
  { id: 'scala', name: 'Scala', group: 'languages' },
  { id: 'elixir', name: 'Elixir', group: 'languages' },
  { id: 'haskell', name: 'Haskell', group: 'languages', aliases: ['hs'] },
  { id: 'lua', name: 'Lua', group: 'languages' },
  { id: 'perl', name: 'Perl', group: 'languages' },
  { id: 'bash', name: 'Bash', group: 'languages', aliases: ['shell', 'sh', 'zsh'] },
  { id: 'powershell', name: 'PowerShell', group: 'languages', aliases: ['ps', 'pwsh'] },
  { id: 'sql', name: 'SQL', group: 'languages' },
  { id: 'html', name: 'HTML', group: 'languages', aliases: ['html5', 'markup'] },
  { id: 'css', name: 'CSS', group: 'languages', aliases: ['css3', 'styling', 'stylesheet'] },
  { id: 'zig', name: 'Zig', group: 'languages' },

  // Frameworks, libraries and runtimes.
  { id: 'react', name: 'React', group: 'frameworks', aliases: ['reactjs', 'react.js'] },
  { id: 'nextjs', name: 'Next.js', group: 'frameworks', aliases: ['next', 'next.js'] },
  { id: 'vue', name: 'Vue', group: 'frameworks', aliases: ['vuejs', 'vue.js'] },
  { id: 'nuxt', name: 'Nuxt', group: 'frameworks', aliases: ['nuxt.js', 'nuxtjs'] },
  { id: 'angular', name: 'Angular', group: 'frameworks', aliases: ['angularjs', 'angular 2'] },
  { id: 'svelte', name: 'Svelte', group: 'frameworks' },
  { id: 'sveltekit', name: 'SvelteKit', group: 'frameworks', aliases: ['svelte kit'] },
  { id: 'astro', name: 'Astro', group: 'frameworks', aliases: ['astro.js'] },
  { id: 'remix', name: 'Remix', group: 'frameworks' },
  { id: 'solidjs', name: 'SolidJS', group: 'frameworks', aliases: ['solid', 'solid.js'] },
  { id: 'qwik', name: 'Qwik', group: 'frameworks' },
  { id: 'vite', name: 'Vite', group: 'frameworks', aliases: ['vit'] },
  { id: 'webpack', name: 'Webpack', group: 'frameworks' },
  { id: 'tailwind', name: 'Tailwind CSS', group: 'frameworks', aliases: ['tailwindcss', 'tailwind'] },
  { id: 'bootstrap', name: 'Bootstrap', group: 'frameworks' },
  { id: 'sass', name: 'Sass', group: 'frameworks', aliases: ['scss'] },
  { id: 'less', name: 'Less', group: 'frameworks' },
  { id: 'postcss', name: 'PostCSS', group: 'frameworks' },
  { id: 'shadcn', name: 'shadcn/ui', group: 'frameworks', aliases: ['shadcn', 'shadcn ui'] },
  { id: 'radix', name: 'Radix UI', group: 'frameworks', aliases: ['radix-ui', 'radix'] },
  { id: 'mui', name: 'Material UI', group: 'frameworks', aliases: ['material-ui', 'material ui', 'mui'] },
  { id: 'chakra', name: 'Chakra UI', group: 'frameworks', aliases: ['chakra-ui', 'chakra'] },
  { id: 'mantine', name: 'Mantine', group: 'frameworks' },
  { id: 'daisyui', name: 'daisyUI', group: 'frameworks', aliases: ['daisy ui', 'daisy'] },
  { id: 'antdesign', name: 'Ant Design', group: 'frameworks', aliases: ['antd', 'ant design'] },
  { id: 'nodejs', name: 'Node.js', group: 'frameworks', aliases: ['node', 'node.js'] },
  { id: 'bun', name: 'Bun', group: 'frameworks' },
  { id: 'deno', name: 'Deno', group: 'frameworks' },
  { id: 'express', name: 'Express', group: 'frameworks', aliases: ['express.js', 'expressjs'] },
  { id: 'fastify', name: 'Fastify', group: 'frameworks' },
  { id: 'nestjs', name: 'NestJS', group: 'frameworks', aliases: ['nest', 'nest.js', 'nestjs'] },
  { id: 'hono', name: 'Hono', group: 'frameworks' },
  { id: 'hapi', name: 'hapi', group: 'frameworks', aliases: ['hapifjs'] },
  { id: 'django', name: 'Django', group: 'frameworks' },
  { id: 'flask', name: 'Flask', group: 'frameworks' },
  { id: 'fastapi', name: 'FastAPI', group: 'frameworks', aliases: ['fast api'] },
  { id: 'laravel', name: 'Laravel', group: 'frameworks' },
  { id: 'rails', name: 'Ruby on Rails', group: 'frameworks', aliases: ['ruby on rails', 'railsg'] },
  { id: 'spring', name: 'Spring Boot', group: 'frameworks', aliases: ['spring', 'spring boot', 'springboot'] },
  { id: 'aspnet', name: 'ASP.NET', group: 'frameworks', aliases: ['asp net', 'asp'] },
  { id: 'symfony', name: 'Symfony', group: 'frameworks' },
  { id: 'graphql', name: 'GraphQL', group: 'frameworks', aliases: ['gql'] },
  { id: 'apollo', name: 'Apollo GraphQL', group: 'frameworks', aliases: ['apollo', 'apollo graphql'] },
  { id: 'trpc', name: 'tRPC', group: 'frameworks', aliases: ['trpc', 'rpc'] },
  { id: 'rest', name: 'REST API', group: 'frameworks', aliases: ['rest', 'restful', 'api'] },
  { id: 'websocket', name: 'WebSockets', group: 'frameworks', aliases: ['ws', 'socket'] },
  { id: 'socketio', name: 'Socket.IO', group: 'frameworks', aliases: ['socket.io', 'socketio'] },
  { id: 'grpc', name: 'gRPC', group: 'frameworks', aliases: ['rpc'] },
  { id: 'threejs', name: 'Three.js', group: 'frameworks', aliases: ['three', 'three.js', 'webgl', '3d'] },
  { id: 'electron', name: 'Electron', group: 'frameworks' },
  { id: 'motion', name: 'Motion', group: 'frameworks', aliases: ['framer motion', 'animation', 'gsap', 'lottie'] },
  { id: 'storybook', name: 'Storybook', group: 'frameworks' },

  // Databases, storage and data.
  { id: 'database', name: 'Database', group: 'data', aliases: ['db', 'sql'] },
  { id: 'mongodb', name: 'MongoDB', group: 'data', aliases: ['mongo'] },
  { id: 'postgres', name: 'PostgreSQL', group: 'data', aliases: ['postgresql', 'pg', 'psql'] },
  { id: 'mysql', name: 'MySQL', group: 'data' },
  { id: 'sqlite', name: 'SQLite', group: 'data' },
  { id: 'mssql', name: 'Microsoft SQL Server', group: 'data', aliases: ['sql server', 'microsoft sql server', 'tsql'] },
  { id: 'redis', name: 'Redis', group: 'data', aliases: ['cache'] },
  { id: 'elasticsearch', name: 'Elasticsearch', group: 'data', aliases: ['elastic', 'es', 'opensearch'] },
  { id: 'opensearch', name: 'OpenSearch', group: 'data' },
  { id: 'snowflake', name: 'Snowflake', group: 'data' },
  { id: 'kafka', name: 'Apache Kafka', group: 'data', aliases: ['kafka', 'apache kafka', 'streaming'] },
  { id: 'prisma', name: 'Prisma', group: 'data' },
  { id: 'drizzle', name: 'Drizzle ORM', group: 'data', aliases: ['drizzle', 'drizzle orm'] },
  { id: 'orm', name: 'ORM', group: 'data', aliases: ['object relational mapper'] },
  { id: 'typeorm', name: 'TypeORM', group: 'data' },
  { id: 'mongoose', name: 'Mongoose', group: 'data' },
  { id: 'sequelize', name: 'Sequelize', group: 'data' },
  { id: 'firebase', name: 'Firebase', group: 'data', aliases: ['firestore'] },
  { id: 'supabase', name: 'Supabase', group: 'data' },
  { id: 'appwrite', name: 'Appwrite', group: 'data' },
  { id: 'planetscale', name: 'PlanetScale', group: 'data', aliases: ['planet scale'] },
  { id: 'neon', name: 'Neon', group: 'data', aliases: ['neon db'] },
  { id: 'pandas', name: 'pandas', group: 'data' },

  // DevOps, infrastructure and cloud.
  { id: 'server', name: 'Server', group: 'infrastructure', aliases: ['backend', 'hosting'] },
  { id: 'cloud', name: 'Cloud', group: 'infrastructure', aliases: ['cloud computing'] },
  { id: 'aws', name: 'AWS', group: 'infrastructure', aliases: ['amazon web services'] },
  { id: 'azure', name: 'Azure', group: 'infrastructure', aliases: ['microsoft azure'] },
  { id: 'gcp', name: 'Google Cloud', group: 'infrastructure', aliases: ['google cloud', 'googlecloud', 'gcp'] },
  { id: 'cloudflare', name: 'Cloudflare', group: 'infrastructure', aliases: ['cf', 'cdn'] },
  { id: 'vercel', name: 'Vercel', group: 'infrastructure' },
  { id: 'netlify', name: 'Netlify', group: 'infrastructure' },
  { id: 'railway', name: 'Railway', group: 'infrastructure' },
  { id: 'render', name: 'Render', group: 'infrastructure' },
  { id: 'flyio', name: 'Fly.io', group: 'infrastructure', aliases: ['fly', 'fly.io'] },
  { id: 'docker', name: 'Docker', group: 'infrastructure', aliases: ['container', 'containers'] },
  { id: 'kubernetes', name: 'Kubernetes', group: 'infrastructure', aliases: ['k8s', 'kube'] },
  { id: 'helm', name: 'Helm', group: 'infrastructure' },
  { id: 'terraform', name: 'Terraform', group: 'infrastructure', aliases: ['tf', 'iac'] },
  { id: 'ansible', name: 'Ansible', group: 'infrastructure' },
  { id: 'nginx', name: 'Nginx', group: 'infrastructure', aliases: ['web server', 'reverse proxy'] },
  { id: 'linux', name: 'Linux', group: 'infrastructure', aliases: ['ubuntu', 'debian'] },
  { id: 'git', name: 'Git', group: 'infrastructure', aliases: ['version control', 'vcs'] },
  { id: 'github', name: 'GitHub', group: 'infrastructure', aliases: ['gh'] },
  { id: 'github-actions', name: 'GitHub Actions', group: 'infrastructure', aliases: ['gh actions', 'actions'] },
  { id: 'gitlab', name: 'GitLab', group: 'infrastructure' },
  { id: 'bitbucket', name: 'Bitbucket', group: 'infrastructure' },
  { id: 'ci-cd', name: 'CI/CD', group: 'infrastructure', aliases: ['cicd', 'pipeline', 'ci', 'cd'] },
  { id: 'jenkins', name: 'Jenkins', group: 'infrastructure' },
  { id: 'circleci', name: 'CircleCI', group: 'infrastructure' },
  { id: 'prometheus', name: 'Prometheus', group: 'infrastructure', aliases: ['metrics'] },
  { id: 'grafana', name: 'Grafana', group: 'infrastructure', aliases: ['dashboards'] },
  { id: 'datadog', name: 'Datadog', group: 'infrastructure' },
  { id: 'deploy', name: 'Deploy', group: 'infrastructure', aliases: ['release', 'delivery'] },
  { id: 'monitoring', name: 'Monitoring', group: 'infrastructure', aliases: ['observability'] },
  { id: 'telemetry', name: 'Telemetry', group: 'infrastructure', aliases: ['opentelemetry', 'tracing'] },
  { id: 'microservices', name: 'Microservices', group: 'infrastructure', aliases: ['services', 'soa'] },
  { id: 'postman', name: 'Postman', group: 'infrastructure', aliases: ['api client'] },
  { id: 'vault', name: 'Vault', group: 'infrastructure', aliases: ['secrets'] },
  { id: 'security', name: 'Security', group: 'infrastructure', aliases: ['infosec', 'appsec'] },
  { id: 'ssh', name: 'SSH', group: 'infrastructure' },

  // Testing and quality.
  { id: 'testing', name: 'Testing', group: 'quality', aliases: ['test', 'qa'] },
  { id: 'vitest', name: 'Vitest', group: 'quality' },
  { id: 'jest', name: 'Jest', group: 'quality' },
  { id: 'mocha', name: 'Mocha', group: 'quality' },
  { id: 'testing-library', name: 'Testing Library', group: 'quality', aliases: ['rtl', 'react testing library', 'testing library'] },
  { id: 'playwright', name: 'Playwright', group: 'quality' },
  { id: 'cypress', name: 'Cypress', group: 'quality' },
  { id: 'selenium', name: 'Selenium', group: 'quality' },
  { id: 'eslint', name: 'ESLint', group: 'quality', aliases: ['lint', 'linter'] },
  { id: 'prettier', name: 'Prettier', group: 'quality', aliases: ['format', 'formatter'] },
  { id: 'biome', name: 'Biome', group: 'quality' },
  { id: 'sonarqube', name: 'SonarQube', group: 'quality', aliases: ['sonar', 'sonarcloud'] },
  { id: 'debugging', name: 'Debugging', group: 'quality' },
  { id: 'accessibility', name: 'Accessibility', group: 'quality', aliases: ['a11y', 'wcag'] },
  { id: 'i18n', name: 'i18n', group: 'quality', aliases: ['internationalization', 'l10n', 'localization'] },
  { id: 'rtl', name: 'RTL', group: 'quality', aliases: ['right to left', 'bidi'] },
  { id: 'jira', name: 'Jira', group: 'quality', aliases: ['issue tracking'] },
  { id: 'trello', name: 'Trello', group: 'quality' },
  { id: 'roadmap', name: 'Roadmap', group: 'quality', aliases: ['planning'] },
  { id: 'event-driven', name: 'Event-Driven Design', group: 'quality', aliases: ['event driven', 'pubsub', 'webhook'] },

  // Mobile and desktop.
  { id: 'mobile', name: 'Mobile', group: 'mobile', aliases: ['handset', 'responsive'] },
  { id: 'flutter', name: 'Flutter', group: 'mobile' },
  { id: 'react-native', name: 'React Native', group: 'mobile', aliases: ['rn', 'reactnative'] },
  { id: 'expo', name: 'Expo', group: 'mobile' },
  { id: 'ios', name: 'iOS', group: 'mobile', aliases: ['iphone'] },
  { id: 'android', name: 'Android', group: 'mobile' },
  { id: 'swiftui', name: 'SwiftUI', group: 'mobile', aliases: ['swift ui'] },
  { id: 'jetpack-compose', name: 'Jetpack Compose', group: 'mobile', aliases: ['compose', 'jetpack'] },
  { id: 'capacitor', name: 'Capacitor', group: 'mobile' },
  { id: 'tauri', name: 'Tauri', group: 'mobile', aliases: ['desktop'] },

  // Design and creative tools.
  { id: 'figma', name: 'Figma', group: 'design' },
  { id: 'palette', name: 'Design', group: 'design', aliases: ['graphic design'] },
  { id: 'design-system', name: 'Design System', group: 'design', aliases: ['ds', 'component library'] },
  { id: 'ui', name: 'UI Design', group: 'design', aliases: ['user interface'] },
  { id: 'ux', name: 'UX', group: 'design', aliases: ['user experience'] },
  { id: 'interaction', name: 'Interaction Design', group: 'design', aliases: ['ixd'] },
  { id: 'prototype', name: 'Prototyping', group: 'design', aliases: ['prototype'] },
  { id: 'framer', name: 'Framer', group: 'design' },
  { id: 'rive', name: 'Rive', group: 'design' },
  { id: 'penpot', name: 'Penpot', group: 'design' },
  { id: 'sketch', name: 'Sketch', group: 'design' },
  { id: 'after-effects', name: 'After Effects', group: 'design', aliases: ['ae', 'motion graphics'] },
  { id: 'typography', name: 'Typography', group: 'design', aliases: ['type'] },
  { id: 'visual', name: 'Visual Design', group: 'design' },
  { id: 'brand', name: 'Brand Identity', group: 'design', aliases: ['branding'] },
  { id: 'color', name: 'Color Systems', group: 'design', aliases: ['colour', 'palette'] },
  { id: 'contrast', name: 'Contrast', group: 'design' },
  { id: 'wireframe', name: 'Wireframing', group: 'design', aliases: ['wireframe'] },
  { id: 'research', name: 'User Research', group: 'design', aliases: ['ux research'] },
  { id: 'usability', name: 'Usability Testing', group: 'design' },
  { id: 'journey', name: 'Journey Mapping', group: 'design', aliases: ['user journey', 'journey map'] },
  { id: 'photoshop', name: 'Photoshop', group: 'design', aliases: ['adobe photoshop', 'ps'] },
  { id: 'illustrator', name: 'Illustrator', group: 'design', aliases: ['adobe illustrator'] },
  { id: 'canva', name: 'Canva', group: 'design' },
  { id: 'blender', name: 'Blender', group: 'design', aliases: ['3d', '3d modeling'] },
  { id: 'unity', name: 'Unity', group: 'design', aliases: ['game engine', 'gamedev'] },

  // AI, machine learning and developer AI.
  { id: 'ai', name: 'AI', group: 'intelligence', aliases: ['artificial intelligence'] },
  { id: 'ml', name: 'Machine Learning', group: 'intelligence', aliases: ['ml', 'supervised learning'] },
  { id: 'llm', name: 'LLM', group: 'intelligence', aliases: ['large language model', 'gen ai'] },
  { id: 'openai', name: 'OpenAI', group: 'intelligence', aliases: ['chatgpt', 'gpt', 'gpt-4'] },
  { id: 'anthropic', name: 'Anthropic', group: 'intelligence' },
  { id: 'claude', name: 'Claude', group: 'intelligence', aliases: ['claude ai'] },
  { id: 'gemini', name: 'Gemini', group: 'intelligence', aliases: ['google gemini', 'bard'] },
  { id: 'github-copilot', name: 'GitHub Copilot', group: 'intelligence', aliases: ['copilot'] },
  { id: 'cursor', name: 'Cursor', group: 'intelligence', aliases: ['cursor ai', 'ide'] },
  { id: 'windsurf', name: 'Windsurf', group: 'intelligence', aliases: ['codeium'] },
  { id: 'qoder', name: 'Qoder', group: 'intelligence', aliases: ['agentic ide'] },
  { id: 'huggingface', name: 'Hugging Face', group: 'intelligence', aliases: ['hugging face', 'hf', 'transformers'] },
  { id: 'langchain', name: 'LangChain', group: 'intelligence', aliases: ['lang chain'] },
  { id: 'langgraph', name: 'LangGraph', group: 'intelligence', aliases: ['lang graph'] },
  { id: 'llamaindex', name: 'LlamaIndex', group: 'intelligence', aliases: ['llama index', 'gpt index'] },
  { id: 'tensorflow', name: 'TensorFlow', group: 'intelligence', aliases: ['tf'] },
  { id: 'pytorch', name: 'PyTorch', group: 'intelligence', aliases: ['torch'] },
  { id: 'scikit-learn', name: 'scikit-learn', group: 'intelligence', aliases: ['sklearn', 'sklearn'] },
  { id: 'keras', name: 'Keras', group: 'intelligence' },
  { id: 'ollama', name: 'Ollama', group: 'intelligence', aliases: ['local llm'] },
  { id: 'docs', name: 'Docs', group: 'intelligence', aliases: ['documentation'] },
  { id: 'website', name: 'Website', group: 'intelligence', aliases: ['web', 'site'] },
  { id: 'seo', name: 'SEO', group: 'intelligence', aliases: ['search engine optimization'] },
  { id: 'analytics', name: 'Analytics', group: 'intelligence', aliases: ['data analytics', 'metrics'] },

  // Authentication, payments and digital services.
  { id: 'authjs', name: 'Auth.js', group: 'services', aliases: ['nextauth', 'next auth', 'next-auth'] },
  { id: 'clerk', name: 'Clerk', group: 'services', aliases: ['auth'] },
  { id: 'auth0', name: 'Auth0', group: 'services' },
  { id: 'keycloak', name: 'Keycloak', group: 'services' },
  { id: 'stripe', name: 'Stripe', group: 'services', aliases: ['payments', 'billing'] },
  { id: 'paypal', name: 'PayPal', group: 'services', aliases: ['payments'] },
  { id: 'sentry', name: 'Sentry', group: 'services', aliases: ['error tracking', 'crash reporting'] },
  { id: 'posthog', name: 'PostHog', group: 'services', aliases: ['product analytics', 'feature flags'] },
  { id: 'google-analytics', name: 'Google Analytics', group: 'services', aliases: ['ga', 'gtag', 'analytics'] },
  { id: 'google-tag-manager', name: 'Google Tag Manager', group: 'services', aliases: ['gtm', 'tag manager'] },
];

/** Grouped view the picker and the legacy select both read: id lists per section. */
export const SKILL_ICON_GROUPS: { group: SkillGroupId; icons: string[] }[] = (
  ['general', 'languages', 'frameworks', 'data', 'infrastructure', 'quality', 'mobile', 'design', 'intelligence', 'services'] as SkillGroupId[]
).map(group => ({ group, icons: SKILL_CATALOG.filter(entry => entry.group === group).map(entry => entry.id) }));

/** Flat set of every catalogue id: the whole picker, for membership checks. */
export const SKILL_ICONS: string[] = SKILL_CATALOG.map(entry => entry.id);

/** Canonical name per id, so an unlabelled slug still reads correctly. */
const NAME_BY_ID = new Map(SKILL_CATALOG.map(entry => [entry.id, entry.name]));

/** A stored slug's display name; unknown legacy ids fall back to the raw value. */
export function skillNameFor(id: string) {
  return NAME_BY_ID.get(id) ?? id;
}
