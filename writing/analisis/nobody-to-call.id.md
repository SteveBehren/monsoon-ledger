---
id: nobody-to-call
number: 1
lang: id
partial: true
title: Tak Ada yang Bisa Dihubungi
subtitle: Insiden AI garda depan kini mendarat di sistem milik negara lain. Indonesia memperlihatkan apa yang terjadi ketika tidak ada pihak yang siap menerimanya.
author: Stephen Behren Tanjung
published: 2026-10-27
facts_as_of: 2026-10-26
version: "1.0"
sources: data/analysis/nobody-to-call.sources.yml
docx: analysis/Nobody_to_Call_Monsoon_Ledger_Analysis_01.docx
summary: Ketika agen AI garda depan bertindak di sistem negara lain, pemberitahuannya harus diterima oleh seseorang; makalah ini mencatat insiden 2026, aturan pelaporannya, dan pihak penerima yang belum ada di Indonesia.
en_sections:
  temuan-utama: key-findings
  ringkasan-eksekutif: executive-summary
  7-batas-argumen-ini: 7-where-this-argument-stops
  8-rekomendasi: 8-recommendations
---

<!--
Terjemahan draf dari bagian-bagian yang diminta: judul dan subjudul, temuan utama,
ringkasan eksekutif, bagian 7 dan bagian 8. Menunggu tinjauan penulis.
TODO author: tinjau terjemahan ini, terutama istilah "AI garda depan" untuk frontier AI.
Nomor sumber sama dengan teks bahasa Inggris (data/analysis/nobody-to-call.sources.yml).
-->

## Temuan utama

1. **Insiden AI garda depan kini mendarat di sistem milik pihak lain.** Pada 2026, agen OpenAI yang tidak selaras bertindak di sistem pihak ketiga saat pelatihan dan evaluasi. Hingga 26 September 2026, OpenAI sudah memberi tahu lebih dari 100 organisasi, dan menurut OpenAI, sebagian situs web yang terdampak dikelola oleh pemerintah dan lembaga publik [1].
2. **Pemberitahuan datang terlambat dan lewat jalur seadanya.** Sebuah agen OpenAI mengakses portal statistik Medicare Australia pada 18 Juni 2026. Pemerintah Australia baru mengetahuinya dari surel ke kotak surat pengungkapan publik yang dikirim pada 10 September, {{frontier:openai-medicare-portal-2026:days_access_to_notice}} hari kemudian [2].
3. **Aturan AI garda depan saat ini mengirim laporan ke regulator di negara asal pengembang, bukan ke negara yang sistemnya tersentuh.** Ini berlaku untuk kewajiban bagi model serbaguna dalam AI Act Uni Eropa, SB 53 di California, dan RAISE Act di New York [3, 50, 52, 4, 5].
4. **Di atas kertas, Indonesia memilih rancangan yang ambisius.** Pada Juni 2026, kementerian digital menolak permintaan industri AS untuk membatasi pelaporan insiden hanya pada AI berisiko tinggi, dan tetap meminta semua insiden dilaporkan [6]. Regulasi yang memuat pilihan ini belum ditandatangani. Sejak Januari 2025, pejabat sudah lima kali menyebut tenggat penyelesaian, dan empat di antaranya sudah lewat [7].
5. **Lembaga penerima yang sudah disebut dalam hukum Indonesia belum ada.** UU Pelindungan Data Pribadi tahun 2022 mewajibkan pemberitahuan kegagalan pelindungan data pribadi dalam 3 x 24 jam kepada _lembaga_, yaitu lembaga pengawas. Undang-undang itu tidak menetapkan tanggal pembentukannya, meski organisasi diberi waktu sampai 17 Oktober 2024 untuk menyesuaikan diri, dan lembaga itu sampai sekarang belum dibentuk [8, 9, 10, 55].
6. **Perbaikannya lebih kecil daripada undang-undang baru.** Yang dibutuhkan adalah satu titik penerimaan laporan insiden AI yang diumumkan dan punya staf, pembagian tugas yang jelas dengan badan siber nasional, serta norma pemberitahuan lintas batas yang dipatuhi pengembang AI garda depan di mana pun agen mereka bertindak.


## Ringkasan eksekutif

Pelaporan insiden sering disebut sebagai lapisan peringatan dini dalam tata kelola AI garda depan, yaitu model AI yang paling canggih. Perdebatan kebijakan selama ini berfokus pada separuh masalah: apa yang wajib dilaporkan pengembang, dan kepada regulator mana di negara asalnya. Insiden sepanjang 2026 memperlihatkan separuh lainnya. Ketika agen AI bertindak di dunia nyata, jejak pertamanya sering muncul di sistem milik pihak lain, kadang di negara lain. Supaya sinyal itu berarti, negara yang terdampak butuh tiga hal: tempat informasi itu diterima, orang yang bisa membacanya, dan kewenangan untuk bertindak.

Makalah ini memakai Indonesia sebagai kasus terdokumentasi tentang apa yang terjadi ketika pihak penerima itu tidak ada. Indonesia bukan pengembang AI garda depan, dan saya tidak mengklaim Indonesia menghadapi risiko hilangnya kendali dari industrinya sendiri. Klaim saya lebih sempit. Pihak penerima informasi insiden adalah bagian dari infrastruktur keselamatan AI garda depan, dan bagian ini belum ada di banyak negara. Indonesia adalah salah satu negara tempat jarak antara janji pejabat dan lembaga yang benar-benar ada bisa diukur dengan tepat.

Buktinya terbagi tiga. Pertama, serangkaian insiden 2026 yang melibatkan model OpenAI: pembobolan Hugging Face, pemakaian sebuah wiki Jerman yang sudah lama tidak aktif sebagai papan pesan antaragen, dan akses ke portal Medicare Australia. Dalam setiap kasus, pihak ketiga atau peneliti luar yang lebih dulu melihat aktivitas itu, pemberitahuan butuh waktu berminggu-minggu sampai berbulan-bulan, dan jalur pelaporannya seadanya [1, 11, 2]. Kedua, pemetaan aturan pelaporan yang berlaku. Setiap instrumen utama untuk AI garda depan mengarahkan laporan ke regulator pengembang, dan tidak satu pun mewajibkan pengembang memberi tahu otoritas negara ketiga tempat sistemnya bertindak [3, 4, 5]. Ketiga, dokumentasi tentang Indonesia. Rancangan regulasi etika AI meminta semua insiden dilaporkan, tetapi belum ditandatangani dan tidak menyebut penerima untuk insiden AI garda depan. UU Pelindungan Data Pribadi sudah mengarahkan pemberitahuan kegagalan pelindungan data ke lembaga yang belum ada [6, 12, 8].

Rekomendasinya praktis. Indonesia bisa mengumumkan satu titik penerimaan laporan insiden AI sebelum regulasinya ditandatangani, memutuskan badan mana yang menangani penyusupan oleh agen AI, dan membentuk lembaga pelindungan data sebelum sanksi berdasarkan Peraturan Pemerintah 33/2026 mulai berlaku pada 16 Januari 2027. Pengembang AI garda depan bisa menerapkan norma pemberitahuan lintas batas yang menjangkau otoritas siber nasional negara terdampak, bukan hanya pemilik situs web. Badan internasional bisa mengelola direktori bersama berisi kontak nasional untuk insiden AI, supaya pemberitahuan berikutnya tidak berakhir di kotak surat publik.


## 7. Batas argumen ini

Argumen ini punya batas, dan pembaca sebaiknya ikut menimbangnya.

- **Indonesia tidak menjadi rumah bagi pengembang AI garda depan.** Aturannya tidak bisa memaksa pengembang di negara lain untuk melapor. Yang bisa dilakukan aturan itu adalah memberi pengembang tersebut, dan operator di Indonesia, tempat untuk mengirim laporan.
- **Kebocoran data bukan insiden AI.** Tenggat dalam UU PDP berlaku untuk kegagalan pelindungan data pribadi. Sebagian besar aktivitas agen tidak selaras yang dilaporkan sejauh ini tidak melibatkan data pribadi. Saya memakai lembaga PDP sebagai bukti soal tindak lanjut kelembagaan, bukan sebagai tempat yang tepat untuk menampung insiden AI.
- **Saya tidak punya bukti bahwa ada sistem di Indonesia yang terdampak insiden 2026.** OpenAI menerbitkan ringkasan tanpa nama, dan pemberitaan publik tidak menyebut lebih dari 100 organisasi yang diberi tahu [1].
- **Naskah rancangan regulasi etika AI tidak dipublikasikan.** Gambaran saya tentang isinya bergantung pada pernyataan pejabat yang diberitakan ANTARA [6, 12]. Naskahnya mungkin memuat ketentuan yang tidak disebut dalam pernyataan itu.
- **Sebagian sumber bersifat sekunder.** Naskah lengkap PP 33/2026 belum dipublikasikan secara resmi saat makalah ini ditulis, jadi saya bergantung pada ringkasan hukum untuk peraturan itu, dan menyebutkannya di dalam teks.
- **Pelaporan yang luas ada biayanya.** Kewajiban melaporkan semua hal tanpa pemilahan bisa membuat tim kecil kewalahan oleh laporan yang tidak penting. Rekomendasi di bawah tetap mempertahankan pelaporan yang luas, tetapi memisahkan soal perlu melapor atau tidak dari soal seberapa cepat laporan harus ditanggapi.
- **Masalah ini tidak hanya terjadi di Indonesia.** Kasus Australia menunjukkan bahwa negara dengan sumber daya besar pun bisa tidak punya jalur resmi. Indonesia adalah contoh yang terdokumentasi dengan baik, bukan pengecualian.


## 8. Rekomendasi

Ini rekomendasi saya. Semuanya disusun supaya bisa dicapai dalam hitungan bulan, bukan tahun.


### Untuk Pemerintah Indonesia

- **Umumkan satu titik penerimaan laporan insiden AI sekarang.** Sebutkan alamat, formulir, dan target waktu tanggapan, dengan unit yang jelas di belakangnya, tanpa menunggu Perpres. Apakah pengumuman menteri sudah cukup sebagai dasar hukum adalah pertanyaan untuk ahli hukum Indonesia. Kontak yang diumumkan tidak mahal dan langsung mengatasi masalah kotak surat publik.
- **Tentukan siapa yang menangani penyusupan oleh agen AI.** Tuliskan pembagiannya dalam RUU keamanan siber dan regulasi etika AI: BSSN untuk penyusupannya, kementerian digital untuk perilaku sistem AI-nya, dan kewajiban saling berbagi laporan dalam jangka waktu tertentu.
- **Bentuk lembaga pelindungan data sebelum 16 Januari 2027.** Kalau tidak, tenggat 72 jam dalam PP 33/2026 mulai berjalan menuju penerima yang belum ada.
- **Pertahankan kewajiban melaporkan semua insiden, dan tambahkan pemilahan.** Gunakan tingkat keparahan untuk menentukan waktu tanggapan, bukan untuk menentukan apakah sesuatu perlu dilaporkan. Terbitkan statistik gabungan tanpa nama supaya polanya terlihat dari luar pemerintah.
- **Publikasikan naskah rancangannya, dan tambahkan dua ketentuan.** Satu tentang model serbaguna. Satu lagi tentang sistem yang dikembangkan di luar negeri dan bertindak di sistem Indonesia, termasuk saat pengembang melakukan pelatihan atau evaluasi.


### Untuk pengembang AI garda depan

- **Terapkan norma pemberitahuan lintas batas.** Ketika agen memengaruhi sistem di negara lain, beri tahu operatornya dan otoritas siber nasional negara itu dalam jangka waktu tertentu, lalu umumkan standarnya. OpenAI mengatakan sedang menyusun standar pemberitahuan dan pengungkapan yang diharapkan bisa diadopsi industri secara lebih luas [1]. Norma ini akan membuat standar itu menjangkau pemerintah, bukan hanya pemilik situs web.


### Untuk badan internasional

- **Kelola direktori bersama berisi kontak nasional untuk insiden AI.** Kerangka pelaporan bersama OECD, rekomendasi pelaporan insiden ASEAN, dan jaringan internasional lembaga keselamatan AI adalah tempat yang cocok untuk direktori ini [15, 29, 28]. Direktori seperti ini mengubah model federasi yang diusulkan CSET menjadi sesuatu yang berjalan lintas batas [14].


### Yang akan saya pantau

Monsoon Ledger akan memantau poin-poin ini secara terbuka, dengan metode yang sama seperti catatan janji: apakah titik penerimaan laporan diumumkan, apakah Perpres ditandatangani paling lambat 31 Desember 2026, apakah lembaga pelindungan data sudah ada paling lambat 16 Januari 2027, dan bagaimana putusan Mahkamah Konstitusi dalam perkara 236/PUU-XXIV/2026 [7, 41].
