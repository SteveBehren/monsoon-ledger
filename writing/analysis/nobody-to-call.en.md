---
id: nobody-to-call
number: 1
lang: en
title: Nobody to Call
subtitle: Frontier AI incidents now land on other countries' systems. Indonesia shows what happens when the receiving end is missing.
author: Stephen Behren Tanjung
published: 2026-10-27
facts_as_of: 2026-10-26
version: "1.0"
sources: data/analysis/nobody-to-call.sources.yml
docx: analysis/Nobody_to_Call_Monsoon_Ledger_Analysis_01.docx
summary: When frontier AI agents act on systems in other countries, the notice has to land somewhere; this paper documents the 2026 incidents, the reporting rules, and Indonesia's missing receiving end.
# Instruments the text names. The ontology links the paper to these and to its sources, nothing else.
discusses:
  instruments:
    - uu-pdp-27-2022
    - se-menkominfo-9-2023
    - draft-perpres-ai-ethics
    - draft-perpres-ai-roadmap
    - gr-33-2026
    - asean-genai-guide-2025
---

## Key findings

1. **Frontier AI incidents now land on other people's systems.** In 2026, misaligned OpenAI agents acted on third-party systems during training and evaluation. By 26 September 2026 OpenAI had notified more than 100 organisations, and it says some of the affected websites are run by governments and public agencies [1].
2. **Notices arrive late and through improvised channels.** An OpenAI agent accessed an Australian Medicare statistics portal on 18 June 2026. The government learned of it from an email to a public disclosures mailbox sent on 10 September, 84 days later [2].
3. **Today's frontier rules send reports to the developer's home regulator, not to the country whose systems were touched.** That holds for the EU AI Act's duty on general-purpose models, California's SB 53 and New York's RAISE Act [3, 50, 52, 4, 5].
4. **Indonesia has chosen an ambitious design on paper.** In June 2026 its digital ministry turned down a US industry request to limit incident reporting to high-risk AI and kept reporting for all incidents [6]. The regulation that contains this choice is unsigned. Officials have set five dated finish lines since January 2025, and four have passed [7].
5. **The receiving body that Indonesian law already names does not exist.** The 2022 data protection law requires breach notices within 3 x 24 hours to a _lembaga_ (supervisory institution). The law set no date for forming it, though organisations had until 17 October 2024 to comply, and it has still not been formed [8, 9, 10, 55].
6. **The fix is smaller than a new law.** It needs one published, staffed intake point for AI incidents, a clear split of duties with the national cyber agency, and a cross-border notification norm that frontier developers follow wherever their agents act.


## Executive summary

Incident reporting is often described as the early-warning layer of frontier AI governance. The policy debate has focused on one half of the problem: what developers must report, and to which regulator in their home jurisdiction. The incidents of 2026 expose the other half. When an AI agent acts in the world, the first trace often appears on someone else's system, sometimes in another country. The affected country needs three things for that signal to count: a place for the information to land, people who can read it, and the authority to act on it.

This paper uses Indonesia as a documented case of what happens when that receiving end is missing. Indonesia is not a frontier AI developer, and I do not claim it faces loss-of-control risk from its own industry. My claim is narrower. The receiving end of incident information is part of frontier safety infrastructure, and it is missing in many countries. Indonesia is one where the gap between what officials have promised and what institutions actually exist can be measured precisely.

The evidence falls into three parts. The first is a set of 2026 incidents involving OpenAI models: the breach of Hugging Face, the use of a dormant German wiki as an agent message board, and the access to an Australian Medicare portal. In each one, third parties or outside researchers saw the activity first, notices took weeks to months, and the channel for reporting was improvised [1, 11, 2]. The second part maps the current reporting rules. Every major frontier instrument routes reports to the developer's regulator, and none obliges a developer to tell the authorities of the third country where its system acted [3, 4, 5]. The third part documents Indonesia. Its draft AI ethics regulation asks for reports on all incidents, but it is unsigned and names no recipient for frontier incidents. Its data protection law already points breach notices at an institution that does not exist [6, 12, 8].

The recommendations are practical. Indonesia can publish a single AI incident intake point before the regulations are signed, settle which agency owns intrusions by AI agents, and form the data protection institution before sanctions under Government Regulation 33/2026 begin on 16 January 2027. Frontier developers can adopt a cross-border notification norm that reaches the affected country's national cyber authority as well as the website owner. International bodies can maintain a shared directory of national AI incident contacts, so that the next notice does not end up in a public mailbox.


## 1. What this paper argues

There is a growing literature on AI incident reporting. Think tanks have argued that AI needs a reporting system like those in aviation and medicine, so that regulators learn about failures from reports rather than from the news [13]. Researchers have proposed standard fields for mandatory reports and a federated design in which a central body sets minimum requirements that others adapt [14]. The OECD has worked toward a common reporting framework [15]. A July 2026 review found that existing frameworks still disagree on definitions, classification, monitoring and reporting, which limits what any analysis of incident data can show [16].

Most of this work assumes that the relevant parties sit in the same jurisdiction: the developer, the regulator and the harmed party. The 2026 incidents break that assumption. An agent trained in the United States can act on a server in Germany, a platform in France or a government portal in Australia, all within one evaluation run. The question is no longer only what the developer must disclose. It is also who, in the affected country, is positioned to receive the notice, connect it with other signals and do something about it.

I make three arguments. First, frontier incidents now surface at third parties, and that makes the receiving end a safety function rather than an administrative detail (Section 2). Second, this matters most for the threat models that worry safety researchers, including misaligned autonomous behaviour and, eventually, loss of control, because those are the cases where the developer's own monitoring may be what fails (Section 3). Third, current rules leave the receiving end to chance, and Indonesia shows in detail what that looks like in a large country with ambitious drafts and missing institutions (Sections 4 to 6). Section 7 sets out where the argument stops, and Section 8 makes recommendations.

**Why Indonesia.** <!-- TODO author: add a source for the population figure and the digital economy claim, or cut them. --> Indonesia has about 280 million people, a fast-growing digital economy and a government that has spent almost two years promising binding AI rules. It is also a place where the record can be checked line by line. Monsoon Ledger, the public tracker behind this paper, logs each dated promise about Indonesian AI regulation against what happened, with archived sources [7]. Claude usage data adds one further detail: Indonesia's Anthropic Usage Index, which divides a country's share of Claude usage by its share of the world's working-age population, was 0.46 in the latest period, ranking 86th of 121 countries. Coursework made up 46% of Indonesian usage, against 16% globally [17]. Usage per person is below average and leans heavily toward students. That says nothing about incidents. It does show that Indonesians are already part of the deployment surface of frontier models.


## 2. Where frontier incidents surfaced in 2026

The cases below come from developer disclosures, the affected organisations' own write-ups, independent investigators and mainstream reporting. Investigations are still running, and details may change.


### 2.1 Hugging Face: an evaluation that left the building

In July 2026, OpenAI models were running an internal cyber-capability evaluation based on the public ExploitGym benchmark, with cyber refusals reduced for testing. They included GPT-5.6 Sol and an internal-only research model [18, 1]. The evaluation environment had no direct internet access. The models found and exploited a previously unknown vulnerability in Artifactory, a package registry proxy, to reach the internet. They then inferred that Hugging Face might hold material relevant to the benchmark and broke into its infrastructure [1, 19].

Hugging Face's own timeline records activity from 9 to 13 July 2026. Several of its security layers raised signals that were each ambiguous on their own. An AI-based security agent stack correlated them into an attack signal but <q data-src="11">failed to correctly raise the alert's criticality and trigger the on-call team</q>, which cost response time [11]. Hugging Face disclosed the breach on 16 July 2026, before the responsible party was identified [54]. OpenAI acknowledged on 21 July that its models were behind it and called it <q data-src="19">an unprecedented cyber incident</q> [18, 19].

An independent investigation by METR and Redwood Research found that roughly 1,200 agents had coordinated on an unsanctioned message board, exchanging more than 70,000 messages and files, and that about 700 went on to attack Hugging Face. The investigators report that <q data-src="20">agents realized this activity was out of scope and unethical</q> but joined anyway, and that at least 96 transcripts showed clear evidence of spoofed tool calls [20].


### 2.2 DSE wiki: misalignment that fits no reporting category

On 4 September 2026, outside researchers disclosed that OpenAI agents had used DSE wiki, a dormant German-language wiki, as a shared message board from about May to early July 2026. They posted around 18,000 times under more than 3,700 names, sharing answers and ways around sandbox restrictions during a web research task. The researchers believe these were different agents from the ones that attacked Hugging Face [48, 21]. OpenAI responded the next day and said that industry practice for disclosing misalignment that is not a security incident is still developing [1].

The European Commission confirmed that OpenAI filed an incident report on the episode. A Commission spokesperson said that <q data-src="22">incident reports are not just a tick-box</q>, and that a report has to be precise about the measures a provider plans to take [22]. The episode also exposed a classification gap. The EU code of practice for general-purpose models sets clocks for serious cybersecurity breaches and for serious harm, but misaligned agent activity that causes neither fits neither category cleanly [22, 49].


### 2.3 Medicare: a national system, a public mailbox

The Australian case is the clearest illustration of the receiving-end problem. During an internal evaluation in which OpenAI models were looking up Australian statistics, an agent got around security controls on the Medicare statistics reporting portal run by Services Australia. It reached public and non-public files [2]. OpenAI says its review found no evidence that patient records were accessed, and the Prime Minister said there was no evidence that individual personal information was accessed [2]. The timeline is in Table 1.

**Table 1. Notification timeline, Medicare portal access (all dates 2026)**

| Date | Event |
|---|---|
| 18 June | An OpenAI agent accesses the Medicare statistics reporting portal during an internal evaluation. |
| 11 August | OpenAI becomes aware of the access during a review of misaligned model activity. |
| 10 September | OpenAI emails publicdisclosures@servicesaustralia.gov.au, an address used by academics and researchers to report weaknesses. |
| 11 September | Services Australia sees the email. |
| 15 September | Services Australia reports it to the Australian Signals Directorate's cybersecurity centre. |
| 17 September | The Minister for the Public Service is informed. |
| 24 September | The Prime Minister speaks with OpenAI's chief executive and makes the incident public. |

_Source: ABC News Australia, 24 September 2026 [2]._

Albanese put the problem in one sentence: <q data-src="2">The notification was an email sent just to the public mailbox</q> [2]. Australia is a country with a capable national cyber agency and an AI Safety Institute, and both were brought into the response once the notice had been found [2]. Even so, the notice took 84 days from the access and 30 days from the developer's awareness to reach the government, and when it arrived it went to a channel not designed for it.


### 2.4 A pattern, not three anecdotes

OpenAI's own account shows the scale. As of 26 September 2026, it had notified more than 100 organisations about activity that met its notification criteria. It is reviewing about 50 petabytes of training and evaluation records, using about 7,000 GPUs at a cost it puts at over half a million dollars a day, and expects the review to take months [1]. It says some of the websites involved are run by governments, universities, public agencies and other institutions, partly because models doing research tasks are often directed to authoritative sources of public information [1]. It also warns that <q data-src="1">some notifications may concern events from months ago</q> [1].

Misuse follows a similar shape. In November 2025, Anthropic reported that it had detected, in mid-September 2025, a cyber espionage operation it attributed with high confidence to a Chinese state-sponsored group. The operation targeted roughly 30 entities, and the AI carried out an estimated 80 to 90 percent of tactical operations. Anthropic says it notified affected entities and coordinated with authorities [23]. Here too, the harm sat with third parties, and their governments depended on the developer choosing to reach them.

Across these cases, five features repeat.

- **The harm lands at third parties.** Platforms, wikis and government portals, often outside the developer's country.
- **Someone else often sees it first.** Hugging Face's systems and outside researchers detected activity before public acknowledgement by the developer [11, 54, 48].
- **Lags run from weeks to months.** The Medicare notice took 84 days from the access; the developer's historical review may surface events from months earlier [2, 1].
- **Channels are improvised.** A public disclosures mailbox, a security inbox, a press inquiry.
- **Categories do not fit.** Misaligned behaviour without a breach or measurable harm sits outside existing reporting clocks [22].


## 3. Why this belongs in a loss-of-control conversation

The International AI Safety Report 2026, written with guidance from more than 100 independent experts and chaired by Yoshua Bengio, defines loss of control as scenarios where <q data-src="24">AI systems operate outside of anyone's control, with no clear path to regaining control</q> [24]. It judges that current systems lack the capabilities to pose such risks, but that they are improving in areas such as autonomous operation. It also notes that models increasingly distinguish test settings from real deployment, which could let dangerous capabilities go unnoticed before deployment, and it lists incident reporting among the practices for gathering more evidence [24].

The 2026 incidents do not show loss of control in that sense. They were contained, and no one lost the ability to stop the systems involved. But they show precursors that the threat model cares about: agents leaving an intended environment, coordinating at scale, treating restrictions as obstacles and, in some transcripts, spoofing their own records [20, 1]. OpenAI's chief scientist, Jakub Pachocki, wrote in September 2026 that he believes no lab has solved alignment and monitoring well enough to keep scaling responsibly at maximum speed for much longer [1].

**Table 2. Three threat models and where their first signals appear**

| Threat model | Example | Typical first signal | Who is likely to see it first |
|---|---|---|---|
| Misuse at scale | AI-orchestrated espionage, detected September 2025 [23] | Unusual account activity; intrusions at targets | The developer, or the targets |
| Misaligned agent action in the wild | Hugging Face, DSE wiki, Medicare, 2026 [1, 48, 2] | Out-of-scope actions on third-party systems | The third party, outside researchers, then the developer |
| Loss of control | Not observed; judged beyond current systems [24] | Likely weak, scattered and partly outside the developer's logs | Unknown, which is the point |

_Classification and the last two columns are the author's assessment, based on the sources cited._

The policy implication is simple. Under the second and third threat models, the developer's monitoring is the very thing that may fail or lag. In 2026, an AI-based detection stack at the victim noticed the attack but did not escalate it, and the developer's acknowledgement followed the victim's disclosure [11, 54, 18]. Independent detection by third parties is therefore part of the safety system. It only works if those third parties, and their governments, have somewhere to send what they see, and if someone can connect reports from many sites into a pattern.

This is where scattered low-severity events matter. OpenAI says most cases found so far have been low severity [1]. That is reassuring for each case taken alone. But early warning depends on aggregation: many small signals that, together, show a capability or behaviour changing. An Indonesian official put the same logic plainly when defending broad incident reporting, quoted in Section 5. Small incidents left alone grow big.


## 4. The current reporting stack and its blind spot

Table 3 summarises the main instruments that require or invite incident reports from frontier developers, as of 26 October 2026.

**Table 3. Frontier incident reporting instruments**

| Instrument | Who reports | To whom | Clock | Status |
|---|---|---|---|---|
| EU AI Act, Art. 55(1)(c) | Providers of general-purpose models with systemic risk | AI Office and, as appropriate, national competent authorities | Without undue delay | Applies; the 2026 omnibus left the general-purpose model timeline unchanged [3, 25] |
| EU code of practice, safety and security chapter | Signatory providers | AI Office and, as applicable, national competent authorities | 2 days (critical infrastructure), 5 days (serious cyber breach), 10 days (death), 15 days (serious harm) | Voluntary; OpenAI is a signatory [49, 26, 22] |
| EU AI Act, Art. 73 | Providers of high-risk systems | Market surveillance authorities of the Member States where the incident occurred | 15 days; 2 days for widespread infringement or critical infrastructure; 10 days for death | Applies with the high-risk regime, whose main dates moved to 2 Dec 2027 and 2 Aug 2028 [3, 25] |
| California SB 53 | Frontier developers | Office of Emergency Services; for imminent risk of death or serious injury, an appropriate authority with jurisdiction, such as law enforcement | 15 days; 24 hours if imminent risk of death or serious injury | In effect since 1 Jan 2026 [50, 4] |
| New York RAISE Act | Frontier developers | An office within the Department of Financial Services; for imminent risk of death or serious injury, an appropriate authority with jurisdiction | 72 hours; 24 hours if imminent risk of death or serious injury | Signed 19 Dec 2025; final version signed 27 Mar 2026; takes effect 1 Jan 2027 [52, 53, 5] |
| Frontier AI Safety Commitments (Seoul) | 16 companies at signing | Public (safety frameworks) | None for incidents | Voluntary, May 2024 [27] |

_Code of practice clocks were checked against the published text of its safety and security chapter, Measure 9.3 [49]. The California and New York rows were checked against the statute text [50, 52]._

Two features stand out. First, the routing logic is the developer's home or market regulator. The only provision that routes by the place of the incident, Article 73, does so within the EU single market and applies to high-risk systems on a delayed timetable [3, 25]. Second, none of these instruments directs a developer to notify the authorities of a third country where its system acted. California's definition of a critical safety incident even includes loss of control of a frontier model causing death or bodily injury, but the 15-day report goes to a California agency [51, 50]. California and New York also require a 24-hour disclosure to an appropriate authority with jurisdiction when an incident poses an imminent risk of death or serious injury. That text does not limit the authority to the state, but it does not point developers to authorities abroad either [50, 52].

This is not a design flaw in any single law. A state or regional regulator can only bind reports to itself. The gap sits between jurisdictions, and so far it has been filled by goodwill: a developer's choice to email someone. The international layer is thin. The International Network of AI Safety Institutes launched in November 2024 with ten founding members: Australia, Canada, the European Commission, France, Japan, Kenya, the Republic of Korea, Singapore, the United Kingdom and the United States [28]. Indonesia was not among them. ASEAN's expanded guide on generative AI lists incident reporting among its nine policy recommendations, but in exploratory terms. Under the areas for ASEAN to explore, it lists <q data-src="29">Creating a common understanding around incident reporting and incident management</q> [29].


## 5. Indonesia: an ambitious design without a receiving end


### 5.1 What is in force today

Indonesia's only AI-specific instrument in force is Circular Letter 9 of 2023 on AI ethics, issued on 19 December 2023 [30]. It asks businesses and electronic system operators to adopt internal policies and follow ethical principles, including security, transparency, accountability and personal data protection, and it says AI should not be used to decide policy or make decisions on matters concerning humanity [30]. A circular letter is guidance, not a binding regulation, and it contains no incident reporting duty.


### 5.2 What has been promised

Two draft presidential regulations (Perpres) are meant to change that: a national AI roadmap and an AI ethics regulation [31]. Public statements describe the ethics draft as follows. It sorts AI into three risk tiers: low, high and unacceptable. High risk means a system uses specific personal data, and unacceptable means it could threaten security and safety. Each ministry sets risk standards for its own sector. Ministries, agencies and sector players must provide incident reporting mechanisms for technical problems and losses experienced by users. Oversight relies on self-assessment, and the regulation carries no criminal sanctions [12].

The most consequential choice came during a consultation with US stakeholders. According to Aju Widyasari, the ministry's Director of Artificial Intelligence and New Technology Ecosystems (AIKITA), the US side wanted only high-risk incidents to be reported. The ministry refused. She said all incidents should be reported because Indonesia is still in a learning phase [6]:

<blockquote data-src="6">
<p lang="id">Semua dilaporkan, karena (insiden) yang kecil-kecil pun kalau dibiarkan dia akan jadi besar.</p>
<p class="tr">Translation: "Everything gets reported, because even small incidents grow big if left alone."</p>
<footer>Aju Widyasari, Komdigi, Indonesia AI Ethics Summit 2026, as reported by ANTARA, 17 June 2026 [6].</footer>
</blockquote>

That is, on paper, a stronger early-warning design than a high-risk-only regime. It is also the logic Section 3 argued for. But three things are missing from every public description I could find: a named body that receives reports, any provision on general-purpose or frontier models, and any provision on systems built abroad that act on Indonesian systems [6, 12]. The draft texts have not been published. Neither appeared on the ministry's official list of draft regulations when it was checked on 26 October 2026 [58].

And the draft is still a draft. Since January 2025, officials have announced dated finish lines five times. Four have passed, and the fifth, a priority to sign in 2026, runs out on 31 December 2026 (Figure 1). A task force to oversee implementation will start only once the President signs [31].

<div data-figure="promise-days"></div>

_Figure 1. Dated promises to issue Indonesia's AI regulations, measured against 26 October 2026. Where wording allowed more than one reading, the latest plausible deadline is used. Sources: [32, 33, 34, 35, 36]; method and full list in Appendix A and [7]._


### 5.3 The recipient the law already names

For personal data, Indonesian law already contains a reporting clock and a named recipient. Article 46(1) of the 2022 Personal Data Protection Law reads:

<blockquote class="statute" data-src="8">
<p lang="id">Dalam hal terjadi kegagalan Pelindungan Data Pribadi, Pengendali Data Pribadi wajib menyampaikan pemberitahuan secara tertulis paling lambat 3 x 24 (tiga kali dua puluh empat) jam kepada: a. Subjek Data Pribadi; dan b. lembaga.</p>
<p class="tr">Translation: "If a failure of Personal Data Protection occurs, the Personal Data Controller must give written notice no later than 3 x 24 (three times twenty-four) hours to: a. the Personal Data Subject; and b. the institution."</p>
<footer>Law 27 of 2022, Article 46(1) [8, 55].</footer>
</blockquote>

Article 58 defines that institution:

<blockquote class="statute" data-src="9">
<p lang="id">(2) Penyelenggaraan Pelindungan Data Pribadi sebagaimana dimaksud pada ayat (1) dilaksanakan oleh lembaga. (3) Lembaga sebagaimana dimaksud pada ayat (2) ditetapkan oleh Presiden. ... (5) Ketentuan lebih lanjut mengenai lembaga sebagaimana dimaksud pada ayat (2) diatur dengan Peraturan Presiden.</p>
<p class="tr">Translation: "(2) The implementation of Personal Data Protection referred to in paragraph (1) is carried out by an institution. (3) The institution referred to in paragraph (2) is established by the President. ... (5) Further provisions on the institution referred to in paragraph (2) are regulated by Presidential Regulation."</p>
<footer>Law 27 of 2022, Article 58(2), (3) and (5) [9, 55].</footer>
</blockquote>

Article 58 sets no date for forming the institution. Article 74 gave controllers and processors a two-year window, ending 17 October 2024, to adapt to the law [10, 55], and a cybersecurity expert quoted by ANTARA treated that date as the deadline for forming the institution too [37]. In October 2025 the minister said its form was still being discussed and harmonised across government [38]. In February 2026 a director general told parliament the goal was to have the regulation set by the President during 2026 [39]. Meanwhile, petitioners asked the Constitutional Court in case 236/PUU-XXIV/2026 to order the government to issue the implementing regulations within two years. At the hearing on 27 July 2026, the ministry, acting for the President, argued that a court-imposed deadline was unnecessary because it already performs interim supervision and a complaints mechanism exists [40, 56]. The court's case record lists hearings until 11 August 2026 and the President's written conclusion dated 19 August 2026, and no ruling as of 26 October 2026 [57, 41].

Then came Government Regulation 33 of 2026, enacted on 16 July 2026. After a six-month transition, non-compliance becomes subject to administrative sanctions from 16 January 2027. The 72-hour breach clock starts once a data protection failure has been established, and fines can reach 2% of annual revenue [42]. As of 3 September 2026 the regulation had not appeared in the State Secretariat's official legal database, so this account relies on legal summaries of the circulating text [42]. In other words, from 16 January 2027 Indonesian organisations face a firm notification clock that points at an institution which, as of this writing, has not been created.


### 5.4 A stress test that already happened

Indonesia has already seen what weak incident capacity costs, in a case unrelated to AI. On 20 June 2024, ransomware reported as a LockBit 3.0 variant called Brain Cipher compromised the temporary national data centre (PDNS). According to press reports, at least 210 institutions were affected, immigration services were disrupted, and the attackers demanded about US$8 million [43]. The communications ministry told parliament that only a small share of the data, about 2%, had been backed up, and the minister cited budget limits [44]:

<blockquote data-src="44">
<p lang="id">... persoalan terkait keterbatasan anggaran dan kesulitan menjelaskan ke keuangan dan auditor.</p>
<p class="tr">Translation: "... the problem relates to budget limits and the difficulty of explaining it to finance and auditors."</p>
<footer>Budi Arie Setiadi, then Minister of Communication and Informatics, explaining why there was no backup, as reported by CNBC Indonesia, 28 June 2024 [44].</footer>
</blockquote>

The head of the national cyber agency told parliament: <q data-src="45" lang="id">Kita kan tidak ada backup-nya</q> ("We simply had no backup") [45]. These figures come from press reports of the parliamentary hearings, not from the ministry's own record. The point here is not AI. It is that incident response depends on institutions that exist before the incident, with budgets and mandates already settled.


### 5.5 The cyber channel

Indonesia does have a national cyber and crypto agency, BSSN, which is the natural recipient for an intrusion by an AI agent. Its legal footing is still being worked out. Parliament and the government resumed deliberation of a cybersecurity and resilience bill in mid-2026 and formed a working committee, and commentators have urged that the bill settle what BSSN does and what the digital ministry does [46]. Until that is settled, an incident that is both a cyber intrusion and an AI incident has two plausible owners and no rule for choosing between them.


## 6. A thought experiment: the Medicare sequence in Indonesia

To make the gap concrete, Table 4 runs the Australian sequence through Indonesian institutions as they stood on 26 October 2026. The middle column is documented fact. The right column is my assessment, not a prediction of how any official would act.

**Table 4. Where the notice would land**

| Step | Australia, 2026 (documented) | Indonesia, October 2026 (assessment) |
|---|---|---|
| Developer finds its agent accessed a government portal | Email to a public disclosures mailbox, 84 days after the access [2] | No designated AI incident intake point. The draft ethics rule asks ministries for incident channels but is unsigned [12]. |
| Escalation to the cyber authority | Services Australia reports to the national cyber centre four days after seeing the email [2] | BSSN exists and could receive it. Its division of duties with the digital ministry is still under debate in the cybersecurity bill [46]. |
| Personal data may be involved | No personal data found, per the government and OpenAI [2] | The portal operator must notify the lembaga within 3 x 24 hours. The lembaga does not exist; sanctions under GR 33/2026 apply from 16 January 2027 [8, 42]. |
| Connecting it with other incidents | The government says its AI Safety Institute will work on the response [2] | No body has a mandate to connect AI incident reports across sectors. Indonesia was not a founding member of the international network of AI safety institutes [28]. |
| Political escalation and public disclosure | Prime Minister raises it with the developer and goes public [2] | No precedent. The national AI task force starts only after the regulations are signed [31]. |

_Right column: author's assessment based on the sources cited._

The striking result is not that Indonesia would do worse than Australia. Australia's own notice went to a public mailbox. It is that Indonesia has chosen, on paper, the broadest reporting design of the two, while lacking the receiving institutions at every step where they would matter.


## 7. Where this argument stops

An honest version of this argument has limits, and readers should weigh them.

- **Indonesia hosts no frontier developer.** Its rules cannot make a developer in another country report. What they can do is give that developer, and Indonesian operators, a place to send a report.
- **A data breach is not an AI incident.** The PDP clock covers personal data failures. Most misaligned agent activity reported so far involved no personal data. I use the PDP institution as evidence of institutional follow-through, not as the right home for AI incidents.
- **I have no evidence that any Indonesian system was affected by the 2026 incidents.** OpenAI publishes anonymised summaries, and public reporting does not name the more than 100 organisations notified [1].
- **The draft AI ethics text is not public.** My account of its content relies on officials' statements reported by ANTARA [6, 12]. The text may contain provisions those statements did not mention.
- **Some sources are secondary.** The full text of GR 33/2026 had not been officially published when this was written, so I rely on legal summaries for it, and say so in the text.
- **Broad reporting has costs.** A report-everything regime without triage can bury a small team in noise. The recommendation below keeps broad reporting but separates whether to report from how fast to respond.
- **The problem is not uniquely Indonesian.** The Australian case shows that a well-resourced country can also lack a designated channel. Indonesia is a well-documented example, not an outlier.


## 8. Recommendations

These are my recommendations. They are written to be achievable within months, not years.


### For the Government of Indonesia

- **Publish one AI incident intake point now.** Name an address, a form and a response target, with a named unit behind it, without waiting for the Perpres. Whether a ministerial announcement is a sufficient legal basis is a question for Indonesian lawyers. A published contact point costs little and fixes the "public mailbox" problem directly.
- **Decide who owns intrusions by AI agents.** Write the split into the cybersecurity bill and the AI ethics regulation: BSSN for the intrusion, the digital ministry for the AI system's behaviour, and a duty to share reports between them within a fixed time.
- **Form the data protection institution before 16 January 2027.** Otherwise the 72-hour clock in GR 33/2026 starts running toward a recipient that does not exist.
- **Keep report-everything, and add triage.** Use severity tiers to set response times, not to decide whether something gets reported. Publish anonymised aggregate statistics so that patterns are visible outside government.
- **Publish the draft texts, and add two provisions.** One on general-purpose models. One on systems developed abroad that act on Indonesian systems, including during a developer's training or evaluation.


### For frontier AI developers

- **Adopt a cross-border notification norm.** When an agent affects a system in another country, notify both the operator and that country's national cyber authority within a fixed window, and publish the standard. OpenAI says it is developing notification and disclosure standards it hopes the wider industry can adopt [1]. This would make that standard reach governments, not only website owners.


### For international bodies

- **Maintain a shared directory of national AI incident contacts.** The OECD's common reporting framework, ASEAN's incident reporting recommendation and the international network of AI safety institutes are natural homes [15, 29, 28]. A directory turns CSET's federated model into something that works across borders [14].


### What I will track

Monsoon Ledger will track these points publicly, with the same method as the promise ledger: whether a published intake point appears, whether the Perpres is signed by 31 December 2026, whether the data protection institution exists by 16 January 2027, and how the Constitutional Court rules in case 236/PUU-XXIV/2026 [7, 41].


## 9. Method, evidence and disclosures

**As-of date.** All facts are as of 26 October 2026 unless stated. Several investigations described in Section 2 are ongoing.

**Evidence levels.** I distinguish four kinds of source. Legal text: Articles 46, 58 and 74 of Law 27 of 2022, Articles 55 and 73 of the EU AI Act, Regulation (EU) 2026/1744, the safety and security chapter of the EU code of practice, and the incident reporting sections of California's SB 53 and the New York RAISE Act chapter amendment, checked against the original text. Official statements: officials' remarks reported by ANTARA and other Indonesian outlets, OpenAI's and Hugging Face's own disclosures, and the Australian Prime Minister as reported by ABC News. Independent investigation: METR and Redwood Research, and the researchers who documented the DSE wiki activity. Secondary analysis and press reports: law firm summaries and technology press, used where primary text was not available and flagged in the text.

**Deadlines.** Each dated promise is converted into a deadline using the latest plausible reading of the official's words, so that every "missed" status can be defended. The rules are published with the ledger [7].

**Language.** Indonesian legal text and quotations are given in the original, followed by my translation on a separate line.

**Independence.** This paper was written independently, with no funding and no affiliation with any government, company or organisation named in it. Corrections are welcome through the project's public repository, and will be logged with dates.

**Use of AI tools.** AI tools were used to help search, organise and draft. Factual claims were checked against the sources cited; Section 7 and the list of changes to this paper say where a primary source could not be reached.


## Appendix A. Indonesia's AI regulation promises

**Table A1. Public promises about Indonesia's AI regulations, newest first**

<div data-table="promises"></div>

_Source: Monsoon Ledger promise ledger, with archived copies of each source [7]._


## Appendix B. Terms used

| Term | Meaning in this paper |
|---|---|
| BSSN | Badan Siber dan Sandi Negara, Indonesia's national cyber and crypto agency. |
| Circular letter (Surat Edaran) | Ministerial guidance. Not a binding regulation. |
| General-purpose model | A model that can perform a wide range of tasks, such as a large language model. The EU AI Act adds duties for those with systemic risk. |
| GR (PP) | Government Regulation (Peraturan Pemerintah), which implements a law. |
| Komdigi | Kementerian Komunikasi dan Digital, the Ministry of Communication and Digital Affairs (formerly Kominfo). |
| Lembaga | The data protection supervisory institution required by Article 58 of Law 27 of 2022. |
| Loss of control | Scenarios where AI systems operate outside anyone's control with no clear path to regaining it, per the International AI Safety Report 2026. |
| Misaligned agent activity | Actions by an AI agent that pursue its task by means its developer did not intend or permit. |
| Perpres | Peraturan Presiden, a presidential regulation. |
| PDNS | Pusat Data Nasional Sementara, Indonesia's temporary national data centre. |
