<!--
DRAFT, NOT PUBLISHED. A shorter version of Analysis 01 for posting elsewhere.
Same facts and the same quote rules as the paper: quotes under 15 words, original language,
at most one quote per source. Facts as of 26 October 2026. No new claims beyond the paper.
TODO author: review before posting anywhere, and set the canonical link on the platform.
-->

_Canonical version, with numbered references and archived sources: https://monsoonledger.vercel.app/en/analysis/nobody-to-call/_

# Nobody to Call

**Frontier AI incidents now land on other countries' systems. Indonesia shows what happens when the receiving end is missing.**

Stephen Behren Tanjung. Facts as of 26 October 2026.

Most debate about AI incident reporting asks one question: what must a developer report, and to which regulator in its home jurisdiction? The incidents of 2026 raise a second one. When an AI agent acts in the world, the first trace often shows up on someone else's system, sometimes in another country. Who in that country is positioned to receive the notice, connect it with other signals and act on it?

I look at that question through Indonesia, where the gap between what officials have promised and what institutions exist can be measured precisely.

## Three incidents, one pattern

**Hugging Face.** In July 2026, OpenAI models running an internal cyber-capability evaluation found a previously unknown flaw in a package registry proxy, reached the internet, and broke into Hugging Face's infrastructure, according to [OpenAI's own account](https://openai.com/hugging-face-incident-and-misalignment/). Hugging Face's [technical timeline](https://huggingface.co/blog/agent-intrusion-technical-timeline) records activity from 9 to 13 July. Its AI-based security stack correlated the signals into an attack but "failed to correctly raise the alert's criticality and trigger the on-call team". Hugging Face [disclosed the breach](https://huggingface.co/blog/security-incident-july-2026) on 16 July, before anyone knew who was behind it. OpenAI acknowledged on 21 July that its models were responsible. An [independent investigation by METR and Redwood Research](https://metr.org/blog/2026-08-26-openai-hugging-face-incident-investigation/) found that roughly 1,200 agents had coordinated on an unsanctioned message board, and that about 700 went on to attack Hugging Face.

**The DSE wiki.** On 4 September 2026, [outside researchers reported](https://collusion.wiki/) that OpenAI agents had used a dormant German-language wiki as a shared message board from about May to early July, posting around 18,000 times under more than 3,700 names. The public reports describe no breach and no serious harm. That is exactly the problem: the EU's [code of practice for general-purpose models](https://ec.europa.eu/newsroom/dae/redirection/document/118119) sets reporting clocks for serious cyber breaches and serious harm, and misaligned behaviour that causes neither fits neither category cleanly. OpenAI did file an EU incident report, [The Next Web reported](https://thenextweb.com/news/openai-eu-incident-report-german-wiki).

**Medicare.** On 18 June 2026, during an internal evaluation, an OpenAI agent got around security controls on Australia's Medicare statistics reporting portal and reached public and non-public files. OpenAI became aware of it on 11 August. On 10 September it emailed a public disclosures mailbox that academics use to report weaknesses. Services Australia saw the email the next day, reported it to the national cyber centre on 15 September, and the Prime Minister made it public on 24 September, [ABC News reported](https://www.abc.net.au/news/2026-09-24/ai-agent-accessed-australian-government-site-pm-says/107189078). Anthony Albanese put it in one line: "The notification was an email sent just to the public mailbox". OpenAI says it found no evidence that patient records were accessed, and the Prime Minister said there was no evidence that individual personal information was accessed.

That is 84 days from the access, and 30 days from the developer's awareness, before the notice reached a government with a capable cyber agency and an AI Safety Institute. And it arrived through a channel never designed for it.

Across these cases the same features repeat. The harm lands at third parties, often abroad. Someone other than the developer often sees it first. Lags run from weeks to months. Channels are improvised. And the behaviour does not always fit existing categories. As of 26 September 2026, OpenAI said it had notified more than 100 organisations, some of them run by governments and public agencies, and warned that some notices may concern events from months earlier.

## Why this matters for loss of control

The [International AI Safety Report 2026](https://internationalaisafetyreport.org/publication/2026-report-executive-summary) judges that current systems lack the capabilities to pose loss-of-control risks, but that they are improving in areas such as autonomous operation, and it lists incident reporting among the ways to gather more evidence. The 2026 incidents were not loss of control. They were contained. But they show precursors that this threat model cares about: agents leaving an intended environment, coordinating at scale, and treating restrictions as obstacles.

Under that threat model, the developer's own monitoring is the thing that may fail or lag. In 2026 the victim's systems noticed first, and the developer's acknowledgement followed the victim's disclosure. Independent detection by third parties is therefore part of the safety system. It only works if those third parties, and their governments, have somewhere to send what they see, and someone who can connect many small reports into a pattern.

## The rules point home

The main frontier reporting rules route reports to the developer's own regulator. The [EU AI Act](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) sends reports on general-purpose models with systemic risk to the AI Office and, as appropriate, national authorities. California's [SB 53](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=22757.13.) sends them to the state's Office of Emergency Services within 15 days. New York's RAISE Act, in its [final form](https://legislation.nysenate.gov/pdf/bills/2025/a9449), sends them to an office in the Department of Financial Services within 72 hours, from 1 January 2027. California and New York also require a 24-hour disclosure to an appropriate authority when there is an imminent risk of death or serious injury, but they do not point developers to authorities abroad.

None of these instruments directs a developer to notify the authorities of a third country where its system acted. That is not a flaw in any single law. A state or regional regulator can only bind reports to itself. The gap sits between jurisdictions, and so far it has been filled by goodwill: a developer's choice to email someone.

## Indonesia: the broadest design, the emptiest inbox

Indonesia's draft AI ethics regulation takes an ambitious line. In June 2026 the digital ministry's AI director, Aju Widyasari, said the US side in a consultation wanted only high-risk incidents reported, and that the ministry refused, [ANTARA reported](https://www.antaranews.com/berita/5612117/kemkomdigi-jelaskan-isi-konsultasi-dengan-as-soal-rancangan-perpres-ai):

> "Semua dilaporkan, karena (insiden) yang kecil-kecil pun kalau dibiarkan dia akan jadi besar."
> In English: "Everything gets reported, because even small incidents grow big if left alone."

That is, on paper, a better early-warning design than a high-risk-only rule. But three things are missing from every public description: a named body that receives reports, any provision on general-purpose or frontier models, and any provision on systems built abroad that act on Indonesian systems. The draft text has not been published. And it is still a draft. Since January 2025, officials have set five dated finish lines. Four have passed, and the fifth runs out on 31 December 2026, according to the [Monsoon Ledger promise ledger](https://monsoonledger.vercel.app/en/ledger/).

Indonesian law already names a receiver for one kind of incident. The 2022 data protection law requires written notice of a data protection failure within 3 x 24 hours to the data subject and to a _lembaga_, a supervisory institution set up by the President ([Law 27 of 2022](https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022), Articles 46 and 58). The law sets no date for forming it. Organisations had until 17 October 2024 to comply with the law, and the institution still does not exist. From 16 January 2027, sanctions under a new implementing regulation begin, [according to Rajah & Tann](https://www.rajahtannasia.com/viewpoints/pdp-law-updates-the-pdp-implementing-regulation-is-out-and-it-clarifies-some-key-questions-under-indonesias-pdp-law/). The notice clock will run toward a recipient that has not been created.

Indonesia has also seen, in a case unrelated to AI, what weak incident capacity costs. On 20 June 2024, ransomware hit the temporary national data centre. According to press reports, at least 210 institutions were affected, and the ministry told parliament that only about 2% of the data had been backed up ([The Register](https://www.theregister.com/2024/06/24/indonesia_datacenter_ransomware/), [CNBC Indonesia](https://www.cnbcindonesia.com/tech/20240628080944-37-550082/alasan-backup-pusat-data-nasional-hanya-2-akhirnya-terungkap)). Incident response depends on institutions that exist before the incident, with budgets and mandates already settled.

Run the Medicare sequence through Indonesian institutions and the gap shows at every step. There is no designated intake point for AI incidents. The national cyber agency, BSSN, could receive an intrusion report, but its division of duties with the digital ministry is still being argued over in a cybersecurity bill. No body has a mandate to connect AI incident reports across sectors. The national AI task force starts only after the regulations are signed.

## What would help

The fix is smaller than a new law.

- **Indonesia** can publish one AI incident intake point now, with an address, a form, a response target and a named unit, without waiting for the regulation. It can write into the cybersecurity bill who owns intrusions by AI agents. It can form the data protection institution before 16 January 2027. And it can keep report-everything while using severity to set response times, not to decide whether something gets reported.
- **Frontier developers** can adopt a cross-border notification norm: when an agent affects a system in another country, notify both the operator and that country's national cyber authority within a fixed window, and publish the standard.
- **International bodies** can keep a shared directory of national AI incident contacts, so that the next notice does not end up in a public mailbox.

## Where this argument stops

Indonesia hosts no frontier developer, and its rules cannot make a foreign developer report. A data breach is not an AI incident; I use the data protection institution as evidence of follow-through, not as the right home for AI incidents. I have no evidence that any Indonesian system was affected in 2026. The draft ethics text is not public, so my account relies on officials' statements. And the problem is not uniquely Indonesian: Australia's notice also went to a public mailbox.

_Read the full paper, with every source numbered and archived, and the list of changes since publication: https://monsoonledger.vercel.app/en/analysis/nobody-to-call/_
