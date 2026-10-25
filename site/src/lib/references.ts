// The bibliography used by the Method and Instruments pages.
// Every URL here was opened or resolved before it was added. Do not add a reference without a working link.

export interface Reference {
  /** Citation text, in the language of the source. */
  text: string;
  url: string;
  /** Optional preserved copy, shown by <References> next to the link. */
  archive_url?: string;
  archived_at?: string;
}

export const REFERENCES = {
  // Method literature and professional standards
  bowen: {
    text: 'Bowen, G. A. (2009). Document Analysis as a Qualitative Research Method. Qualitative Research Journal, 9(2), 27 to 40.',
    url: 'https://doi.org/10.3316/QRJ0902027',
  },
  berkeley: {
    text: 'UN Office of the High Commissioner for Human Rights and Human Rights Center, UC Berkeley School of Law (2022). Berkeley Protocol on Digital Open Source Investigations. HR/PUB/20/2.',
    url: 'https://humanrights.berkeley.edu/programs/investigations/berkeley-protocol',
  },
  ifcn: {
    text: 'International Fact-Checking Network, Poynter Institute. IFCN Code of Principles.',
    url: 'https://ifcncodeofprinciples.poynter.org/',
  },
  spj: {
    text: 'Society of Professional Journalists (2014). SPJ Code of Ethics.',
    url: 'https://spj.org/ethicscode.asp',
  },

  // Indonesian legal databases
  'db-peraturan': {
    text: 'Kementerian Hukum Republik Indonesia. Database Peraturan, peraturan.go.id.',
    url: 'https://peraturan.go.id/',
  },
  'db-jdihn': {
    text: 'Jaringan Dokumentasi dan Informasi Hukum Nasional (JDIHN).',
    url: 'https://jdihn.go.id/',
  },
  'db-komdigi': {
    text: 'JDIH Kementerian Komunikasi dan Digital (Komdigi).',
    url: 'https://jdih.komdigi.go.id/',
  },
  'db-bpk': {
    text: 'JDIH Badan Pemeriksa Keuangan (BPK). Database Peraturan, peraturan.bpk.go.id.',
    url: 'https://peraturan.bpk.go.id/',
  },

  // Indonesian law
  'uu-12-2011': {
    text: 'Undang-Undang Nomor 12 Tahun 2011 tentang Pembentukan Peraturan Perundang-undangan, sebagaimana telah diubah terakhir dengan Undang-Undang Nomor 13 Tahun 2022.',
    url: 'https://peraturan.bpk.go.id/Details/39188',
  },
  'pasal-8-note': {
    text: 'Hukumonline, Klinik Hukum. Bolehkah Peraturan Menteri Memuat Sanksi Pidana? (on Pasal 7 and Pasal 8 UU 12/2011).',
    url: 'https://www.hukumonline.com/klinik/a/bolehkah-peraturan-menteri-memuat-sanksi-pidana-lt5264d6b08c174',
  },
  'se-9-2023': {
    text: 'Surat Edaran Menteri Komunikasi dan Informatika Nomor 9 Tahun 2023 tentang Etika Kecerdasan Artifisial.',
    url: 'https://web.kominfo.go.id/sites/default/files/kominfo-Surat-Edaran-Kecerdasan-Artifisial.pdf',
  },
  'uu-pdp': {
    text: 'Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.',
    url: 'https://peraturan.bpk.go.id/Details/229798',
  },
  'uu-pdp-46': {
    text: 'Undang-Undang Nomor 27 Tahun 2022, Pasal 46 (pemberitahuan kegagalan pelindungan data pribadi), pasal.id.',
    url: 'https://pasal.id/peraturan/uu/uu-no-27-tahun-2022/pasal-46',
  },
  'pdp-deadline': {
    text: 'ANTARA (2024). Masih ada waktu, Presiden Jokowi bentuk Komisi PDP (batas waktu pembentukan lembaga 17 Oktober 2024).',
    url: 'https://www.antaranews.com/berita/4343699/masih-ada-waktu-presiden-jokowi-bentuk-komisi-pdp',
  },
  'uu-kip': {
    text: 'Undang-Undang Nomor 14 Tahun 2008 tentang Keterbukaan Informasi Publik.',
    url: 'https://peraturan.bpk.go.id/Details/39047',
  },
  'uu-ite': {
    text: 'Undang-Undang Nomor 1 Tahun 2024 tentang Perubahan Kedua atas Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik.',
    url: 'https://peraturan.bpk.go.id/Details/274494',
  },
  'uu-iccpr': {
    text: 'Undang-Undang Nomor 12 Tahun 2005 tentang Pengesahan International Covenant on Civil and Political Rights.',
    url: 'https://peraturan.bpk.go.id/Details/40261/uu-no-12-tahun-2005',
  },

  // International human rights law
  gc34: {
    text: 'UN Human Rights Committee (2011). General Comment No. 34, Article 19: Freedoms of opinion and expression. CCPR/C/GC/34.',
    url: 'https://digitallibrary.un.org/record/715606',
  },
  coe: {
    text: 'Council of Europe (2026). European Union ratifies the Council of Europe Framework Convention on Artificial Intelligence (CETS No. 225).',
    url: 'https://www.coe.int/web/artificial-intelligence/-/european-union-ratifies-the-council-of-europe-framework-convention-on-artificial-intelligence',
  },

  // European Union
  'ai-act': {
    text: 'Regulation (EU) 2024/1689 of the European Parliament and of the Council of 13 June 2024 laying down harmonised rules on artificial intelligence (Artificial Intelligence Act). OJ L, 2024/1689.',
    url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689',
  },
  omnibus: {
    text: 'Orrick (July 2026). EU AI Act Update: Digital Omnibus Finalizes 8 Compliance Changes (on Regulation (EU) 2026/1744).',
    url: 'https://www.orrick.com/en/Insights/2026/07/EU-AI-Act-Update-Digital-Omnibus-Finalizes-8-Compliance-Changes',
  },
  gdpr: {
    text: 'Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 (General Data Protection Regulation). OJ L 119, 4.5.2016.',
    url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679',
  },

  // Soft law and regional guidance
  oecd: {
    text: 'OECD (2019, updated 2024). Recommendation of the Council on Artificial Intelligence (OECD AI Principles).',
    url: 'https://oecd.ai/principles/',
  },
  unesco: {
    text: 'UNESCO (2021). Recommendation on the Ethics of Artificial Intelligence, adopted 23 November 2021 (OECD.AI policy record).',
    url: 'https://oecd.ai/en/dashboards/policy-initiatives/recommendation-on-the-ethics-of-artificial-intelligence',
  },
  'asean-2024': {
    text: 'ASEAN (2024). ASEAN Guide on AI Governance and Ethics. Adopted at the 4th ASEAN Digital Ministers Meeting, 2 February 2024.',
    url: 'https://asean.org/wp-content/uploads/2024/02/ASEAN-Guide-on-AI-Governance-and-Ethics_beautified_201223_v2.pdf',
  },
  'asean-2025': {
    text: 'ASEAN (2025). Expanded ASEAN Guide on AI Governance and Ethics, Generative AI.',
    url: 'https://asean.org/wp-content/uploads/2025/01/Expanded-ASEAN-Guide-on-AI-Governance-and-Ethics-Generative-AI.pdf',
  },

  // Frontier AI safety practice
  seoul: {
    text: 'UK Department for Science, Innovation and Technology (2024). Frontier AI Safety Commitments, AI Seoul Summit 2024.',
    url: 'https://www.gov.uk/government/publications/frontier-ai-safety-commitments-ai-seoul-summit-2024/frontier-ai-safety-commitments-ai-seoul-summit-2024',
  },
  rsp: {
    text: 'Anthropic. Responsible Scaling Policy.',
    url: 'https://www.anthropic.com/responsible-scaling-policy',
  },
  aisi: {
    text: 'UK AI Security Institute. Emerging practices in frontier AI safety frameworks.',
    url: 'https://www.aisi.gov.uk/research/emerging-practices-in-frontier-ai-safety-frameworks',
  },
} satisfies Record<string, Reference>;

export type RefKey = keyof typeof REFERENCES;
