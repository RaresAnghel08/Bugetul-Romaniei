export interface NavDict {
  home: string;
  overview: string;
  ministere: string;
  comparator: string;
  investitii: string;
  joc: string;
  openMenu: string;
  closeMenu: string;
  mainNavAria: string;
  mobileNavAria: string;
}

export interface FooterDict {
  tagline: string;
  serviciiTitle: string;
  overviewLink: string;
  ministereLink: string;
  investitiiLink: string;
  resurseTitle: string;
  sourcesLink: string;
  despreTitle: string;
  proiectCivic: string;
  ministerulFinantelor: string;
  contact: string;
  termeni: string;
  confidentialitate: string;
  despreProiect: string;
  disclaimer: string;
  builtBy: string;
}

export interface CommonDict {
  inLanguage: string;
  toate: string;
  dash: string;
  anPrecedent: string;
}

export interface LandingDict {
  seoTitle: string;
  seoDescription: string;
  jsonLdWebPageName: string;
  jsonLdDatasetName: string;
  jsonLdDatasetDescription: string;
  heroKicker: string;
  heroTitle: string;
  heroLead: string;
  ctaOverview: string;
  ctaMinistere: string;
  ctaInvestitii: string;
  topMinisterLabel: string;
  datasetsLabel: string;
  datasetsValue: string;
  dataUnavailable: string;
  kpiTotalMinistere: string;
  kpiInvestitii: string;
  kpiDeficit: string;
  kpiVisits: string;
  pillar1Title: string;
  pillar1Body: string;
  pillar2Title: string;
  pillar2Body: string;
  pillar3Title: string;
  pillar3Body: string;
  infoTitle: string;
  infoBody1: string;
  infoBody2Prefix: string;
  infoBody2LinkText: string;
  despreLink: string;
}

export interface OverviewDict {
  seoTitle: string;
  seoDescription: string;
  unavailableSeoTitle: string;
  unavailableSeoDescription: string;
  unavailableTitle: string;
  unavailableBody: string;
  kicker: string;
  titlePrefix: string;
  lead: string;
  kpiVenituri: string;
  kpiCheltuieli: string;
  kpiDeficit: string;
  kpiDeficitPib: string;
  vsLabel: string;
  pibLabel: string;
  guvernLabel: string;
  monedaLabel: string;
  trendTitle: string;
  deficitAnualTitle: string;
  deficitPibTitle: string;
  maastrichtLabel: string;
  footnote: string;
  castigatoriPierzatoriTitle: string;
  top5Cresteri: string;
  top5Scaderi: string;
  venituriLegend: string;
  cheltuieliLegend: string;
  deficitLegend: string;
  deficitPibLegend: string;
  breadcrumbHome: string;
  breadcrumbOverview: string;
}

export interface MinistereDict {
  seoTitle: string;
  seoDescription: string;
  jsonLdName: string;
  jsonLdAbout: string;
  kicker: string;
  title: string;
  leadPrefix: string;
  leadSuffix: string;
  chipEvolutie: string;
  chipTopPrefix: string;
  chipTopSuffix: string;
  totalBudgetLabel: string;
  growthLabel: string;
  growthFromLabel: string;
  growthToLabel: string;
  leaderLabel: string;
  radarTitle: string;
  radarSubtitle: string;
  buget2025Label: string;
  tableTitle: string;
  searchPlaceholder: string;
  csvBtn: string;
  colMinister: string;
  colBuget2025: string;
  colBuget2026: string;
  colVariatie: string;
}

export interface MinisterDetailDict {
  notFoundSeoTitle: string;
  notFoundSeoDescription: string;
  notFoundTitle: string;
  notFoundBody: string;
  backLink: string;
  codeLabel: string;
  totalBudgetLabel: string;
  arrow: string;
  variatieLabel: string;
  evolutieTitlePrefix: string;
  evolutieEstimariSuffix: string;
  bugetLegend: string;
  estimareLegend: string;
  capitoleTitle: string;
  programeTitle: string;
  colProgram: string;
  colExecutie2025: string;
  colProgram2026: string;
  noPrograms: string;
  programFallbackPrefix: string;
  seoDescriptionWithDeltaPrefix: string;
  seoDescriptionWithDeltaMid: string;
  seoDescriptionWithDeltaSuffix: string;
  seoDescriptionNoDeltaPrefix: string;
  seoDescriptionNoDeltaSuffix: string;
}

export interface InvestitiiDict {
  seoTitle: string;
  seoDescription: string;
  jsonLdName: string;
  kicker: string;
  title: string;
  subtitleProgramat: string;
  filtreActive: string;
  ministerLabel: string;
  sursaLabel: string;
  ministereSelectie: string;
  obiectiveTotale: string;
  cheltuitPana2024: string;
  variatieVs2025: string;
  recordsInFilterSuffix: string;
  csvBtn: string;
  obiective: string;
  surse: string;
  naLabel: string;
}

export interface ComparatorDict {
  seoTitle: string;
  seoDescription: string;
  jsonLdName: string;
  kicker: string;
  title: string;
  lead: string;
  selectTitle: string;
  removeAriaLabelPrefix: string;
  searchPlaceholderEmpty: string;
  searchPlaceholderMore: string;
  noneSelected: string;
  evolutieTitle: string;
  selectSecondHint: string;
  quickStartTitle: string;
}

export interface JocDict {
  seoTitle: string;
  seoDescription: string;
  jsonLdName: string;
  menuKicker: string;
  menuTitle: string;
  menuDescBefore: string;
  menuDescStrong1: string;
  menuDescMiddle: string;
  menuDescStrong2: string;
  menuDescAfter: string;
  playNow: string;
  top10: string;
  lbTitle: string;
  totalPlayersLabel: string;
  loading: string;
  noScores: string;
  colRank: string;
  colName: string;
  colScore: string;
  colTitle: string;
  menuBtn: string;
  gameOverKicker: string;
  scoreLabel: string;
  namePrompt: string;
  namePlaceholder: string;
  send: string;
  saving: string;
  successInserted: string;
  successUpdated: string;
  skipped: string;
  error: string;
  playAgain: string;
  leaderboard: string;
  personalHighscore: string;
  scorebarScor: string;
  scorebarHighscore: string;
  budgetLabel: string;
  vs: string;
  higher: string;
  lower: string;
  scoreTitles: string[];
}

export interface LegalPageDict {
  seoTitle: string;
  seoDescription: string;
  kicker: string;
  title: string;
  lead: string;
}

export interface DespreDict extends LegalPageDict {
  s1Title: string;
  s1P1: string;
  s1P2: string;
  s2Title: string;
  s2PPrefix: string;
  s2LinkText: string;
  s2PSuffix: string;
  s3Title: string;
  s3P: string;
  s4Title: string;
  s4P: string;
  s5Title: string;
  s5PPrefix: string;
  s5AuthorName: string;
  s5PMid: string;
  s5GithubText: string;
  s5PSuffix: string;
}

export interface TermeniDict extends LegalPageDict {
  s1Title: string;
  s1P: string;
  s2Title: string;
  s2P: string;
  s3Title: string;
  s3P: string;
  s4Title: string;
  s4P: string;
}

export interface ConfidentialitateDict extends LegalPageDict {
  s1Title: string;
  s1P: string;
  s2Title: string;
  s2P: string;
  s3Title: string;
  s3P: string;
  s4Title: string;
  s4P: string;
}

export interface NotFoundDict {
  seoTitle: string;
  seoDescription: string;
  kicker: string;
  title: string;
  lead: string;
  homeLink: string;
  overviewLink: string;
  ministereLink: string;
}

export interface AiSummaryDict {
  title: string;
  regenerate: string;
  placeholderText: string;
  generateBtn: string;
  deltaUnavailable: string;
  deltaGrowingPrefix: string;
  deltaGrowingSuffix: string;
  deltaShrinkingPrefix: string;
  deltaShrinkingSuffix: string;
  chaptersTwoPrefix: string;
  chaptersTwoMiddle: string;
  chaptersTwoSuffix: string;
  chaptersOnePrefix: string;
  chaptersOneSuffix: string;
  chaptersNone: string;
  trendGrowing: string;
  trendAdjusting: string;
  trendStable: string;
  trendPrefix: string;
  trendSuffix: string;
  trendIncomplete: string;
}

export interface FormatDict {
  mldSuffix: string;
  milSuffix: string;
  mldBare: string;
  milBare: string;
  numberLocale: string;
}

export interface Dictionary {
  nav: NavDict;
  footer: FooterDict;
  common: CommonDict;
  landing: LandingDict;
  overview: OverviewDict;
  ministere: MinistereDict;
  minister: MinisterDetailDict;
  investitii: InvestitiiDict;
  comparator: ComparatorDict;
  joc: JocDict;
  despre: DespreDict;
  termeni: TermeniDict;
  confidentialitate: ConfidentialitateDict;
  notFound: NotFoundDict;
  aiSummary: AiSummaryDict;
  format: FormatDict;
}
